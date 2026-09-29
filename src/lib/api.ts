// ─────────────────────────────────────────────────────────────────────────
// src/lib/api.ts   (BROWSER-SAFE)
//
// Pages use this to ask OUR server for a table:
//     const seats = await fetchTable<Constituency>('constituencies')
//
// It calls /api/table?name=... (see src/pages/api/table.ts), which reads
// Neon on the server. No database password ever reaches the browser.
// ─────────────────────────────────────────────────────────────────────────

export type TableName =
  | 'constituencies'
  | 'candidates'
  | 'elections_history'
  | 'seat_scores'
  | 'candidate_results'

/** Fetch every row of one table. Throws an Error with a readable message on failure. */
export async function fetchTable<T>(name: TableName): Promise<T[]> {
  const res = await fetch(`/api/table?name=${name}`)
  if (!res.ok) {
    let msg = `Could not load ${name} (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      /* response was not JSON; keep the default message */
    }
    throw new Error(msg)
  }
  return (await res.json()) as T[]
}
