import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { supabase, Constituency, partyColor } from '@/lib/supabase'

const numSort = (a: string, b: string) =>
  parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])

type SortKey = 'seat' | 'growth_pct' | 'growth_num' | 'female_pct' | 'male_pct'
type SortDir = 'desc' | 'asc'

// Clickable column header — toggles asc/desc on second click
function SortTh({ label, k, current, dir, onSort }: {
  label: string; k: SortKey; current: SortKey; dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === k
  const arrow  = active ? (dir === 'desc' ? ' ↓' : ' ↑') : ''
  return (
    <th className="py-2 px-2 text-xs uppercase font-semibold text-right cursor-pointer
                   select-none whitespace-nowrap hover:opacity-80 transition-opacity"
        style={{ color: active ? 'var(--accent)' : 'var(--text3)' }}
        onClick={() => onSort(k)}>
      {label}{arrow}
    </th>
  )
}

export default function Demography() {
  const [seats, setSeats]     = useState<Constituency[]>([])
  const [winners, setWinners] = useState<Record<string, { name: string; party: string }>>({})
  const [sortBy, setSort]     = useState<SortKey>('seat')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [region, setRegion]   = useState('All')

  useEffect(() => {
    supabase.from('constituencies').select('*')
      .then(({ data }) => setSeats(data || []))
    // Fetch 2021 winners — keyed by seat_id for O(1) lookup in the table
    supabase.from('elections_history')
      .select('seat_id, winner, winner_party')
      .eq('election_year', 2021)
      .then(({ data }) => {
        const map: Record<string, { name: string; party: string }> = {}
        for (const r of data || []) map[r.seat_id] = { name: r.winner, party: r.winner_party }
        setWinners(map)
      })
  }, [])

  // Clicking same column flips direction; clicking new column resets to desc
  function handleSort(k: SortKey) {
    if (k === sortBy) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSort(k)
      setSortDir('desc')
    }
  }

  const base = seats.filter(s => region === 'All' || s.region === region)

  function metrics(s: Constituency) {
    const growthNum = s.registered_2026 - s.registered_2021
    const growthPct = s.registered_2021 > 0
      ? (growthNum / s.registered_2021) * 100 : 0
    const femalePct = s.registered_2026 > 0
      ? (s.registered_female_2026 / s.registered_2026) * 100 : 0
    const malePct = 100 - femalePct
    return { growthNum, growthPct, femalePct, malePct }
  }

  const sorted = [...base].sort((a, b) => {
    let diff = 0
    if (sortBy === 'seat')       diff = numSort(a.seat_id, b.seat_id)
    else if (sortBy === 'growth_pct') diff = metrics(a).growthPct - metrics(b).growthPct
    else if (sortBy === 'growth_num') diff = metrics(a).growthNum - metrics(b).growthNum
    else if (sortBy === 'female_pct') diff = metrics(a).femalePct - metrics(b).femalePct
    else if (sortBy === 'male_pct')   diff = metrics(a).malePct   - metrics(b).malePct
    // seat always asc; numeric columns: desc by default, flip when dir=asc
    return sortBy === 'seat' ? diff : sortDir === 'desc' ? -diff : diff
  })

  const total26   = base.reduce((s, c) => s + c.registered_2026, 0)
  const total21   = base.reduce((s, c) => s + c.registered_2021, 0)
  const female26  = base.reduce((s, c) => s + c.registered_female_2026, 0)
  const male26    = base.reduce((s, c) => s + c.registered_male_2026, 0)
  const growth    = total26 - total21
  const growthPct = total21 > 0 ? ((growth / total21) * 100).toFixed(1) : '0'
  const femPct    = total26 > 0 ? ((female26 / total26) * 100).toFixed(1) : '0'
  const malePct   = total26 > 0 ? ((male26 / total26) * 100).toFixed(1) : '0'

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1 font-display">2026 Voter Demography</h2>
      <p className="text-sm mb-6" style={{ color:'var(--text2)' }}>
        EC-notified electoral rolls, 22 May 2026
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total registered 2026" value={total26.toLocaleString()} />
        <StatCard label="Growth from 2021"
          value={`+${growthPct}%`}
          sub={`+${growth.toLocaleString()} voters`} />
        <StatCard label="Male / Female split"
          value={`${malePct}% / ${femPct}%`}
          sub={`${male26.toLocaleString()} M · ${female26.toLocaleString()} F`} />
        <StatCard label="New voters" value="~377K" sub="at 2021 turnout rate" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select value={region} onChange={e => setRegion(e.target.value)}>
          <option value="All">All regions</option>
          <option value="In-Region">In-Region (33 seats)</option>
          <option value="Refugee">Refugee (12 seats)</option>
        </select>
        <div className="flex gap-1 flex-wrap">
          {([
            ['seat',       'By seat no.'],
            ['growth_num', 'New voters'],
            ['growth_pct', 'Growth %'],
            ['female_pct', 'Female %'],
            ['male_pct',   'Male %'],
          ] as const).map(([k, label]) => {
            const active = sortBy === k
            const arrow  = active ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''
            return (
              <button key={k} onClick={() => handleSort(k)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'var(--accent)' : 'var(--bg3)',
                  color: active ? '#fff' : 'var(--text2)',
                  border: '1px solid var(--border)',
                }}>
                {label}{arrow}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <div className="card" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", maxWidth: "100%" }}>
        <h3 className="text-sm font-semibold uppercase mb-3" style={{ color:'var(--text3)' }}>
          All {sorted.length} constituencies — 2021 vs 2026 rolls
        </h3>
        <table className="w-full text-sm" style={{ minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom:'2px solid var(--border)', backgroundColor:'var(--bg3)' }}>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-left"
                  style={{ color:'var(--text3)' }}>Seat</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-left"
                  style={{ color:'var(--text3)' }}>Constituency</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-left"
                  style={{ color:'var(--text3)' }}>Region</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>2021</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-left"
                  style={{ color:'var(--text3)' }}>2021 MLA</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>2026</th>
              <SortTh label="New voters"  k="growth_num" current={sortBy} dir={sortDir} onSort={handleSort} />
              <SortTh label="Growth %"    k="growth_pct" current={sortBy} dir={sortDir} onSort={handleSort} />
              <SortTh label="Male"        k="male_pct"   current={sortBy} dir={sortDir} onSort={handleSort} />
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>Male %</th>
              <SortTh label="Female"      k="female_pct" current={sortBy} dir={sortDir} onSort={handleSort} />
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>Female %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const { growthNum, growthPct, femalePct, malePct } = metrics(s)
              return (
                <tr key={s.seat_id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: i % 2 === 0 ? 'var(--card-bg)' : 'var(--bg3)',
                    }}
                    className="hover:opacity-80 transition-opacity">
                  <td className="py-2 px-2 text-xs font-mono font-semibold"
                      style={{ color:'var(--accent)' }}>{s.seat_id}</td>
                  {/* Constituency — wraps inside fixed width instead of pushing table wide */}
                  <td className="py-2 px-2 text-xs font-medium leading-snug"
                      style={{ wordBreak:'break-word', overflowWrap:'anywhere' }}>
                    {s.seat_name}
                  </td>
                  <td className="py-2 px-2 text-xs" style={{ color:'var(--text2)' }}>{s.region}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs"
                      style={{ color:'var(--text3)' }}>
                    {s.registered_2021.toLocaleString()}
                  </td>
                  {/* 2021 MLA — winner name + party badge */}
                  <td className="py-2 px-2 text-xs leading-snug"
                      style={{ wordBreak:'break-word', overflowWrap:'anywhere' }}>
                    {winners[s.seat_id] ? (
                      <>
                        <span className="font-medium">{winners[s.seat_id].name}</span>
                        <br />
                        <span className="inline-block mt-0.5 px-1 py-0 rounded text-white text-[10px] font-semibold"
                              style={{ backgroundColor: partyColor(winners[s.seat_id].party) }}>
                          {winners[s.seat_id].party}
                        </span>
                      </>
                    ) : <span style={{ color:'var(--text3)' }}>—</span>}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold">
                    {s.registered_2026.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold"
                      style={{ color: growthNum > 0 ? '#16a34a' : '#dc2626' }}>
                    {growthNum > 0 ? '+' : ''}{growthNum.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold"
                      style={{ color: growthPct > 20 ? '#16a34a' : growthPct < 0 ? '#dc2626' : 'var(--text)' }}>
                    {growthNum > 0 ? '+' : ''}{growthPct.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs"
                      style={{ color:'var(--text2)' }}>
                    {s.registered_male_2026.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs"
                      style={{ color:'var(--text2)' }}>
                    {malePct.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs"
                      style={{ color:'var(--text2)' }}>
                    {s.registered_female_2026.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-xs"
                      style={{ color: femalePct > 49 ? '#16a34a' : 'var(--text2)' }}>
                    {femalePct.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop:'2px solid var(--border)', backgroundColor:'var(--bg3)' }}>
              <td colSpan={3} className="py-2 px-2 text-xs font-semibold uppercase"
                  style={{ color:'var(--text3)' }}>Total ({sorted.length} seats)</td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold"
                  style={{ color:'var(--text3)' }}>
                {base.reduce((s,c) => s+c.registered_2021,0).toLocaleString()}
              </td>
              <td className="py-2 px-2 text-xs" style={{ color:'var(--text3)' }}>—</td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-bold">
                {total26.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-bold" style={{ color:'#16a34a' }}>
                +{growth.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-bold" style={{ color:'#16a34a' }}>
                +{growthPct}%
              </td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold"
                  style={{ color:'var(--text2)' }}>{male26.toLocaleString()}</td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold"
                  style={{ color:'var(--text2)' }}>{malePct}%</td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold"
                  style={{ color:'var(--text2)' }}>{female26.toLocaleString()}</td>
              <td className="py-2 px-2 text-right tabular-nums text-xs font-semibold"
                  style={{ color:'var(--text2)' }}>{femPct}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
      </div>
    </Layout>
  )
}
