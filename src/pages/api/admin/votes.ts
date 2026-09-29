// ─────────────────────────────────────────────────────────────────────────
// src/pages/api/admin/votes.ts
//
// POST /api/admin/votes   body: { updates: [{ id, votes_2026 }, ...] }
// Admin only. Saves 2026 vote counts for many candidates in ONE database
// statement, so a save is all-or-nothing (no half-saved seats if the
// connection drops midway, unlike the old one-row-at-a-time loop).
// ─────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { sql } from '@/lib/neon'
import { requireAdmin } from '@/lib/adminAuth'

const MAX_UPDATES = 2000 // far above the ~524 candidates; blocks abuse

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!(await requireAdmin(req, res))) return

  const updates = req.body?.updates
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'No updates sent' })
  }
  if (updates.length > MAX_UPDATES) {
    return res.status(400).json({ error: `Too many updates (max ${MAX_UPDATES})` })
  }

  // Validate EVERY row before writing ANY row.
  const ids: number[] = []
  const votes: number[] = []
  for (const u of updates) {
    const id = Number(u?.id)
    const v = Number(u?.votes_2026)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: `Invalid candidate id: ${u?.id}` })
    }
    if (!Number.isInteger(v) || v < 0 || v > 10_000_000) {
      return res.status(400).json({ error: `Invalid vote count "${u?.votes_2026}" for candidate ${id}` })
    }
    ids.push(id)
    votes.push(v)
  }

  try {
    // unnest() pairs the two arrays row by row: (id[0], votes[0]), (id[1], votes[1]) ...
    const rows = await sql.query(
      `UPDATE candidates AS c
          SET votes_2026 = u.v, updated_at = now()
         FROM unnest($1::int[], $2::int[]) AS u(id, v)
        WHERE c.id = u.id
        RETURNING c.id`,
      [ids, votes],
    )
    return res.status(200).json({ updated: rows.length, requested: ids.length })
  } catch (err) {
    console.error('[api/admin/votes] failed:', err)
    return res.status(500).json({ error: 'Database write failed; nothing was saved' })
  }
}
