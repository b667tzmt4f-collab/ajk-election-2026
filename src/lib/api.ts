// ─────────────────────────────────────────────────────────────────────────
// src/lib/api.ts   (BROWSER-SAFE)
//
// How pages talk to OUR server (which talks to Neon).
//   fetchTable('constituencies')                 → public read (5s cached)
//   fetchTable('candidates', { fresh: true })    → skip the cache (admin pages)
//   saveVotes([{ id, votes_2026 }])              → admin write
//   saveSeatScore({ seat_id, ... })              → admin write
// All functions throw an Error with a readable message on failure.
// ─────────────────────────────────────────────────────────────────────────

export type TableName =
  | 'constituencies'
  | 'candidates'
  | 'elections_history'
  | 'seat_scores'
  | 'candidate_results'

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (body?.error) return body.error
  } catch {
    /* not JSON */
  }
  if (res.status === 401) return 'You are not logged in. Please sign in again.'
  if (res.status === 403) return 'This account is not allowed to make changes.'
  return `${fallback} (${res.status})`
}

export async function fetchTable<T>(name: TableName, opts: { fresh?: boolean } = {}): Promise<T[]> {
  // A unique "fresh" value makes the URL different each time, so the
  // CDN cache can't serve an older copy. Used right after saving.
  const url = `/api/table?name=${name}` + (opts.fresh ? `&fresh=${Date.now()}` : '')
  const res = await fetch(url)
  if (!res.ok) throw new Error(await readError(res, `Could not load ${name}`))
  return (await res.json()) as T[]
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res, 'Save failed'))
  return res.json()
}

export async function saveVotes(
  updates: { id: number; votes_2026: number }[],
): Promise<{ updated: number; requested: number }> {
  return postJson('/api/admin/votes', { updates })
}

export async function saveSeatScore(seat: { seat_id: string } & Record<string, unknown>) {
  return postJson('/api/admin/seat-score', seat)
}
