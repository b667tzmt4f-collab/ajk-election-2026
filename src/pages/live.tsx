/**
 * /live — AJK General Election 2026: FINAL RESULTS
 * ------------------------------------------------------------------
 * Data sources (single source of truth, nothing hardcoded):
 *   elections_history    → one row per seat per year (winner, margin, polled)
 *   candidate_results    → every candidate per seat per year (votes, rank)
 *   reserved_seats_2026  → reserved members (id, category, member, party, source)
 *
 * SEAT TYPE toggle (top of page):
 *   'all'     → full 53-seat house: elected + reserved, combined tally
 *   'general' → 45 directly elected seats only (FPTP)
 *   'reserved'→ 8 reserved seats only (women, technocrats, ulema, overseas)
 * The region filter (In-Region / Refugee) applies to general seats only,
 * so it is hidden in 'reserved' mode.
 *
 * Seat status logic (auditable):
 *   declared  = a 2026 row exists in elections_history
 *   postponed = seat exists in history but has NO 2026 row (LA-18 to LA-24)
 *
 * Structural constants below come from the constitution / delimitation,
 * not from results: 45 general + 8 reserved = 53.
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
type CandRow = {
  seat_id: string; election_year: number; rank: number
  candidate_name: string; party: string; votes: number
}
type ReservedRow = {
  id: number; category: string; member: string; party: string; source: string | null
}
type Mode = 'all' | 'general' | 'reserved'

const YEAR = 2026
const TOTAL_GENERAL  = 45
const TOTAL_RESERVED = 8
const HOUSE_TOTAL    = TOTAL_GENERAL + TOTAL_RESERVED // 53
const MAJORITY       = 23 // simple majority of 45 general seats
const HOUSE_MAJORITY = 27 // simple majority of 53
// Preferred display order; any other category in the data is shown after these
const RESERVED_ORDER = ['Women', 'Technocrats', 'Ulema', 'Overseas']

// Refugee seats are LA-34 to LA-45 (fixed by delimitation, not data-dependent)
const isRefugee = (sid: string) => parseInt(sid.split('-')[1]) >= 34

// Count occurrences of a key: used for every tally so logic is identical
function countBy<T>(rows: T[], key: (r: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) out[key(r)] = (out[key(r)] || 0) + 1
  return out
}
const topOf = (t: Record<string, number>) => Object.entries(t).sort((a, b) => b[1] - a[1])[0]

// Small segmented button used by both toggles
function Seg<T extends string>({ value, current, onClick, children }:
  { value: T; current: T; onClick: (v: T) => void; children: React.ReactNode }) {
  const on = value === current
  return (
    <button onClick={() => onClick(value)}
      style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
        cursor: 'pointer', border: '1px solid var(--border)',
        backgroundColor: on ? 'var(--accent)' : 'var(--bg3)',
        color: on ? '#fff' : 'var(--text2)',
        transition: 'background-color 0.15s, color 0.15s',
      }}>
      {children}
    </button>
  )
}

export default function LiveResults() {
  const [hist, setHist]         = useState<HistRow[]>([])
  const [cands, setCands]       = useState<CandRow[]>([])
  const [reserved, setReserved] = useState<ReservedRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [mode, setMode]         = useState<Mode>('all')
  const [filter, setFilter]     = useState<'All' | 'In-Region' | 'Refugee'>('All')
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)

  useEffect(() => {
    // General results: surface any failure instead of silently showing 0
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

    // Reserved seats fail soft: general results still show if this errors
    fetchTable<ReservedRow>('reserved_seats_2026')
      .then(setReserved)
      .catch(err => console.error('reserved_seats_2026 load failed:', err))
  }, [])

  // ── One record per general seat ───────────────────────────────────────
  const seatIds = [...new Set(hist.map(r => r.seat_id))].sort(numSort)
  const seats = seatIds.map(sid => {
    const r26 = hist.find(r => r.seat_id === sid && r.election_year === YEAR)
    const nameRow = r26 ?? hist.filter(r => r.seat_id === sid)
                              .sort((a, b) => b.election_year - a.election_year)[0]
    const list = cands.filter(c => c.seat_id === sid).sort((a, b) => a.rank - b.rank)
    return {
      seat_id: sid,
      seat_name: nameRow?.seat_name || sid,
      region: isRefugee(sid) ? 'Refugee' : 'In-Region',
      declared: !!r26,
      r26,
      candidates: list,
      // Vote-share denominator: total valid votes across listed candidates
      listTotal: list.reduce((s, c) => s + (c.votes || 0), 0),
    }
  })
  const declared  = seats.filter(s => s.declared)
  const postponed = seats.filter(s => !s.declared)

  // ── Tallies (all computed from rows) ──────────────────────────────────
  const genTally = countBy(declared, s => s.r26!.winner_party)
  const resTally = countBy(reserved, r => r.party)
  const houseTally: Record<string, number> = { ...genTally }
  for (const [p, n] of Object.entries(resTally)) houseTally[p] = (houseTally[p] || 0) + n
  const houseFilled = declared.length + reserved.length
  const genTop = topOf(genTally), resTop = topOf(resTally), houseTop = topOf(houseTally)

  // Reserved grouped by category; unknown spellings appended, never dropped
  const allCats = [
    ...RESERVED_ORDER,
    ...[...new Set(reserved.map(r => r.category))].filter(c => !RESERVED_ORDER.includes(c)),
  ]
  const reservedByCat = allCats
    .map(cat => ({ cat, rows: reserved.filter(r => r.category === cat) }))
    .filter(g => g.rows.length > 0)
  const womenCount = reserved.filter(r => r.category === 'Women').length

  const filtered = seats.filter(s => filter === 'All' || s.region === filter)
  const sel = seats.find(s => s.seat_id === selectedSeat)

  const showGeneral  = mode !== 'reserved'
  const showReserved = mode !== 'general' && reserved.length > 0

  // Per-party split line: "PML-N 25 elected + 6 reserved"
  const Breakdown = () => (
    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-xs" style={{ color: 'var(--text2)' }}>
      {Object.entries(houseTally).sort((a, b) => b[1] - a[1]).map(([p, n]) => (
        <span key={p}>
          <b style={{ color: partyColor(p) }}>{p} {n}</b>
          {' '}= {genTally[p] || 0} elected + {resTally[p] || 0} reserved
        </span>
      ))}
    </div>
  )

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display">2026 Election Results</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
            Final results · Source: AJK Election Commission
            {postponed.length > 0 && ` · ${postponed.length} seats postponed`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Seat type toggle */}
          <div className="flex gap-2 flex-wrap justify-end">
            <Seg value="all"      current={mode} onClick={setMode}>All seats ({HOUSE_TOTAL})</Seg>
            <Seg value="general"  current={mode} onClick={setMode}>Directly elected ({TOTAL_GENERAL})</Seg>
            <Seg value="reserved" current={mode} onClick={setMode}>Reserved ({TOTAL_RESERVED})</Seg>
          </div>
          {/* Region filter: general seats only */}
          {showGeneral && (
            <div className="flex gap-2">
              {(['All', 'In-Region', 'Refugee'] as const).map(f => (
                <Seg key={f} value={f} current={filter} onClick={setFilter}>{f}</Seg>
              ))}
            </div>
          )}
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
          {/* KPI row: changes with seat type */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {mode === 'all' && <>
              <StatCard label="House filled" value={`${houseFilled} / ${HOUSE_TOTAL}`}
                        sub={`${declared.length} elected + ${reserved.length} reserved`} />
              <StatCard label="Seats postponed" value={postponed.length}
                        sub={postponed.length ? `${postponed[0].seat_id} to ${postponed[postponed.length - 1].seat_id}` : 'None'} />
              <StatCard label="Majority needed" value={HOUSE_MAJORITY} sub={`of ${HOUSE_TOTAL} seats`} />
              {houseTop
                ? <StatCard label="Largest party" value={`${houseTop[0]} (${houseTop[1]})`} color={partyColor(houseTop[0])}
                            sub={houseTop[1] >= HOUSE_MAJORITY ? 'Majority secured' : 'Short of majority'} />
                : <StatCard label="Largest party" value="—" sub="No results" />}
            </>}
            {mode === 'general' && <>
              <StatCard label="Seats declared" value={`${declared.length} / ${TOTAL_GENERAL}`} sub="Directly elected" />
              <StatCard label="Seats postponed" value={postponed.length}
                        sub={postponed.length ? `${postponed[0].seat_id} to ${postponed[postponed.length - 1].seat_id}` : 'None'} />
              <StatCard label="Majority needed" value={MAJORITY} sub={`of ${TOTAL_GENERAL} general seats`} />
              {genTop
                ? <StatCard label="Largest party" value={`${genTop[0]} (${genTop[1]})`} color={partyColor(genTop[0])}
                            sub={genTop[1] >= MAJORITY ? 'Majority of general seats' : 'Short of majority'} />
                : <StatCard label="Largest party" value="—" sub="No results" />}
            </>}
            {mode === 'reserved' && <>
              <StatCard label="Reserved filled" value={`${reserved.length} / ${TOTAL_RESERVED}`} sub="Not directly elected" />
              <StatCard label="Women" value={womenCount} sub="Reserved for women" />
              <StatCard label="Other reserved" value={reserved.length - womenCount} sub="Technocrats, Ulema, Overseas" />
              {resTop
                ? <StatCard label="Largest share" value={`${resTop[0]} (${resTop[1]})`} color={partyColor(resTop[0])}
                            sub={`of ${reserved.length} reserved seats`} />
                : <StatCard label="Largest share" value="—" sub="No data" />}
            </>}
          </div>

          {/* Tally card */}
          {mode === 'all' && (
            <div className="card mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--text3)' }}>
                Assembly tally (elected + reserved)
              </h3>
              <PartyTallyBar tally={houseTally} total={HOUSE_TOTAL} majority={HOUSE_MAJORITY} />
              <Breakdown />
            </div>
          )}
          {mode === 'general' && declared.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--text3)' }}>
                Seat tally (directly elected)
              </h3>
              <PartyTallyBar tally={genTally} total={TOTAL_GENERAL} majority={MAJORITY} />
            </div>
          )}

          {/* Reserved members */}
          {showReserved && (
            <div className="card mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text3)' }}>
                Reserved seats ({reserved.length} of {TOTAL_RESERVED})
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
                {Object.entries(resTally).sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p} ${n}`).join(' · ')}
              </p>
              <div className="grid sm:grid-cols-2 gap-5">
                {reservedByCat.map(g => (
                  <div key={g.cat}>
                    <p className="text-xs mb-1.5 font-semibold" style={{ color: 'var(--text2)' }}>
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
          {mode === 'reserved' && reserved.length === 0 && (
            <div className="card mb-6 text-center py-8" style={{ color: 'var(--text3)' }}>
              Reserved seat data could not be loaded.
            </div>
          )}

          {/* Constituencies: general seats only */}
          {showGeneral && (
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
          )}
        </>
      )}
    </Layout>
  )
}
