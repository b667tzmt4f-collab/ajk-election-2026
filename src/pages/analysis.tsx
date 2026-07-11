import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { supabase, partyColor } from '@/lib/supabase'
import { numSort } from '@/lib/utils'

type Row = {
  seat_id: string; seat_name: string; division: string; region_type: string
  election_year: number; winner: string; winner_party: string; winner_votes: number
  runner_up: string; runner_up_party: string; runner_up_votes: number
  total_votes_polled: number; margin_votes: number; registered_voters: number
}

export default function Analysis() {
  const [data, setData]       = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('elections_history').select('*')
      .then(({ data: d }) => { setData(d || []); setLoading(false) })
  }, [])

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
    const find = (y: number) => data.find(r => r.seat_id === sid && r.election_year === y)
    const r11 = find(2011), r16 = find(2016), r21 = find(2021)
    const p11 = r11?.winner_party || '—', p16 = r16?.winner_party || '—', p21 = r21?.winner_party || '—'
    const w11 = r11?.winner || '—', w16 = r16?.winner || '—', w21 = r21?.winner || '—'

    const winners  = [w11, w16, w21].filter(w => w !== '—').map(w => w.trim().toLowerCase())
    const parties  = [p11, p16, p21].filter(p => p !== '—')
    const uWinners = [...new Set(winners)]

    // Dominant winner = someone who appears 2+ times in the three elections
    const winnerCounts: Record<string, number> = {}
    for (const w of winners) winnerCounts[w] = (winnerCounts[w] || 0) + 1
    const hasDomWinner = Object.values(winnerCounts).some(c => c > 1)

    // Dominant party = a party that won 2+ of the available elections
    const partyCounts: Record<string, number> = {}
    for (const p of parties) partyCounts[p] = (partyCounts[p] || 0) + 1
    const hasDomParty = Object.values(partyCounts).some(c => c > 1)

    // Swing = exactly 2 unique candidates trading the seat
    const isSwing = uWinners.length === 2 && winners.length >= 2

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
      Object.entries(partyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
    const domWinnerDisplay = () => {
      const lc = Object.entries(winnerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
      return [w11, w16, w21].find(w => w.trim().toLowerCase() === lc) || lc
    }
    const swingNames = () =>
      uWinners.map(lc => [w11, w16, w21].find(w => w.trim().toLowerCase() === lc) || lc).join(' and ')

    // ── Signal ────────────────────────────────────────────────────────────
    let signal: string
    if (seatProfile === 'candidate-hold') {
      const nm  = domWinnerDisplay()
      const cnt = winnerCounts[nm.trim().toLowerCase()]
      // Check if the dominant winner's wins span different parties
      const winParties = [
        { w: w11.trim().toLowerCase(), p: p11 },
        { w: w16.trim().toLowerCase(), p: p16 },
        { w: w21.trim().toLowerCase(), p: p21 },
      ].filter(x => x.w === nm.trim().toLowerCase()).map(x => x.p)
      const crossParty = new Set(winParties).size > 1
      if (crossParty) {
        signal = `${nm} won ${cnt} of ${totalElections} elections across different parties — personal vote bank`
      } else {
        // Same party each time — party hold with electable candidate
        const dp = winParties[0]
        signal = `${nm} won ${cnt} of ${totalElections} elections on ${dp} platform — party hold with electable candidate`
      }
    } else if (seatProfile === 'swing') {
      signal = `Seat traded between ${swingNames()} — recurring contest between same candidates`
    } else if (seatProfile === 'party-hold') {
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
      name: r21?.seat_name || r16?.seat_name || r11?.seat_name || sid,
      div:  r21?.division || r16?.division || r11?.division || '',
      w11, p11,
      w16, p16,
      w21, p21,
    }
  })

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1 font-display">Vote-Bank Analysis</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
        Seat-level classification across 2011 · 2016 · 2021 — does the vote follow the person or the party?
      </p>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Loading…</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <StatCard
              label="Candidate Hold"
              value={compRows.filter(r => r.seatProfile === 'candidate-hold').length}
              sub="Vote follows the person" />
            <StatCard
              label="Party Hold"
              value={compRows.filter(r => r.seatProfile === 'party-hold').length}
              sub="Party brand dominates" />
            <StatCard
              label="Swing"
              value={compRows.filter(r => r.seatProfile === 'swing').length}
              sub="Same two candidates trading" />
            <StatCard
              label="Volatile"
              value={compRows.filter(r => r.seatProfile === 'volatile').length}
              sub="No loyalty signal" />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { key: 'candidate-hold', color: '#2563EB', label: 'Candidate Hold', desc: 'Same person won across elections' },
              { key: 'party-hold',     color: '#1B7A43', label: 'Party Hold',     desc: 'Party brand outlasts candidates' },
              { key: 'swing',          color: '#D97706', label: 'Swing',          desc: 'Two candidates trading the seat' },
              { key: 'volatile',       color: '#DC2626', label: 'Volatile',       desc: 'Full churn — no pattern' },
            ].map(l => (
              <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3,
                              backgroundColor: l.color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  <strong style={{ color: 'var(--text)' }}>{l.label}</strong> — {l.desc}
                </span>
              </div>
            ))}
          </div>

          <div className="card overflow-x-auto">
            <h3 className="font-semibold mb-1">Vote-bank analysis — 2011 · 2016 · 2021</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text3)' }}>
              One profile per seat across all three elections. Does the vote follow the person or the party?
            </p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg3)' }}>
                  {['Seat', 'Constituency', 'Div', '2011 Winner', '2016 Winner', '2021 Winner', 'Profile', 'Signal'].map((h, i) => (
                    <th key={i} className="text-left py-2.5 px-3 text-xs uppercase font-semibold"
                        style={{
                          color: h === 'Profile' || h === 'Signal' ? 'var(--accent)' : 'var(--text3)',
                          borderBottom: '2px solid var(--border)',
                          borderLeft: h === 'Profile' ? '2px solid var(--border)' : undefined,
                        }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compRows.map((r, i) => {
                  const pColor = (p: string) =>
                    p === 'candidate-hold' ? '#2563EB' :
                    p === 'party-hold'     ? '#1B7A43' :
                    p === 'swing'          ? '#D97706' :
                    p === 'volatile'       ? '#DC2626' : 'var(--text3)'
                  const pLabel = (p: string) =>
                    p === 'candidate-hold' ? 'Cand. Hold' :
                    p === 'party-hold'     ? 'Party Hold' :
                    p === 'swing'          ? 'Swing'      :
                    p === 'volatile'       ? 'Volatile'   : '—'
                  return (
                    <tr key={r.sid}
                        style={{ backgroundColor: i % 2 === 0 ? 'var(--card-bg)' : 'var(--bg3)',
                                borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2 px-3 text-xs font-mono font-bold"
                          style={{ color: 'var(--accent)' }}>{r.sid}</td>
                      <td className="py-2 px-3 text-xs font-medium">{r.name}</td>
                      <td className="py-2 px-3 text-xs" style={{ color: 'var(--text3)' }}>{r.div}</td>
                      {/* Winner + party badge per election */}
                      {([['w11', 'p11'], ['w16', 'p16'], ['w21', 'p21']] as const).map(([wk, pk]) => (
                        <td key={wk} className="py-2 px-3 text-xs">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{(r as any)[wk]}</span>
                            {(r as any)[pk] !== '—' &&
                              <span className="badge text-white"
                                    style={{ backgroundColor: partyColor((r as any)[pk]),
                                            fontSize: 9, alignSelf: 'flex-start' }}>
                                {(r as any)[pk]}
                              </span>}
                          </div>
                        </td>
                      ))}
                      {/* Single profile badge */}
                      <td className="py-2 px-3 text-xs" style={{ borderLeft: '2px solid var(--border)' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 5,
                          fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace',
                          backgroundColor: pColor(r.seatProfile) + '22',
                          color: pColor(r.seatProfile),
                          border: `1px solid ${pColor(r.seatProfile)}44`,
                          whiteSpace: 'nowrap',
                        }}>{pLabel(r.seatProfile)}</span>
                      </td>
                      {/* Single signal sentence */}
                      <td className="py-2 px-3 text-xs" style={{ color: 'var(--text3)', minWidth: 220 }}>
                        {r.signal}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  )
}
