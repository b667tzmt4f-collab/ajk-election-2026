/**
 * /live — AJK General Election 2026: FINAL RESULTS
 * ------------------------------------------------------------------
 * Data source (same as /records, single source of truth):
 *   elections_history  → one row per seat per year (winner, margin, polled)
 *   candidate_results  → every candidate per seat per year (votes, rank)
 *
 * Why not useLiveResults()? That hook reads candidates.votes_2026, which
 * was only for election-day manual entry via /enter and is empty. The
 * hook is left untouched because index.tsx and /enter still use it.
 *
 * Seat status logic (auditable):
 *   declared  = a 2026 row exists in elections_history
 *   postponed = seat exists in history but has NO 2026 row
 *               (LA-18 to LA-24, Poonch & Sudhnoti)
 * Reserved seats (women, technocrat, ulema, overseas) come from the
 * reserved_seats table. Full-house tally = general winners + reserved rows,
 * both computed here, never stored as totals that could drift.
 * Nothing is hardcoded: tallies, counts and leader are computed from rows.
 */
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import PartyTallyBar from '@/components/PartyTallyBar'
import { partyColor } from '@/lib/supabase'
import { fetchTable } from '@/lib/api'
import { numSort } from '@/lib/utils'

type HistRow = {
  seat_id: string; seat_name: string; election_year: number
  winner: string; winner_party: string; winner_votes: number
  runner_up: string; runner_up_party: string; runner_up_votes: number
  total_votes_polled: number | null; margin_votes: number | null
  registered_voters: number | null
}
type ReservedRow = {
  id: number; category: string; member: string; party: string; source: string | null
}
type CandRow = {
  seat_id: string; election_year: number; rank: number
  candidate_name: string; party: string; votes: number
}

const YEAR = 2026
const TOTAL_GENERAL = 45
const MAJORITY = 23 // simple majority of 45 general seats
const HOUSE_TOTAL = 53    // 45 general + 8 reserved
const HOUSE_MAJORITY = 27 // simple majority of 53
// Display order for reserved categories
const RESERVED_ORDER = ['Women', 'Technocrats', 'Ulema', 'Overseas']

// Refugee seats are LA-34 to LA-45 (fixed by delimitation, not data-dependent)
const isRefugee = (sid: string) => parseInt(sid.split('-')[1]) >= 34

