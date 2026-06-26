import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { supabase, partyColor } from '@/lib/supabase'
import { numSort } from '@/lib/utils'

type Row = {
  seat_id: string; seat_name: string; division: string; region_type: string
  election_year: number; winner: string; winner_party: string; winner_votes: number
  runner_up: string; runner_up_party: string; runner_up_votes: number
  total_votes_polled: number; margin_votes: number
}
type CandRow = {
  seat_id: string; election_year: number; rank: number
  candidate_name: string; party: string; votes: number; vote_share_pct: number
}
const TALLIES: Record<number, Record<string, number>> = {
  2011: { PPP:22, 'PML-N':10, AJKMC:4, MQM:2, Independent:1, PMLQ:1 },
  2016: { 'PML-N':31, PPP:3, AJKMC:3, PTI:2, Independent:1, JKPP:1 },
  2021: { PTI:24, PPP:12, 'PML-N':7, AJKMC:1, JKPP:1 },
}
const YEARS = [2011, 2016, 2021] as const
const DIVS  = ['All','Mirpur','Poonch','Muzaffarabad','Jammu & Valley']

export default function Records() {
  const [data, setData]       = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [yearTab, setYear]    = useState<2011|2016|2021>(2021)
  const [div, setDiv]         = useState('All')
  const [view, setView]       = useState<'overview'|'seats'|'compare'|'three-way'>('overview')
  const [selectedSeat, setSelectedSeat] = useState<string>('LA-1')
  const [candData, setCandData] = useState<CandRow[]>([])

  useEffect(() => {
    supabase.from('elections_history').select('*')
      .then(({ data: d }) => { setData(d || []); setLoading(false) })
    supabase.from('candidate_results').select('*')
      .then(({ data: d }) => { setCandData(d || []) })
  }, [])

  const yearRows = data
    .filter(r => r.election_year === yearTab && (div === 'All' || r.division === div))
    .sort((a, b) => numSort(a.seat_id, b.seat_id))

  const tally    = TALLIES[yearTab]
  const topParty = Object.entries(tally).sort((a,b) => b[1]-a[1])[0]
  const avgMargin = yearRows.length
    ? Math.round(yearRows.reduce((s,r) => s+(r.margin_votes||0),0)/yearRows.length) : 0

  // ── Manual overrides ─────────────────────────────────────────────────────
  // Applied after algorithmic classification for seats where the data requires
  // human context: family vote banks, name spelling variants, nuanced histories.
  // Add further overrides here as anomalies are identified.
  const OVERRIDES: Record<string, { seatProfile: string; signal: string }> = {
    // LA-2: Ch Abdul Majeed (PPP, 2011 & 2016) is the father of Ch Qasim Majeed (PPP, 2021).
    // Family vote bank — classified as Candidate Hold despite different names in data.
    'LA-2': {
      seatProfile: 'candidate-hold',
      signal: 'Ch Abdul Majeed (father) won 2011 & 2016; son Ch Qasim Majeed won 2021 — family vote bank',
    },
    // LA-3: Barrister Sultan Mehmood won 2011 (PPP) and 2021 (PTI) — strong personal vote bank
    // across different parties. He passed away; his son Ch Yasir Sultan contested a by-election.
    // Classified as Candidate Hold (personal) with swing note due to family succession.
    'LA-3': {
      seatProfile: 'candidate-hold',
      signal: 'Barrister Sultan Mehmood won 2011 (PPP) & 2021 (PTI) — personal vote bank transcends party. Son Ch Yasir Sultan holds seat via family succession.',
    },
    // LA-4: "Ch Asshad Hussain" (2011, PPP) and "Ch Arshad Hussain" (2021, PTI) are the same
    // person — name misspelling in EC data. He won from PPP and PTI platforms: Candidate Hold.
    'LA-4': {
      seatProfile: 'candidate-hold',
      signal: 'Ch Arshad Hussain won 2011 (PPP) & 2021 (PTI) across parties — strong personal vote bank. Note: 2011 EC data spells name as "Asshad" (same person).',
    },
  }

  const allSeats = [...new Set(data.map(r => r.seat_id))].sort(numSort)
  const compRows = allSeats.map(sid => {
    const find = (y:number) => data.find(r => r.seat_id===sid && r.election_year===y)
    const r11=find(2011), r16=find(2016), r21=find(2021)
    const p11=r11?.winner_party||'—', p16=r16?.winner_party||'—', p21=r21?.winner_party||'—'
    const w11=r11?.winner||'—', w16=r16?.winner||'—', w21=r21?.winner||'—'

    const winners  = [w11,w16,w21].filter(w=>w!=='—').map(w=>w.trim().toLowerCase())
    const parties  = [p11,p16,p21].filter(p=>p!=='—')
    const uWinners = [...new Set(winners)]

    // Dominant winner = someone who appears 2+ times in the three elections
    const winnerCounts: Record<string,number> = {}
    for (const w of winners) winnerCounts[w] = (winnerCounts[w]||0)+1
    const hasDomWinner = Object.values(winnerCounts).some(c=>c>1)

    // Dominant party = a party that won 2+ of the available elections
    const partyCounts: Record<string,number> = {}
    for (const p of parties) partyCounts[p] = (partyCounts[p]||0)+1
    const hasDomParty = Object.values(partyCounts).some(c=>c>1)

    // Swing = exactly 2 unique candidates trading the seat
    const isSwing = uWinners.length===2 && winners.length>=2

    // ── Profile priority ──────────────────────────────────────────────────
    // 1. Candidate Hold — same person won 2+ elections.
    //    a. Different parties across wins → pure personal vote bank
    //    b. Same party across wins → party hold BUT with an electable candidate
    //       (cannot separate person from party; party gets structural credit,
    //        candidate gets electable note in signal)
    // 2. Swing — two unique candidates trading the seat (any parties)
    // 3. Party Hold — different winners, same party dominant
    // 4. Volatile — no person or party pattern

    let seatProfile: string
    if (hasDomWinner)      seatProfile = 'candidate-hold'
    else if (isSwing)      seatProfile = 'swing'
    else if (hasDomParty)  seatProfile = 'party-hold'
    else                   seatProfile = 'volatile'

    // Helpers
    const totalElections = winners.length
    const domPartyName = () =>
      Object.entries(partyCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || ''
    const domWinnerDisplay = () => {
      const lc = Object.entries(winnerCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||''
      return [w11,w16,w21].find(w=>w.trim().toLowerCase()===lc) || lc
    }
    const swingNames = () =>
      uWinners.map(lc=>[w11,w16,w21].find(w=>w.trim().toLowerCase()===lc)||lc).join(' and ')

    // ── Signal ────────────────────────────────────────────────────────────
    let signal: string
    if (seatProfile==='candidate-hold') {
      const nm  = domWinnerDisplay()
      const cnt = winnerCounts[nm.trim().toLowerCase()]
      // Check if the dominant winner's wins span different parties
      const winParties = [
        {w:w11.trim().toLowerCase(),p:p11},
        {w:w16.trim().toLowerCase(),p:p16},
        {w:w21.trim().toLowerCase(),p:p21},
      ].filter(x=>x.w===nm.trim().toLowerCase()).map(x=>x.p)
      const crossParty = new Set(winParties).size > 1
      if (crossParty) {
        signal = `${nm} won ${cnt} of ${totalElections} elections across different parties — personal vote bank`
      } else {
        // Same party each time — party hold with electable candidate
        const dp = winParties[0]
        signal = `${nm} won ${cnt} of ${totalElections} elections on ${dp} platform — party hold with electable candidate`
      }
    } else if (seatProfile==='swing') {
      signal = `Seat traded between ${swingNames()} — recurring contest between same candidates`
    } else if (seatProfile==='party-hold') {
      const dp  = domPartyName()
      const cnt = partyCounts[dp]
      signal = `${dp} won ${cnt} of ${totalElections} elections with different candidates — party brand dominates`
    } else {
      signal = `${uWinners.length} different candidates across ${totalElections} elections — no loyalty signal`
    }

    // Apply manual override if present (family seats, spelling corrections etc.)
    const override = OVERRIDES[sid]

    return {
      sid,
      seatProfile: override?.seatProfile ?? seatProfile,
      signal:      override?.signal      ?? signal,
      name: r21?.seat_name||r16?.seat_name||r11?.seat_name||sid,
      div:  r21?.division||r16?.division||r11?.division||'',
      w11, p11, v11:r11?.winner_votes,
      w16, p16, v16:r16?.winner_votes,
      w21, p21, v21:r21?.winner_votes,
    }
  })

  function TallyBar({ year }:{ year:number }) {
    const t = TALLIES[year]
    const max = Math.max(...Object.values(t))
    return (
      <div className="space-y-2">
        {Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([party,n]) => {
          const hex = `${partyColor(party)}`
          return (
            <div key={party} className="flex items-center gap-2">
              <span className="text-xs w-20 text-right font-medium"
                    style={{ color:'var(--text2)' }}>{party}</span>
              <div className="flex-1 rounded-sm h-6 overflow-hidden"
                   style={{ backgroundColor:'var(--bg3)' }}>
                <div className="h-6 rounded-sm flex items-center justify-end pr-2 transition-all"
                     style={{ width:`${(n/max)*100}%`, backgroundColor: hex }}>
                  <span className="text-xs font-bold text-white drop-shadow">{n}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1 font-display">Election Records</h2>
      <p className="text-sm mb-6" style={{color:'var(--text2)'}}>
        AJK General Elections 2011, 2016 and 2021 — official EC results
      </p>

      <div className="lA-view-tabs" style={{ marginBottom: 24 }}>
        {([
          ['overview',   'Overview'],
          ['seats',      'Seat by Seat'],
          ['compare',    'Comparison'],
          ['three-way',  'Three-Election Table'],
        ] as const).map(([v,label]) => (
          <button key={v} onClick={() => setView(v)}
            className="lA-view-tab"
            style={{
              backgroundColor: view===v ? 'var(--accent)' : 'var(--card-bg)',
              color: view===v ? '#fff' : 'var(--text2)',
              border: '1px solid var(--border)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────── */}
      {view==='overview' && <>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {YEARS.map(y => (
            <div key={y} className="card">
              <h3 className="text-xs font-semibold uppercase mb-4" style={{color:'var(--text3)'}}>
                {y} — {y===2011?'PPP majority':y===2016?'PML-N sweep':'PTI wins (post-tribunal)'}
              </h3>
              <TallyBar year={y} />
            </div>
          ))}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Anti-incumbency pattern</h3>
          <p className="text-sm leading-relaxed" style={{color:'var(--text2)'}}>
            Every AJK election since 2011 was won by a different party. PPP dominated 2011 (22 seats),
            PML-N swept 2016 (31 seats), PTI won 2021 (24 seats post-tribunal).
            19 of 41 comparable seats changed hands at every election.
            Anti-incumbency is the strongest structural predictor for 2026.
          </p>
        </div>
      </>}

      {/* ── SEAT BY SEAT ─────────────────────────── */}
      {view==='seats' && (() => {
        // All unique seat IDs in order
        const seatIds = [...new Set(data.map(r => r.seat_id))].sort(numSort)
        const seatIdx = seatIds.indexOf(selectedSeat)
        const prevSeat = seatIdx > 0 ? seatIds[seatIdx - 1] : null
        const nextSeat = seatIdx < seatIds.length - 1 ? seatIds[seatIdx + 1] : null

        // Get the seat name for display
        const seatName = data.find(r => r.seat_id === selectedSeat)?.seat_name ?? selectedSeat

        // Per-year data for selected seat
        const yr = (y: number) => data.find(r => r.seat_id === selectedSeat && r.election_year === y)

        // Render one year column
        const YearCol = ({ year }: { year: number }) => {
          const row = yr(year)
          if (!row) return (
            <div className="sbs-year-col" style={{ borderColor: 'var(--border)' }}>
              <div className="sbs-year-label" style={{ color: 'var(--text3)' }}>{year}</div>
              <p className="text-xs mt-6 text-center" style={{ color: 'var(--text3)' }}>No data</p>
            </div>
          )

          // For 2021: use full candidate list from candidate_results
          // For 2011/2016: fall back to winner + runner-up from elections_history
          const fullCands = candData
            .filter(c => c.seat_id === selectedSeat && c.election_year === year)
            .sort((a, b) => a.rank - b.rank)

          const total     = row.total_votes_polled
          const marginPct = total && row.margin_votes
            ? ((row.margin_votes / total) * 100).toFixed(1) : null

          // Max votes in this column (for bar scaling)
          const maxVotes = fullCands.length > 0
            ? fullCands[0].votes
            : Math.max(row.winner_votes || 0, row.runner_up_votes || 0)

          return (
            <div className="sbs-year-col" style={{ borderColor: 'var(--border)' }}>
              {/* Year header */}
              <div className="sbs-year-label" style={{ color: 'var(--text3)' }}>{year}</div>

              {fullCands.length > 0 ? (
                /* ── Full candidate list (2021) ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fullCands.map((c, i) => {
                    const isWinner = i === 0
                    const color    = partyColor(c.party)
                    const barWidth = maxVotes > 0 ? (c.votes / maxVotes) * 100 : 0
                    return (
                      <div key={c.rank}>
                        {/* Divider between winner and rest */}
                        {i === 1 && (
                          <div className="sbs-divider" style={{ borderColor: 'var(--border)', marginBottom: 10 }} />
                        )}
                        <div className="sbs-cand-inner" style={{ marginBottom: 3 }}>
                          <span
                            className={isWinner ? 'sbs-badge text-white' : 'sbs-badge sbs-badge-ghost'}
                            style={isWinner
                              ? { backgroundColor: color }
                              : { borderColor: color, color }}>
                            {c.party}
                          </span>
                          <span
                            className="sbs-cand-name"
                            style={{
                              color: isWinner ? 'var(--text)' : 'var(--text2)',
                              fontWeight: isWinner ? 700 : 400,
                              fontSize: isWinner ? 13 : 12,
                            }}>
                            {c.candidate_name}
                          </span>
                        </div>
                        <div className="sbs-cand-votes" style={{ marginBottom: 3 }}>
                          <span className="sbs-votes-num"
                                style={{ color: isWinner ? color : 'var(--text2)' }}>
                            {c.votes.toLocaleString()}
                          </span>
                          <span className="sbs-share" style={{ color: 'var(--text3)' }}>
                            {c.vote_share_pct}%
                          </span>
                        </div>
                        <div className="sbs-bar-track" style={{ backgroundColor: 'var(--bg3)' }}>
                          <div className="sbs-bar-fill"
                               style={{
                                 width: `${barWidth}%`,
                                 backgroundColor: color,
                                 opacity: isWinner ? 1 : 0.45,
                               }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* ── Winner + runner-up fallback (2011, 2016) ── */
                <>
                  <div className="sbs-cand-row sbs-winner">
                    <div className="sbs-cand-inner">
                      <span className="sbs-badge text-white"
                            style={{ backgroundColor: partyColor(row.winner_party) }}>
                        {row.winner_party}
                      </span>
                      <span className="sbs-cand-name sbs-winner-name"
                            style={{ color: 'var(--text)' }}>
                        {row.winner}
                      </span>
                    </div>
                    <div className="sbs-cand-votes">
                      <span className="sbs-votes-num" style={{ color: partyColor(row.winner_party) }}>
                        {row.winner_votes?.toLocaleString() ?? '—'}
                      </span>
                      {total && (
                        <span className="sbs-share" style={{ color: 'var(--text3)' }}>
                          {((row.winner_votes / total) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {total && (
                      <div className="sbs-bar-track" style={{ backgroundColor: 'var(--bg3)' }}>
                        <div className="sbs-bar-fill"
                             style={{ width: `${(row.winner_votes / total) * 100}%`,
                                      backgroundColor: partyColor(row.winner_party) }} />
                      </div>
                    )}
                  </div>

                  <div className="sbs-divider" style={{ borderColor: 'var(--border)' }} />

                  <div className="sbs-cand-row">
                    <div className="sbs-cand-inner">
                      <span className="sbs-badge sbs-badge-ghost"
                            style={{ borderColor: partyColor(row.runner_up_party),
                                     color: partyColor(row.runner_up_party) }}>
                        {row.runner_up_party}
                      </span>
                      <span className="sbs-cand-name" style={{ color: 'var(--text2)' }}>
                        {row.runner_up}
                      </span>
                    </div>
                    <div className="sbs-cand-votes">
                      <span className="sbs-votes-num" style={{ color: 'var(--text2)' }}>
                        {row.runner_up_votes?.toLocaleString() ?? '—'}
                      </span>
                      {total && (
                        <span className="sbs-share" style={{ color: 'var(--text3)' }}>
                          {((row.runner_up_votes / total) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {total && (
                      <div className="sbs-bar-track" style={{ backgroundColor: 'var(--bg3)' }}>
                        <div className="sbs-bar-fill"
                             style={{ width: `${(row.runner_up_votes / total) * 100}%`,
                                      backgroundColor: partyColor(row.runner_up_party),
                                      opacity: 0.5 }} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--text3)', fontStyle: 'italic' }}>
                    Full candidate data not available for {year}
                  </p>
                </>
              )}

              {/* Footer stats */}
              <div className="sbs-footer" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}>
                {row.margin_votes != null && (
                  <span>Margin: <strong style={{ color: 'var(--text2)' }}>
                    {row.margin_votes.toLocaleString()}{marginPct ? ` (${marginPct}%)` : ''}
                  </strong></span>
                )}
                {total != null && (
                  <span>Polled: <strong style={{ color: 'var(--text2)' }}>
                    {total.toLocaleString()}
                  </strong></span>
                )}
              </div>
            </div>
          )
        }

        return (
          <>
            {/* ── Seat selector bar ── */}
            <div className="sbs-selector-bar">
              {/* Dropdown */}
              <select
                value={selectedSeat}
                onChange={e => setSelectedSeat(e.target.value)}
                className="sbs-select"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}>
                {seatIds.map(sid => {
                  const name = data.find(r => r.seat_id === sid)?.seat_name ?? sid
                  return <option key={sid} value={sid}>{sid} — {name}</option>
                })}
              </select>

              {/* Prev / Next */}
              <div className="sbs-nav-btns">
                <button
                  onClick={() => prevSeat && setSelectedSeat(prevSeat)}
                  disabled={!prevSeat}
                  className="sbs-nav-btn"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    color: prevSeat ? 'var(--text)' : 'var(--text3)',
                    border: '1px solid var(--border)',
                  }}>
                  ←
                </button>
                <button
                  onClick={() => nextSeat && setSelectedSeat(nextSeat)}
                  disabled={!nextSeat}
                  className="sbs-nav-btn"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    color: nextSeat ? 'var(--text)' : 'var(--text3)',
                    border: '1px solid var(--border)',
                  }}>
                  →
                </button>
              </div>
            </div>

            {/* ── Seat header ── */}
            <div className="sbs-seat-header">
              <span className="sbs-seat-id" style={{ color: 'var(--accent)' }}>
                {selectedSeat}
              </span>
              <span className="sbs-seat-name" style={{ color: 'var(--text)' }}>
                {seatName}
              </span>
              <span className="sbs-seat-div" style={{ color: 'var(--text3)' }}>
                {data.find(r => r.seat_id === selectedSeat)?.division ?? ''}
              </span>
            </div>

            {/* ── Three-column year panels ── */}
            <div className="sbs-cols">
              {YEARS.map(y => <YearCol key={y} year={y} />)}
            </div>
          </>
        )
      })()}

      {/* ── COMPARISON — vote-bank analysis ──────────────────── */}
      {view==='compare' && <>

        {/* Stat cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <StatCard
            label="Candidate Hold"
            value={compRows.filter(r=>r.seatProfile==='candidate-hold').length}
            sub="Vote follows the person" />
          <StatCard
            label="Party Hold"
            value={compRows.filter(r=>r.seatProfile==='party-hold').length}
            sub="Party brand dominates" />
          <StatCard
            label="Swing"
            value={compRows.filter(r=>r.seatProfile==='swing').length}
            sub="Same two candidates trading" />
          <StatCard
            label="Volatile"
            value={compRows.filter(r=>r.seatProfile==='volatile').length}
            sub="No loyalty signal" />
        </div>

        {/* Legend */}
        <div style={{display:'flex', gap:20, flexWrap:'wrap', marginBottom:16}}>
          {[
            {key:'candidate-hold', color:'#2563EB', label:'Candidate Hold', desc:'Same person won across elections'},
            {key:'party-hold',     color:'#1B7A43', label:'Party Hold',     desc:'Party brand outlasts candidates'},
            {key:'swing',          color:'#D97706', label:'Swing',          desc:'Two candidates trading the seat'},
            {key:'volatile',       color:'#DC2626', label:'Volatile',       desc:'Full churn — no pattern'},
          ].map(l => (
            <div key={l.key} style={{display:'flex', alignItems:'center', gap:7}}>
              <span style={{width:10, height:10, borderRadius:3,
                            backgroundColor:l.color, flexShrink:0, display:'inline-block'}} />
              <span style={{fontSize:12, color:'var(--text3)'}}>
                <strong style={{color:'var(--text)'}}>{l.label}</strong> — {l.desc}
              </span>
            </div>
          ))}
        </div>

        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-1">Vote-bank analysis — 2011 · 2016 · 2021</h3>
          <p className="text-xs mb-3" style={{color:'var(--text3)'}}>
            One profile per seat across all three elections. Does the vote follow the person or the party?
          </p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{backgroundColor:'var(--bg3)'}}>
                {['Seat','Constituency','Div','2011 Winner','2016 Winner','2021 Winner','Profile','Signal'].map((h,i) => (
                  <th key={i} className="text-left py-2.5 px-3 text-xs uppercase font-semibold"
                      style={{
                        color: h==='Profile'||h==='Signal' ? 'var(--accent)' : 'var(--text3)',
                        borderBottom:'2px solid var(--border)',
                        borderLeft: h==='Profile' ? '2px solid var(--border)' : undefined,
                      }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compRows.map((r,i) => {
                const pColor = (p:string) =>
                  p==='candidate-hold' ? '#2563EB' :
                  p==='party-hold'     ? '#1B7A43' :
                  p==='swing'          ? '#D97706' :
                  p==='volatile'       ? '#DC2626' : 'var(--text3)'
                const pLabel = (p:string) =>
                  p==='candidate-hold' ? 'Cand. Hold' :
                  p==='party-hold'     ? 'Party Hold' :
                  p==='swing'          ? 'Swing'      :
                  p==='volatile'       ? 'Volatile'   : '—'
                return (
                  <tr key={r.sid}
                      style={{backgroundColor: i%2===0 ? 'var(--card-bg)' : 'var(--bg3)',
                              borderBottom:'1px solid var(--border)'}}>
                    <td className="py-2 px-3 text-xs font-mono font-bold"
                        style={{color:'var(--accent)'}}>{r.sid}</td>
                    <td className="py-2 px-3 text-xs font-medium">{r.name}</td>
                    <td className="py-2 px-3 text-xs" style={{color:'var(--text3)'}}>{r.div}</td>
                    {/* Winner + party badge per election */}
                    {([['w11','p11'],['w16','p16'],['w21','p21']] as const).map(([wk,pk]) => (
                      <td key={wk} className="py-2 px-3 text-xs">
                        <div style={{display:'flex', flexDirection:'column', gap:2}}>
                          <span style={{color:'var(--text)', fontWeight:500}}>{(r as any)[wk]}</span>
                          {(r as any)[pk]!=='—' &&
                            <span className="badge text-white"
                                  style={{backgroundColor:`${partyColor((r as any)[pk])}`,
                                          fontSize:9, alignSelf:'flex-start'}}>
                              {(r as any)[pk]}
                            </span>}
                        </div>
                      </td>
                    ))}
                    {/* Single profile badge */}
                    <td className="py-2 px-3 text-xs" style={{borderLeft:'2px solid var(--border)'}}>
                      <span style={{
                        display:'inline-block', padding:'2px 8px', borderRadius:5,
                        fontSize:10, fontWeight:700, fontFamily:'IBM Plex Mono, monospace',
                        backgroundColor: pColor(r.seatProfile)+'22',
                        color: pColor(r.seatProfile),
                        border:`1px solid ${pColor(r.seatProfile)}44`,
                        whiteSpace:'nowrap',
                      }}>{pLabel(r.seatProfile)}</span>
                    </td>
                    {/* Single signal sentence */}
                    <td className="py-2 px-3 text-xs" style={{color:'var(--text3)', minWidth:220}}>
                      {r.signal}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>}

      {/* ── THREE-ELECTION CONSOLIDATED TABLE ─────── */}
      {view==='three-way' && <>
        <p className="text-sm mb-4" style={{color:'var(--text2)'}}>
          All 45 seats — winner name, party and votes for every election side by side.
        </p>
        <div className="card overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{backgroundColor:'var(--accent)'}}>
                <th className="text-left py-2.5 px-3 text-white font-semibold"
                    style={{borderBottom:'2px solid var(--border)'}}>Seat</th>
                <th className="text-left py-2.5 px-3 text-white font-semibold"
                    style={{borderBottom:'2px solid var(--border)'}}>Constituency</th>
                <th colSpan={3} className="py-2.5 px-3 text-center font-semibold"
                    style={{backgroundColor:'#0A0A8C', color:'white',
                            borderBottom:'2px solid var(--border)', borderLeft:'2px solid rgba(255,255,255,0.2)'}}>
                  2011 — PPP majority
                </th>
                <th colSpan={3} className="py-2.5 px-3 text-center font-semibold"
                    style={{backgroundColor:'#1B7A43', color:'white',
                            borderBottom:'2px solid var(--border)', borderLeft:'2px solid rgba(255,255,255,0.2)'}}>
                  2016 — PML-N sweep
                </th>
                <th colSpan={3} className="py-2.5 px-3 text-center font-semibold"
                    style={{backgroundColor:'#E4002B', color:'white',
                            borderBottom:'2px solid var(--border)', borderLeft:'2px solid rgba(255,255,255,0.2)'}}>
                  2021 — PTI wins
                </th>
              </tr>
              <tr style={{backgroundColor:'var(--bg3)'}}>
                <th className="py-2 px-3" style={{borderBottom:'1px solid var(--border)'}}></th>
                <th className="py-2 px-3" style={{borderBottom:'1px solid var(--border)'}}></th>
                {['Winner','Party','Votes','Winner','Party','Votes','Winner','Party','Votes'].map((h,i) => (
                  <th key={i} className="py-2 px-3 text-left text-xs uppercase font-semibold"
                      style={{color:'var(--text3)', borderBottom:'1px solid var(--border)',
                              borderLeft: i===0||i===3||i===6 ? '2px solid var(--border)' : undefined}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compRows.map((r,i) => (
                <tr key={r.sid}
                    style={{backgroundColor: i%2===0 ? 'var(--card-bg)' : 'var(--bg3)',
                            borderBottom:'1px solid var(--border)'}}>
                  <td className="py-2 px-3 font-mono font-bold"
                      style={{color:'var(--accent)'}}>{r.sid}</td>
                  <td className="py-2 px-3 font-medium" style={{color:'var(--text)'}}>{r.name}</td>
                  <td className="py-2 px-3" style={{borderLeft:'2px solid var(--border)'}}>{r.w11}</td>
                  <td className="py-2 px-3">
                    {r.p11!=='—'&&<span className="badge text-white text-xs" style={{backgroundColor:`${partyColor(r.p11)}`}}>{r.p11}</span>}
                  </td>
                  <td className="py-2 px-3 text-right" style={{color:'var(--text3)'}}>
                    {r.v11?.toLocaleString()??'—'}
                  </td>
                  <td className="py-2 px-3" style={{borderLeft:'2px solid var(--border)'}}>{r.w16}</td>
                  <td className="py-2 px-3">
                    {r.p16!=='—'&&<span className="badge text-white text-xs" style={{backgroundColor:`${partyColor(r.p16)}`}}>{r.p16}</span>}
                  </td>
                  <td className="py-2 px-3 text-right" style={{color:'var(--text3)'}}>
                    {r.v16?.toLocaleString()??'—'}
                  </td>
                  <td className="py-2 px-3" style={{borderLeft:'2px solid var(--border)'}}>{r.w21}</td>
                  <td className="py-2 px-3">
                    {r.p21!=='—'&&<span className="badge text-white text-xs" style={{backgroundColor:`${partyColor(r.p21)}`}}>{r.p21}</span>}
                  </td>
                  <td className="py-2 px-3 text-right" style={{color:'var(--text3)'}}>
                    {r.v21?.toLocaleString()??'—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </Layout>
  )
}