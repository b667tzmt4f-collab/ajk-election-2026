// ─────────────────────────────────────────────────────────────────────────
// src/hooks/useLiveResults.ts
//
// Live results for the home page and /live.
//
// CHANGE FROM SUPABASE VERSION:
//   Before: a Supabase realtime channel pushed every vote update instantly.
//   Now:    the page re-checks the server every POLL_MS (10 seconds).
//   Neon has no realtime push, and polling is simpler and more robust
//   under heavy election-night traffic (the server caches for 5s, so
//   thousands of visitors still cause very few database queries).
//
//   Polling pauses while the browser tab is hidden (saves data on phones)
//   and refreshes immediately when the visitor comes back.
//
// Everything this hook RETURNS is unchanged, so pages using it need no edits.
// ─────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react'
import type { Candidate, Constituency } from '@/lib/supabase' // types only; no Supabase connection
import { fetchTable } from '@/lib/api'

const POLL_MS = 10_000

export function useLiveResults() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [cands, seats] = await Promise.all([
        fetchTable<Candidate>('candidates'),
        fetchTable<Constituency>('constituencies'),
      ])
      setCandidates(cands)
      setConstituencies(seats)
      setError(null)
      setLastUpdated(new Date())
    } catch (err: any) {
      // Keep showing the last good data; just report the problem.
      setError(err?.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchAll()
    }, POLL_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchAll()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchAll])

  // ── Everything below is unchanged from the Supabase version ──────────
  const seatResults = constituencies.map((seat) => {
    const seatCands = candidates
      .filter((c) => c.seat_id === seat.seat_id)
      .sort((a, b) => b.votes_2026 - a.votes_2026)

    const totalVotes = seatCands.reduce((s, c) => s + c.votes_2026, 0)
    const hasVotes   = totalVotes > 0
    const winner     = hasVotes ? seatCands[0] : null
    const runner     = hasVotes && seatCands.length > 1 ? seatCands[1] : null

    return {
      ...seat,
      candidates: seatCands,
      total_votes_2026: totalVotes,
      has_results: hasVotes,
      winner,
      runner,
      margin_2026: winner && runner ? winner.votes_2026 - runner.votes_2026 : null,
    }
  })

  const seatsDecided = seatResults.filter((s) => s.has_results)
  const seatsPending = seatResults.filter((s) => !s.has_results)

  const partyTally: Record<string, number> = {}
  for (const s of seatsDecided) {
    if (s.winner) {
      partyTally[s.winner.party_2026] = (partyTally[s.winner.party_2026] || 0) + 1
    }
  }

  return {
    candidates,
    constituencies,
    seatResults,
    seatsDecided,
    seatsPending,
    partyTally,
    loading,
    error,
    lastUpdated,
    refetch: fetchAll,
  }
}
