// ─────────────────────────────────────────────────────────────────────────
// lib/sheetSync.ts
//
// Pull-based Google Sheet sync — same pattern as your student-CRM:
//   1. Build the sheet (one row per candidate).
//   2. File → Share → Publish to web → CSV. Copy that URL.
//   3. Paste the URL into NEXT_PUBLIC_RESULTS_SHEET_CSV_URL (.env.local /
//      Vercel env vars) or pass it directly to syncFromSheet().
//   4. Click "Sync" on /enter — this fetches the CSV, matches rows to
//      existing `candidates` records, and upserts votes_2026.
//
// No Apps Script, no webhook, no auth on the sheet side — it's a public
// read-only CSV endpoint, exactly like the CRM setup.
// ─────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase'

// Expected sheet columns (header row, exact names, case-insensitive match):
//   seat_id | candidate_name | votes_2026
//
// seat_id must match the LA-1..LA-45 format already in `candidates`.
// candidate_name must match `candidates.candidate_name` exactly (this is
// the field used to locate which row to update — see matching logic below).
export type SheetRow = {
  seat_id: string
  candidate_name: string
  votes_2026: number
}

export type SyncResult = {
  matched: number          // rows successfully matched + written
  unmatched: SheetRow[]    // rows that didn't match any candidate — needs review
  skippedBlank: number     // rows with an empty votes_2026 cell — left untouched
  totalRows: number
  error?: string
}

// ── CSV parsing ─────────────────────────────────────────────────────────
// Minimal, dependency-free CSV parser (no PapaParse needed for this simple
// 3-column shape). Handles quoted fields and embedded commas defensively,
// since candidate names occasionally contain commas (e.g. "Khan, Jr.").
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; continue }
      if (ch === '"') { inQuotes = false; continue }
      field += ch
      continue
    }

    if (ch === '"') { inQuotes = true; continue }
    if (ch === ',') { row.push(field); field = ''; continue }
    if (ch === '\r') { continue }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue }
    field += ch
  }
  // flush trailing field/row if the file doesn't end with a newline
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_')
}

// ── Fetch + parse ───────────────────────────────────────────────────────
async function fetchSheetRows(csvUrl: string): Promise<SheetRow[]> {
  // cache:'no-store' — published Google Sheet CSVs are aggressively cached
  // by default; we always want the latest edit on every sync click.
  const res = await fetch(csvUrl, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Sheet fetch failed: HTTP ${res.status}. Check the published CSV URL is still valid.`)
  }
  const text = await res.text()
  const table = parseCsv(text)
  if (table.length < 2) {
    throw new Error('Sheet appears empty — expected a header row plus at least one data row.')
  }

  const headers = table[0].map(normalizeHeader)
  const seatIdx = headers.indexOf('seat_id')
  const nameIdx = headers.indexOf('candidate_name')
  const votesIdx = headers.indexOf('votes_2026')

  if (seatIdx === -1 || nameIdx === -1 || votesIdx === -1) {
    throw new Error(
      `Sheet is missing required columns. Found: [${headers.join(', ')}]. ` +
      `Required: seat_id, candidate_name, votes_2026.`
    )
  }

  const rows: SheetRow[] = []
  for (const r of table.slice(1)) {
    const seat_id = (r[seatIdx] || '').trim()
    const candidate_name = (r[nameIdx] || '').trim()
    const votesRaw = (r[votesIdx] || '').trim()
    if (!seat_id || !candidate_name) continue   // skip fully blank rows
    rows.push({
      seat_id,
      candidate_name,
      votes_2026: votesRaw === '' ? NaN : parseInt(votesRaw.replace(/,/g, ''), 10),
    })
  }
  return rows
}

// ── Sync ─────────────────────────────────────────────────────────────────
// ADDITIVE-SAFE BY DEFAULT: a blank votes_2026 cell in the sheet is treated
// as "not yet reported" and is SKIPPED — it will never overwrite an existing
// non-blank result already in Supabase with a zero. This matters on election
// night: if you're mid-typing a number and accidentally hit sync, you won't
// blank out a seat that already has votes recorded.
//
// To intentionally reset a seat back to 0 (e.g. correcting a bad entry),
// type 0 explicitly in the sheet cell — an explicit 0 IS written.
export async function syncFromSheet(csvUrl: string): Promise<SyncResult> {
  const result: SyncResult = { matched: 0, unmatched: [], skippedBlank: 0, totalRows: 0 }

  let sheetRows: SheetRow[]
  try {
    sheetRows = await fetchSheetRows(csvUrl)
  } catch (err: any) {
    return { ...result, error: err.message || 'Unknown error fetching sheet.' }
  }
  result.totalRows = sheetRows.length

  // Pull current candidates once, so we match in memory instead of issuing
  // 45×N individual SELECTs.
  const { data: candidates, error: fetchErr } = await supabase
    .from('candidates')
    .select('id, seat_id, candidate_name')

  if (fetchErr || !candidates) {
    return { ...result, error: `Could not load candidates from Supabase: ${fetchErr?.message}` }
  }

  // Build a lookup keyed on (seat_id + lowercased name) for forgiving matches
  // against minor casing differences typed into the sheet.
  const byKey = new Map<string, number>()
  for (const c of candidates) {
    byKey.set(`${c.seat_id}::${c.candidate_name.trim().toLowerCase()}`, c.id)
  }

  const updates: { id: number; votes_2026: number }[] = []

  for (const row of sheetRows) {
    if (Number.isNaN(row.votes_2026)) { result.skippedBlank++; continue }

    const key = `${row.seat_id}::${row.candidate_name.trim().toLowerCase()}`
    const id = byKey.get(key)
    if (id === undefined) {
      result.unmatched.push(row)
      continue
    }
    updates.push({ id, votes_2026: row.votes_2026 })
    result.matched++
  }

  // Write sequentially with individual UPDATEs (mirrors the existing pattern
  // in pages/enter.tsx's handleSave — keeps this consistent with the rest of
  // the codebase rather than introducing a bulk-upsert RPC).
  for (const u of updates) {
    const { error } = await supabase
      .from('candidates')
      .update({ votes_2026: u.votes_2026, updated_at: new Date().toISOString() })
      .eq('id', u.id)
    if (error) {
      result.error = `Write failed partway through (after ${result.matched - updates.length + updates.indexOf(u)} rows): ${error.message}`
      break
    }
  }

  return result
}
