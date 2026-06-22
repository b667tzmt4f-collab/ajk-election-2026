import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { supabase, Constituency } from '@/lib/supabase'

const numSort = (a: string, b: string) =>
  parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])

// All sortable columns — each maps to a sort function
type SortKey = 'seat' | 'growth_pct' | 'growth_num' | 'female_pct' | 'male_pct'

// Clickable column header with active indicator
function SortTh({ label, k, current, onSort }: {
  label: string; k: SortKey; current: SortKey; onSort: (k: SortKey) => void
}) {
  const active = current === k
  return (
    <th className="py-2 px-2 text-xs uppercase font-semibold text-right cursor-pointer select-none
                   whitespace-nowrap hover:opacity-80 transition-opacity"
        style={{ color: active ? 'var(--accent)' : 'var(--text3)' }}
        onClick={() => onSort(k)}>
      {label}{active ? ' ↓' : ''}
    </th>
  )
}

export default function Demography() {
  const [seats, setSeats]   = useState<Constituency[]>([])
  const [sortBy, setSort]   = useState<SortKey>('seat')
  const [region, setRegion] = useState('All')

  useEffect(() => {
    supabase.from('constituencies').select('*')
      .then(({ data }) => setSeats(data || []))
  }, [])

  const base = seats.filter(s => region === 'All' || s.region === region)

  // Derived metrics for each seat
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
    if (sortBy === 'seat')       return numSort(a.seat_id, b.seat_id)
    if (sortBy === 'growth_pct') return metrics(b).growthPct - metrics(a).growthPct
    if (sortBy === 'growth_num') return metrics(b).growthNum - metrics(a).growthNum
    if (sortBy === 'female_pct') return metrics(b).femalePct - metrics(a).femalePct
    if (sortBy === 'male_pct')   return metrics(b).malePct   - metrics(a).malePct
    return 0
  })

  // Aggregate stats
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

      {/* Summary stat cards */}
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

      {/* Sort & filter controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select value={region} onChange={e => setRegion(e.target.value)}>
          <option value="All">All regions</option>
          <option value="In-Region">In-Region (33 seats)</option>
          <option value="Refugee">Refugee (12 seats)</option>
        </select>

        {/* Quick-sort buttons — mirror the column sort headers */}
        <div className="flex gap-1 flex-wrap">
          {([
            ['seat',       'By seat no.'],
            ['growth_num', 'By new voters ↓'],
            ['growth_pct', 'By growth % ↓'],
            ['female_pct', 'By female % ↓'],
            ['male_pct',   'By male % ↓'],
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setSort(k)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: sortBy===k ? 'var(--accent)' : 'var(--bg3)',
                color: sortBy===k ? '#fff' : 'var(--text2)',
                border: '1px solid var(--border)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="text-sm font-semibold uppercase mb-3" style={{ color:'var(--text3)' }}>
          All {sorted.length} constituencies — 2021 vs 2026 rolls
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom:'2px solid var(--border)', backgroundColor:'var(--bg3)' }}>
              {/* Static left columns */}
              <th className="py-2 px-2 text-xs uppercase font-semibold text-left"
                  style={{ color:'var(--text3)' }}>Seat</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-left"
                  style={{ color:'var(--text3)' }}>Constituency</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-left"
                  style={{ color:'var(--text3)' }}>Region</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>2021</th>
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>2026</th>

              {/* Sortable columns — click header to sort */}
              <SortTh label="New voters"  k="growth_num" current={sortBy} onSort={setSort} />
              <SortTh label="Growth %"    k="growth_pct" current={sortBy} onSort={setSort} />
              <SortTh label="Male"        k="male_pct"   current={sortBy} onSort={setSort} />
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>Male %</th>
              <SortTh label="Female"      k="female_pct" current={sortBy} onSort={setSort} />
              <th className="py-2 px-2 text-xs uppercase font-semibold text-right"
                  style={{ color:'var(--text3)' }}>Female %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const { growthNum, growthPct, femalePct, malePct } = metrics(s)
              const gPctStr = growthPct.toFixed(1)
              const fPctStr = femalePct.toFixed(1)
              const mPctStr = malePct.toFixed(1)
              const male26s   = s.registered_male_2026
              const female26s = s.registered_female_2026

              return (
                <tr key={s.seat_id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: i % 2 === 0 ? 'var(--card-bg)' : 'var(--bg3)',
                    }}
                    className="hover:opacity-80 transition-opacity">

                  <td className="py-2 px-2 text-xs font-mono font-semibold"
                      style={{ color:'var(--accent)' }}>{s.seat_id}</td>
                  <td className="py-2 px-2 font-medium whitespace-nowrap">{s.seat_name}</td>
                  <td className="py-2 px-2 text-xs" style={{ color:'var(--text2)' }}>{s.region}</td>

                  {/* 2021 total */}
                  <td className="py-2 px-2 text-right tabular-nums"
                      style={{ color:'var(--text3)' }}>
                    {s.registered_2021.toLocaleString()}
                  </td>

                  {/* 2026 total */}
                  <td className="py-2 px-2 text-right tabular-nums font-semibold">
                    {s.registered_2026.toLocaleString()}
                  </td>

                  {/* New voters (absolute growth) */}
                  <td className="py-2 px-2 text-right tabular-nums font-semibold"
                      style={{ color: growthNum > 0 ? '#16a34a' : '#dc2626' }}>
                    {growthNum > 0 ? '+' : ''}{growthNum.toLocaleString()}
                  </td>

                  {/* Growth % */}
                  <td className="py-2 px-2 text-right tabular-nums font-semibold"
                      style={{ color: growthPct > 20 ? '#16a34a' : growthPct < 0 ? '#dc2626' : 'var(--text)' }}>
                    {growthNum > 0 ? '+' : ''}{gPctStr}%
                  </td>

                  {/* Male voters count */}
                  <td className="py-2 px-2 text-right tabular-nums"
                      style={{ color:'var(--text2)' }}>
                    {male26s.toLocaleString()}
                  </td>

                  {/* Male % */}
                  <td className="py-2 px-2 text-right tabular-nums"
                      style={{ color:'var(--text2)' }}>
                    {mPctStr}%
                  </td>

                  {/* Female voters count */}
                  <td className="py-2 px-2 text-right tabular-nums"
                      style={{ color:'var(--text2)' }}>
                    {female26s.toLocaleString()}
                  </td>

                  {/* Female % */}
                  <td className="py-2 px-2 text-right tabular-nums"
                      style={{ color: femalePct > 49 ? '#16a34a' : 'var(--text2)' }}>
                    {fPctStr}%
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Totals footer */}
          <tfoot>
            <tr style={{ borderTop:'2px solid var(--border)', backgroundColor:'var(--bg3)' }}>
              <td colSpan={3} className="py-2 px-2 text-xs font-semibold uppercase"
                  style={{ color:'var(--text3)' }}>Total ({sorted.length} seats)</td>
              <td className="py-2 px-2 text-right tabular-nums font-semibold"
                  style={{ color:'var(--text3)' }}>
                {base.reduce((s,c) => s+c.registered_2021,0).toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right tabular-nums font-bold">
                {total26.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right tabular-nums font-bold"
                  style={{ color:'#16a34a' }}>
                +{growth.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right tabular-nums font-bold"
                  style={{ color:'#16a34a' }}>
                +{growthPct}%
              </td>
              <td className="py-2 px-2 text-right tabular-nums font-semibold"
                  style={{ color:'var(--text2)' }}>
                {male26.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right tabular-nums font-semibold"
                  style={{ color:'var(--text2)' }}>
                {malePct}%
              </td>
              <td className="py-2 px-2 text-right tabular-nums font-semibold"
                  style={{ color:'var(--text2)' }}>
                {female26.toLocaleString()}
              </td>
              <td className="py-2 px-2 text-right tabular-nums font-semibold"
                  style={{ color:'var(--text2)' }}>
                {femPct}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Layout>
  )
}