export default function LiveResults() {
  const [hist, setHist]       = useState<HistRow[]>([])
  const [cands, setCands]     = useState<CandRow[]>([])
  const [reserved, setReserved] = useState<ReservedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [filter, setFilter]   = useState<'All' | 'In-Region' | 'Refugee'>('All')
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)

  useEffect(() => {
    // Load both tables in parallel; surface any failure instead of silently showing 0
    Promise.all([
      fetchTable<HistRow>('elections_history'),
      fetchTable<CandRow>('candidate_results'),
    ])
      .then(([h, c]) => { setHist(h); setCands(c.filter(x => x.election_year === YEAR)) })
      .catch(err => {
        console.error('Final results load failed:', err)
        setError('Could not load results. Please refresh.')
      })
      .finally(() => setLoading(false))

    // Reserved seats load separately and fail soft: if this table is
    // unavailable, general results still show and the panel is hidden.
    fetchTable<ReservedRow>('reserved_seats_2026')
      .then(setReserved)
      .catch(err => console.error('reserved_seats_2026 load failed:', err))
  }, [])

  // ── Build one record per seat ─────────────────────────────────────────
  const seatIds = [...new Set(hist.map(r => r.seat_id))].sort(numSort)
  const seats = seatIds.map(sid => {
    const r26 = hist.find(r => r.seat_id === sid && r.election_year === YEAR)
    // Seat name: prefer 2026 row, else most recent historical row
    const nameRow = r26 ?? hist.filter(r => r.seat_id === sid)
                              .sort((a, b) => b.election_year - a.election_year)[0]
    const list = cands.filter(c => c.seat_id === sid).sort((a, b) => a.rank - b.rank)
    const listTotal = list.reduce((s, c) => s + (c.votes || 0), 0)
    return {
      seat_id: sid,
      seat_name: nameRow?.seat_name || sid,
      region: isRefugee(sid) ? 'Refugee' : 'In-Region',
      declared: !!r26,
      r26,
      candidates: list,
      // Vote-share denominator: total valid votes across listed candidates
      listTotal,
    }
  })

  const declared  = seats.filter(s => s.declared)
  const postponed = seats.filter(s => !s.declared)

  // Party tally computed live from declared 2026 rows
  const tally: Record<string, number> = {}
  for (const s of declared) {
    const p = s.r26!.winner_party
    tally[p] = (tally[p] || 0) + 1
  }
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]

  // Full house = general tally + one per reserved row
  const houseTally: Record<string, number> = { ...tally }
  for (const r of reserved) houseTally[r.party] = (houseTally[r.party] || 0) + 1
  const houseFilled = Object.values(houseTally).reduce((a, b) => a + b, 0)
  const houseTop = Object.entries(houseTally).sort((a, b) => b[1] - a[1])[0]
  // Known categories first, then any other found in the data,
  // so no row is ever silently dropped by a spelling difference
  const allCats = [
    ...RESERVED_ORDER,
    ...[...new Set(reserved.map(r => r.category))].filter(c => !RESERVED_ORDER.includes(c)),
  ]
  const reservedByCat = allCats
    .map(cat => ({ cat, rows: reserved.filter(r => r.category === cat) }))
    .filter(g => g.rows.length > 0)

  const filtered = seats.filter(s => filter === 'All' || s.region === filter)
  const sel = seats.find(s => s.seat_id === selectedSeat)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display">2026 Election Results</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
            Final results · Source: AJK Election Commission
            {postponed.length > 0 && ` · ${postponed.length} seats postponed`}
          </p>
        </div>
        <div className="flex gap-2">
          {(['All', 'In-Region', 'Refugee'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: '1px solid var(--border)',
                backgroundColor: filter === f ? 'var(--accent)' : 'var(--bg3)',
                color: filter === f ? '#fff' : 'var(--text2)',
                transition: 'background-color 0.15s, color 0.15s',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20" style={{ color: 'var(--text2)' }}>
          <p className="text-lg">Loading results...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-10" style={{ color: 'var(--negative)' }}>{error}</div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Seats declared" value={`${declared.length} / ${TOTAL_GENERAL}`}
                      sub="General seats" />
            <StatCard label="Seats postponed" value={postponed.length}
                      sub={postponed.length ? `${postponed[0].seat_id} to ${postponed[postponed.length - 1].seat_id}` : 'None'} />
            <StatCard label="Majority needed" value={MAJORITY} sub={`of ${TOTAL_GENERAL} general seats`} />
            {top
              ? <StatCard label="Largest party" value={`${top[0]} (${top[1]})`} color={partyColor(top[0])}
                          sub={top[1] >= MAJORITY ? 'Majority secured' : 'Short of majority'} />
              : <StatCard label="Largest party" value="—" sub="No results" />}
          </div>

          {/* Party tally */}
          {declared.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--text3)' }}>
                Seat Tally (general seats)
              </h3>
              <PartyTallyBar tally={tally} majority={MAJORITY} />
            </div>
          )}

          {/* Full house incl. reserved seats (only when reserved data loaded) */}
          {reserved.length > 0 && (
            <div className="card mb-6">
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                  Assembly: {houseFilled} of {HOUSE_TOTAL} seats filled (incl. reserved)
                </h3>
                {houseTop && (
                  <span className="text-sm font-semibold" style={{ color: partyColor(houseTop[0]) }}>
                    {houseTop[0]} {houseTop[1]} · {houseTop[1] >= HOUSE_MAJORITY ? 'majority' : 'short of majority'} ({HOUSE_MAJORITY} needed)
                  </span>
                )}
              </div>
              <PartyTallyBar tally={houseTally} majority={HOUSE_MAJORITY} />

              <h4 className="text-xs font-semibold uppercase tracking-wide mt-6 mb-3" style={{ color: 'var(--text3)' }}>
                Reserved seats ({reserved.length})
              </h4>
              <div className="grid sm:grid-cols-2 gap-4">
                {reservedByCat.map(g => (
                  <div key={g.cat}>
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text2)' }}>
                      {g.cat} ({g.rows.length})
                    </p>
                    <div className="space-y-1.5">
                      {g.rows.map(r => (
                        <div key={r.id} className="flex items-center justify-between text-sm gap-2">
                          <span style={{ color: 'var(--text)' }}>{r.member}</span>
                          <span className="badge text-white px-2 py-0.5 text-xs rounded font-semibold"
                                style={{ backgroundColor: partyColor(r.party) }}>
                            {r.party}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Seat list */}
            <div className="card">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--text3)' }}>
                Constituencies ({filtered.length})
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map(seat => (
                  <button key={seat.seat_id}
                    onClick={() => setSelectedSeat(selectedSeat === seat.seat_id ? null : seat.seat_id)}
                    className="w-full text-left p-3 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: selectedSeat === seat.seat_id ? 'var(--soft)' : 'var(--bg3)',
                      borderColor: selectedSeat === seat.seat_id ? 'var(--accent)' : 'var(--border)',
                      color: 'var(--text)',
                    }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs" style={{ color: 'var(--text3)' }}>{seat.seat_id} · </span>
                        <span className="text-sm font-medium">{seat.seat_name}</span>
                      </div>
                      {seat.declared ? (
                        <span className="badge text-white px-2 py-0.5 text-xs rounded font-semibold"
                              style={{ backgroundColor: partyColor(seat.r26!.winner_party) }}>
                          {seat.r26!.winner_party}
                        </span>
                      ) : (
                        <span className="badge px-2 py-0.5 text-xs rounded"
                              style={{ backgroundColor: 'var(--border)', color: 'var(--text3)' }}>
                          Postponed
                        </span>
                      )}
                    </div>
                    {seat.declared && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                        {seat.r26!.winner} · {seat.r26!.winner_votes?.toLocaleString()} votes
                        {seat.r26!.margin_votes != null && ` · margin ${seat.r26!.margin_votes.toLocaleString()}`}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Seat detail */}
            <div className="card">
              {!sel ? (
                <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text3)' }}>
                  ← Click a constituency to see the full result
                </div>
              ) : !sel.declared ? (
                <>
                  <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text3)' }}>
                    {sel.seat_id} — {sel.seat_name}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>
                    Polling in this constituency was postponed by the AJK Election Commission.
                    Results will appear here once polling is held.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text3)' }}>
                    {sel.seat_id} — {sel.seat_name}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
                    {sel.region}
                    {sel.r26!.registered_voters != null && ` · Registered ${sel.r26!.registered_voters.toLocaleString()}`}
                    {sel.r26!.total_votes_polled != null && ` · Polled ${sel.r26!.total_votes_polled.toLocaleString()}`}
                  </p>

                  {sel.candidates.length === 0 ? (
                    // Declared seat but no candidate-level rows: show winner/runner-up only
                    <p className="text-sm" style={{ color: 'var(--text2)' }}>
                      ✓ {sel.r26!.winner} ({sel.r26!.winner_party}) {sel.r26!.winner_votes?.toLocaleString()}<br />
                      {sel.r26!.runner_up} ({sel.r26!.runner_up_party}) {sel.r26!.runner_up_votes?.toLocaleString()}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sel.candidates.map(c => {
                        const pct = sel.listTotal ? ((c.votes / sel.listTotal) * 100).toFixed(1) : '0.0'
                        const isWinner = c.rank === 1
                        return (
                          <div key={`${c.rank}-${c.candidate_name}`} className="space-y-0.5">
                            <div className="flex justify-between text-sm">
                              <span style={{ fontWeight: isWinner ? 700 : 400,
                                             color: isWinner ? 'var(--accent)' : 'var(--text)' }}>
                                {isWinner && '✓ '}{c.candidate_name}
                              </span>
                              <span style={{ color: 'var(--text2)' }}>
                                {c.votes?.toLocaleString()} ({pct}%)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                                    style={{ backgroundColor: partyColor(c.party) }}>
                                {c.party}
                              </span>
                              <div className="flex-1 rounded h-2" style={{ backgroundColor: 'var(--border)' }}>
                                <div className="h-2 rounded"
                                     style={{ width: `${pct}%`, backgroundColor: partyColor(c.party) }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
