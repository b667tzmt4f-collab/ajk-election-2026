// ─────────────────────────────────────────────────────────────────────────
// lib/sheetSync.ts
//
// Pull-based Google Sheet sync — same pattern as your student-CRM:
//   1. Sheet published as CSV via File → Share → Publish to web → CSV.
//   2. Click "Sync Now" on /enter — fetches the CSV, matches rows to
//      existing `candidates` records by (seat_id + candidate_name),
//      upserts votes_2026 for every match.
//
// Uses PapaParse for CSV parsing (already in the project's dependencies)
// to avoid hand-rolled parser edge cases with \r\n line endings, quoted
// fields, and Google Sheets' CSV dialect.
// ─────────────────────────────────────────────────────────────────────────

import Papa from 'papaparse'
import { supabase } from './supabase'

export type SheetRow = {
  seat_id: string
  candidate_name: string
  votes_2026: number
}

export type SyncResult = {
  matched: number
  unmatched: SheetRow[]
  skippedBlank: number
  totalRows: number
  error?: string
}

// ── Fetch + parse ────────────────────────────────────────────────────────
async function fetchSheetRows(csvUrl: string): Promise<SheetRow[]> {
  // cache:'no-store' forces a fresh fetch every time — Google Sheets CSVs
  // are aggressively cached by default and would serve stale data otherwise.
  const res = await fetch(csvUrl, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(
      `Sheet fetch failed: HTTP ${res.status}. ` +
      `Check the published CSV URL is still valid and the sheet is published as CSV, not as a web page.`
    )
  }
  const text = await res.text()

  // PapaParse handles \r\n, \n, quoted fields, and Google's CSV dialect
  // reliably — replacing the hand-rolled parser that had \r\n edge cases.
  const { data, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,           // first row = column names
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  if (errors.length > 0) {
    console.warn('PapaParse warnings:', errors)
  }

  if (!data || data.length === 0) {
    throw new Error('Sheet appears empty — expected a header row plus at least one data row.')
  }

  // Validate required columns exist
  const sample = data[0]
  const missing = ['seat_id', 'candidate_name', 'votes_2026'].filter(k => !(k in sample))
  if (missing.length > 0) {
    throw new Error(
      `Sheet is missing required columns: ${missing.join(', ')}. ` +
      `Found: ${Object.keys(sample).join(', ')}.`
    )
  }

  const rows: SheetRow[] = []
  for (const r of data) {
    const seat_id       = (r['seat_id'] || '').trim()
    const candidate_name = (r['candidate_name'] || '').trim()
    const votesRaw      = (r['votes_2026'] || '').trim()

    if (!seat_id || !candidate_name) continue

    // NaN = blank cell = skip (not yet reported).
    // Explicit 0 = write 0 (intentional reset).
    const votes_2026 = votesRaw === '' ? NaN : parseInt(votesRaw.replace(/,/g, ''), 10)
    rows.push({ seat_id, candidate_name, votes_2026 })
  }
  return rows
}

// ── Sync ─────────────────────────────────────────────────────────────────
// ADDITIVE-SAFE: blank votes_2026 cells are skipped — they never overwrite
// existing results with zero. Type 0 explicitly to intentionally reset a seat.
export async function syncFromSheet(csvUrl: string): Promise<SyncResult> {
  const result: SyncResult = { matched: 0, unmatched: [], skippedBlank: 0, totalRows: 0 }

  let sheetRows: SheetRow[]
  try {
    sheetRows = await fetchSheetRows(csvUrl)
  } catch (err: any) {
    return { ...result, error: err.message || 'Unknown error fetching sheet.' }
  }
  result.totalRows = sheetRows.length

  // Load all candidates once — match in memory to avoid 500+ individual SELECTs
  const { data: candidates, error: fetchErr } = await supabase
    .from('candidates')
    .select('id, seat_id, candidate_name')

  if (fetchErr || !candidates) {
    return { ...result, error: `Could not load candidates from Supabase: ${fetchErr?.message}` }
  }

  // Key: "LA-1::chaudhary azhar sadiq" — lowercase for forgiving match
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

  for (const u of updates) {
    const { error } = await supabase
      .from('candidates')
      .update({ votes_2026: u.votes_2026, updated_at: new Date().toISOString() })
      .eq('id', u.id)
    if (error) {
      result.error = `Write failed on candidate id ${u.id}: ${error.message}`
      break
    }
  }

  return result
}
