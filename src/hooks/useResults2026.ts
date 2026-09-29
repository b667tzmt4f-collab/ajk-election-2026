// ─────────────────────────────────────────────────────────────────────────
// src/hooks/useResults2026.ts
//
// Final 2026 General Election results (from the results_2026 and
// party_results_2026 tables in Neon). Used by the Home page and, next,
// the Live/Results page.
//
// Returns:
//   seats        45 rows sorted LA-1 … LA-45 (declared or postponed)
//   parties      party totals incl. reserved seats, largest first
//   declared     number of seats with a result (38)
//   postponed    number of seats still to poll (7)
//   turnoutPct   overall turnout of declared seats, from the source
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { fetchTable } from '@/lib/api'

export type SeatResult2026 = {
  seat_id: string
  district: string
  phase: number
  polling_date: string
  status: 'declared' | 'postponed'
  winner_name: string | null
  winner_party: string | null
  winner_votes: number | null
  winner_pct: number | null
  runner_name: string | null
  runner_party: string | null
  runner_votes: number | null
  runner_pct: number | null
  margin: number | null
  registered: number | null
  votes_cast: number | null
  turnout_pct: number | null
  data_note: string | null
  source: string
}

export type PartyResult2026 = {
  party: string
  party_label: string
  votes: number
  vote_pct: number
  contested: number | null
  won_general: number
  reserved_women: number
  reserved_other: number
  total_seats: number
}

// Overall turnout published in the source (valid + rejected ÷ registered in
// the 38 seats that polled). Kept as a constant so it matches the source
// exactly rather than being re-derived (LA-29 lacks registered/cast data).
export const TURNOUT_2026_PCT = 48.24

export function useResults2026() {
  const [seats, setSeats] = useState<SeatResult2026[]>([])
  const [parties, setParties] = useState<PartyResult2026[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchTable<SeatResult2026>('results_2026'),
      fetchTable<PartyResult2026>('party_results_2026'),
    ])
      .then(([s, p]) => {
        setSeats(s)
        setParties(p)
      })
      .catch((err) => setError(err.message || 'Failed to load results'))
      .finally(() => setLoading(false))
  }, [])

  const declared = seats.filter((s) => s.status === 'declared').length
  const postponed = seats.filter((s) => s.status === 'postponed').length

  return { seats, parties, declared, postponed, turnoutPct: TURNOUT_2026_PCT, loading, error }
}
