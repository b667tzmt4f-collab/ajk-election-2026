import { useEffect, useState, useCallback } from 'react'
import { supabase, Candidate, Constituency } from '@/lib/supabase'

// ── useLiveResults ────────────────────────────────────────────────────────────
// Subscribes to Supabase real-time on the candidates table.
// Updates the moment any vote count changes — no polling, no refresh.

export function useLiveResults() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    const [{ data: cands }, { data: seats }] = await Promise.all([
      supabase.from('candidates').select('*').order('seat_id').order('rank_2021'),
      supabase.from('constituencies').select('*').order('seat_id'),
    ])
    if (cands) setCandidates(cands)
    if (seats) setConstituencies(seats)
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()

    // Real-time subscription — fires instantly when votes_2026 changes
    const channel = supabase
      .channel('live-votes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'candidates' },
        (payload) => {
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === (payload.new as Candidate).id
                ? { ...c, ...(payload.new as Candidate) }
                : c
            )
          )
          setLastUpdated(new Date())
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  // ── Derived seat-level results ────────────────────────────────────────────
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

  // Party tally from declared seats
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
    lastUpdated,
    refetch: fetchAll,
  }
}
