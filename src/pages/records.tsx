import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { supabase, partyColor } from '@/lib/supabase'

type Row = {
  seat_id: string; seat_name: string; division: string; region_type: string
  election_year: number; winner: string; winner_party: string; winner_votes: number
  runner_up: string; runner_up_party: string; runner_up_votes: number
  total_votes_polled: number; margin_votes: number
}

// CRITICAL: numeric sort — LA-1,LA-2...LA-45 not LA-1,LA-10,LA-11
const numSort = (a: string, b: string) =>
  parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])

const TALLIES: Record<number, Record<string, number>> = {
  2011: { PPP:22, 'PML-N':10, AJKMC:4, MQM:2, Independent:1, PMLQ:1 },
  2016: { 'PML-N':31, PPP:3, AJKMC:3, PTI:2, Independent:1, JKPP:1 },
  2021: { PTI:24, PPP:12, 'PML-N':7, AJKMC:1, JKPP:1 },
}
const YEARS  = [2011, 2016, 2021] as const
const DIVS   = ['All','Mirpur','Poonch','Muzaffarabad','Jammu & Valley']

export default function Records() {
  const [data, setData]       = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [yearTab, setYear]    = useState<2011|2016|2021>(2021)
  const [div, setDiv]         = useState('All')
  const [view, setView]       = useState<'overview'|'seats'|'compare'>('overview')

  useEffect(() => {
    supabase.from('elections_history').select('*')
      .then(({ data: d }) => { setData(d || []); setLoading(false) })
  }, [])

  const yearRows = data
    .filter(r => r.election_year === yearTab && (div === 'All' || r.division === div))
    .sort((a, b) => numSort(a.seat_id, b.seat_id))   // ← numeric sort

  const tally    = TALLIES[yearTab]
  const topParty = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
  const avgMargin = yearRows.length
    ? Math.round(yearRows.reduce((s, r) => s + (r.margin_votes || 0), 0) / yearRows.length)
    : 0

  // Comparison — all seats, numeric order
  const allSeats = [...new Set(data.map(r => r.seat_id))].sort(numSort)
  const compRows = allSeats.map(sid => {
    const find = (y: number) => data.find(r => r.seat_id === sid && r.election_year === y)
    const r11 = find(2011), r16 = find(2016), r21 = find(2021)
    const p11 = r11?.winner_party || '—'
    const p16 = r16?.winner_party || '—'
    const p21 = r21?.winner_party || '—'
    const flips = [p11!=='—'&&p16!=='—'&&p11!==p16,
                   p16!=='—'&&p21!=='—'&&p16!==p21].filter(Boolean).length
    return {
      sid, flips,
      name: r21?.seat_name || r16?.seat_name || r11?.seat_name || sid,
      div:  r21?.division  || r16?.division  || r11?.division  || '',
      w11: r11?.winner||'—', p11,
      w16: r16?.winner||'—', p16,
      w21: r21?.winner||'—', p21,
    }
  })

  function TallyBar({ year }: { year: number }) {
    const t = TALLIES[year]
    return (
      <div className="space-y-1.5">
        {Object.entries(t).sort((a,b)=>b[1]-a[1]).map(([party, n]) => (
          <div key={party} className="flex items-center gap-2">
            <span className="text-xs w-24 text-right" style={{ color:'var(--text3)' }}>{party}</span>
            <div className="flex-1 rounded h-5" style={{ backgroundColor:'var(--bg3)' }}>
              <div className="h-5 rounded flex items-center justify-end pr-2"
                   style={{ width:`${(n/45)*100}%`, backgroundColor:`#${partyColor(party)}` }}>
                <span className="text-xs font-bold text-white">{n}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) return (
    <Layout><div className="text-center py-20" style={{ color:'var(--text2)' }}>Loading...</div></Layout>
  )

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1">📊 Election Records</h2>
      <p className="text-sm mb-6" style={{ color:'var(--text2)' }}>
        AJK General Elections 2011, 2016 and 2021 — official EC results
      </p>

      {/* View tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([['overview','📈 Overview'],['seats','🗳️ Seat by Seat'],['compare','⚡ Comparison']] as const).map(([v,label]) => (
          <button key={v} onClick={() => setView(v)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: view===v ? 'var(--accent)' : 'var(--bg3)',
              color: view===v ? '#fff' : 'var(--text2)',
              border: '1px solid var(--border)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────── */}
      {view === 'overview' && <>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {YEARS.map(y => (
            <div key={y} className="card">
              <h3 className="text-xs font-semibold uppercase mb-3" style={{ color:'var(--text3)' }}>
                {y} — {y===2011?'PPP majority':y===2016?'PML-N sweep':'PTI wins (post-tribunal)'}
              </h3>
              <TallyBar year={y} />
            </div>
          ))}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Anti-incumbency pattern</h3>
          <p className="text-sm leading-relaxed" style={{ color:'var(--text2)' }}>
            Every AJK election since 2011 was won by a different party. PPP dominated 2011 (22 seats),
            PML-N swept 2016 (31 seats), PTI won 2021 (24 seats post-tribunal).
            19 of 41 comparable seats changed hands at every election.
            Anti-incumbency is the strongest structural predictor for 2026.
          </p>
        </div>
      </>}

      {/* ── SEAT BY SEAT ─────────────────────────────── */}
      {view === 'seats' && <>
        <div className="flex gap-2 mb-4 flex-wrap">
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y as any)}
              className="px-4 py-2 rounded-lg text-sm font-bold"
              style={{
                backgroundColor: yearTab===y ? `#${partyColor(topParty[0])}` : 'var(--bg3)',
                color: yearTab===y ? '#fff' : 'var(--text2)',
                border: '1px solid var(--border)',
              }}>
              {y}
            </button>
          ))}
          <select value={div} onChange={e => setDiv(e.target.value)}>
            {DIVS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <StatCard label="Seats shown" value={yearRows.length} />
          <StatCard label="Dominant party"
            value={`${topParty[0]} (${topParty[1]})`}
            color={`#${partyColor(topParty[0])}`} />
          <StatCard label="Avg margin" value={avgMargin.toLocaleString()} sub="votes" />
        </div>

        {/* Cards in LA-1 → LA-45 order */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {yearRows.map(seat => {
            const pc = `#${partyColor(seat.winner_party)}`
            return (
              <div key={seat.seat_id} className="card"
                   style={{ borderLeft:`4px solid ${pc}` }}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-xs" style={{ color:'var(--text3)' }}>
                      {seat.seat_id} · {seat.division}
                    </span>
                    <p className="font-semibold text-sm leading-snug">{seat.seat_name}</p>
                  </div>
                  <span className="badge text-white ml-2" style={{ backgroundColor:pc }}>
                    {seat.winner_party}
                  </span>
                </div>
                <p className="font-bold" style={{ color:pc }}>{seat.winner}</p>
                <p className="text-xs mt-1" style={{ color:'var(--text2)' }}>
                  {seat.winner_votes?.toLocaleString()} votes · margin {seat.margin_votes?.toLocaleString() ?? '—'}
                </p>
                <p className="text-xs" style={{ color:'var(--text3)' }}>
                  Runner-up: {seat.runner_up} ({seat.runner_up_party}) · {seat.runner_up_votes?.toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      </>}

      {/* ── COMPARISON ───────────────────────────────── */}
      {view === 'compare' && <>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <StatCard label="Stable (0 flips)"
            value={compRows.filter(r=>r.flips===0&&r.p11!=='—').length}
            sub="Same party all 3 elections" />
          <StatCard label="Moderate (1 flip)"
            value={compRows.filter(r=>r.flips===1).length} />
          <StatCard label="High volatility (2 flips)"
            value={compRows.filter(r=>r.flips===2).length}
            sub="Changed every election" />
        </div>

        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-3">
            2011 → 2016 → 2021 seat-by-seat
            <span className="text-xs font-normal ml-2" style={{ color:'var(--text3)' }}>
              LA-1 to LA-45 in order
            </span>
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom:'2px solid var(--border)' }}>
                {['Seat','Constituency','Div','2011 Winner','Party','2016 Winner','Party','2021 Winner','Party','Flips'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-xs uppercase font-semibold"
                      style={{ color:'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compRows.map(r => (
                <tr key={r.sid} style={{ borderBottom:'1px solid var(--border)' }}
                    className="hover:opacity-75 transition-opacity">
                  <td className="py-2 px-2 text-xs font-mono font-semibold"
                      style={{ color:'var(--accent)' }}>{r.sid}</td>
                  <td className="py-2 px-2 text-xs font-medium">{r.name}</td>
                  <td className="py-2 px-2 text-xs" style={{ color:'var(--text3)' }}>{r.div}</td>
                  <td className="py-2 px-2 text-xs">{r.w11}</td>
                  <td className="py-2 px-2">
                    {r.p11!=='—' && <span className="badge text-white" style={{ backgroundColor:`#${partyColor(r.p11)}` }}>{r.p11}</span>}
                  </td>
                  <td className="py-2 px-2 text-xs">{r.w16}</td>
                  <td className="py-2 px-2">
                    {r.p16!=='—' && <span className="badge text-white" style={{ backgroundColor:`#${partyColor(r.p16)}` }}>{r.p16}</span>}
                  </td>
                  <td className="py-2 px-2 text-xs">{r.w21}</td>
                  <td className="py-2 px-2">
                    {r.p21!=='—' && <span className="badge text-white" style={{ backgroundColor:`#${partyColor(r.p21)}` }}>{r.p21}</span>}
                  </td>
                  <td className="py-2 px-2 text-center font-bold">
                    <span style={{ color:r.flips===2?'#dc2626':r.flips===1?'#d97706':'#16a34a' }}>
                      {r.p11==='—' ? 'New' : r.flips}
                    </span>
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
