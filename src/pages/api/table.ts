// ─────────────────────────────────────────────────────────────────────────
// src/pages/api/table.ts
//
// Public READ endpoint:   GET /api/table?name=constituencies
// Returns every row of one allowed table as JSON, already sorted.
//
// Replaces the browser calling Supabase directly. The browser now asks
// OUR server, and only our server holds the database password.
//
// Safety:
//  • Only tables in ALLOWED can be read (anything else → 400).
//    The table name is never taken from the user as free text into SQL.
//  • Read-only. Writes will get their own protected endpoints later.
//  • Short CDN cache (5s) so thousands of election-night visitors
//    cause only ~1 database query every 5 seconds per table.
// ─────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/neon'

// table name → fixed ORDER BY. Seat IDs like "LA-2" / "LA-10" are sorted
// by their number so LA-2 comes before LA-10.
const SEAT_ORDER = `NULLIF(regexp_replace(seat_id, '\\D', '', 'g'), '')::int NULLS LAST, seat_id`

// Postgres type IDs the driver returns as text: 20 = bigint, 1700 = numeric.
const NUMERIC_TYPE_IDS = new Set([20, 1700])

const ALLOWED: Record<string, string> = {
  constituencies:    `SELECT * FROM constituencies ORDER BY ${SEAT_ORDER}`,
  candidates:        `SELECT * FROM candidates ORDER BY ${SEAT_ORDER}, rank_2021 NULLS LAST, id`,
  elections_history: `SELECT * FROM elections_history ORDER BY ${SEAT_ORDER}, election_year`,
  seat_scores:       `SELECT * FROM seat_scores ORDER BY ${SEAT_ORDER}`,
  candidate_results: `SELECT * FROM candidate_results ORDER BY id`,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const name = String(req.query.name ?? '')
  const query = ALLOWED[name]
  if (!query) {
    return res.status(400).json({ error: `Unknown table "${name}"` })
  }

  try {
    // fullResults gives us each column's Postgres type, so we can turn
    // big-integer and decimal columns back into real numbers. (The Neon
    // driver returns those as text to avoid rounding; Supabase returned
    // numbers, and the pages expect numbers, e.g. kpi_score.toFixed().)
    const result = await sql.query(query, [], { fullResults: true })
    const numericCols = result.fields
      .filter((f) => NUMERIC_TYPE_IDS.has(f.dataTypeID))
      .map((f) => f.name)
    const rows = result.rows.map((row: Record<string, unknown>) => {
      for (const col of numericCols) {
        const v = row[col]
        if (typeof v === 'string') row[col] = Number(v)
      }
      return row
    })
    res.setHeader('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=30')
    return res.status(200).json(rows)
  } catch (err) {
    // Log full detail on the server; send a short message to the browser.
    console.error(`[api/table] ${name} failed:`, err)
    return res.status(500).json({ error: 'Database read failed' })
  }
}
