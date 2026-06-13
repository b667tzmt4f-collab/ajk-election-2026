import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { supabase, Constituency } from '@/lib/supabase'

const numSort = (a: string, b: string) =>
  parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])

type SortKey = 'seat' | 'growth' | 'female'

export default function Demography() {
  const [seats, setSeats]   = useState<Constituency[]>([])
  const [sortBy, setSort]   = useState<SortKey>('seat')   // default: seat order
  const [region, setRegion] = useState('All')

  useEffect(() => {
    supabase.from('constituencies').select('*')
      .then(({ data }) => setSeats(data || []))
  }, [])

  const base = seats.filter(s => region === 'All' || s.region === region)

  const sorted = [...base].sort((a, b) => {
    if (sortBy === 'seat') return numSort(a.seat_id, b.seat_id)
    if (sortBy === 'growth') {
      const ga = a.registered_2021 > 0 ? (a.registered_2026 - a.registered_2021) / a.registered_2021 : 0
      const gb = b.registered_2021 > 0 ? (b.registered_2026 - b.registered_2021) / b.registered_2021 : 0
      return gb - ga
    }
    const fa = a.registered_2026 > 0 ? a.registered_female_2026 / a.registered_2026 : 0
    const fb = b.registered_2026 > 0 ? b.registered_female_2026 / b.registered_2026 : 0
    return fb - fa
  })

  const total26  = base.reduce((s, c) => s + c.registered_2026, 0)
  const total21  = base.reduce((s, c) => s + c.registered_2021, 0)
  const female26 = base.reduce((s, c) => s + c.registered_female_2026, 0)
  const growth   = total26 - total21
  const growthPct = total21 > 0 ? ((growth / total21) * 100).toFixed(1) : '0'
  const femPct    = total26 > 0 ? ((female26 / total26) * 100).toFixed(1) : '0'

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1">🗺️ 2026 Voter Demography</h2>
      <p className="text-sm mb-6" style={{ color:'var(--text2)' }}>
        EC-notified electoral rolls, 22 May 2026
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total registered 2026" value={total26.toLocaleString()} />
        <StatCard label="Growth from 2021" value={`+${growthPct}%`}
                  sub={`+${growth.toLocaleString()} voters`} />
        <StatCard label="Female share" value={`${femPct}%`} sub="No seat exceeds 50%" />
        <StatCard label="New voters" value="~377K" sub="at 2021 turnout rate" />
      </div>

      {/* Sort & filter controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={region} onChange={e => setRegion(e.target.value)}>
          <option value="All">All regions</option>
          <option value="In-Region">In-Region (33 seats)</option>
          <option value="Refugee">Refugee (12 seats)</option>
        </select>
        <div className="flex gap-1">
          {([
            ['seat',   'By seat no.'],
            ['growth', 'By growth ↓'],
            ['female', 'By female % ↓'],
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
            <tr style={{ borderBottom:'2px solid var(--border)' }}>
              {['Seat','Constituency','Region','2021','2026','Growth %','Female %'].map(h => (
                <th key={h} className="text-left py-2 px-2 text-xs uppercase font-semibold"
                    style={{ color:'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const g = s.registered_2021 > 0
                ? (((s.registered_2026 - s.registered_2021) / s.registered_2021) * 100).toFixed(1)
                : '—'
              const f = s.registered_2026 > 0
                ? ((s.registered_female_2026 / s.registered_2026) * 100).toFixed(1)
                : '—'
              const gNum = parseFloat(g)
              return (
                <tr key={s.seat_id} style={{ borderBottom:'1px solid var(--border)' }}
                    className="hover:opacity-75 transition-opacity">
                  <td className="py-2 px-2 text-xs font-mono font-semibold"
                      style={{ color:'var(--accent)' }}>{s.seat_id}</td>
                  <td className="py-2 px-2 font-medium">{s.seat_name}</td>
                  <td className="py-2 px-2 text-xs" style={{ color:'var(--text2)' }}>{s.region}</td>
                  <td className="py-2 px-2 text-right">{s.registered_2021.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-semibold">{s.registered_2026.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right font-semibold"
                      style={{ color: gNum>20?'#16a34a':gNum<0?'#dc2626':'var(--text)' }}>
                    {g !== '—' ? `+${g}%` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right" style={{ color:'var(--text2)' }}>{f}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
