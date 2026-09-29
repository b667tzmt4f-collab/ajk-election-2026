// ─────────────────────────────────────────────────────────────────────────
// src/pages/api/admin/seat-score.ts
//
// POST /api/admin/seat-score   body: one seat's score object
// Admin only. Inserts the seat, or updates it if it already exists
// (same as the old Supabase upsert on seat_id).
//
// Only the columns listed in COLUMNS are ever written. Anything else in
// the request is ignored, so a bad request can't touch other columns.
// ─────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/neon'
import { requireAdmin } from '@/lib/adminAuth'

const COLUMNS = [
  'kpi_ground_org', 'kpi_historical', 'kpi_religious', 'kpi_structural',
  'kpi_candidate', 'kpi_social_media', 'kpi_score',
  'party_weight_pct', 'dominant_party', 'party_score',
  'projected_winner', 'projected_party', 'runner_up_name', 'runner_up_party',
  'confidence', 'analyst_note', 'stage',
] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!(await requireAdmin(req, res))) return

  const body = req.body || {}
  const seatId = String(body.seat_id || '')
  if (!/^LA-\d{1,2}$/.test(seatId)) {
    return res.status(400).json({ error: `Invalid seat_id "${seatId}"` })
  }

  const values = COLUMNS.map((c) => (body[c] === undefined ? null : body[c]))
  const colList = ['seat_id', ...COLUMNS].join(', ')
  const placeholders = ['$1', ...COLUMNS.map((_, i) => `$${i + 2}`)].join(', ')
  const updateSet = COLUMNS.map((c) => `${c} = EXCLUDED.${c}`).join(', ')

  try {
    await sql.query(
      `INSERT INTO seat_scores (${colList}) VALUES (${placeholders})
       ON CONFLICT (seat_id) DO UPDATE SET ${updateSet}`,
      [seatId, ...values],
    )
    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('[api/admin/seat-score] failed:', err)
    return res.status(500).json({ error: err?.message || 'Database write failed' })
  }
}
