import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { supabase, partyColor } from '@/lib/supabase'
import { SEAT_NAMES } from '@/lib/seatNames'

// ─────────────────────────────────────────────────────────────────────────────
// /projection — Public-facing 2026 seat-by-seat projection.
// Reads live from seat_scores table (populated via /score analyst interface).
// ─────────────────────────────────────────────────────────────────────────────

type SeatScore = {
  seat_id: string
  projected_winner: string; projected_party: string
  runner_up_name: string;   runner_up_party: string
  confidence: string;       analyst_note: string
  kpi_score: number;        party_weight_pct: number; dominant_party: string
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#1B7A43', moderate: '#B26A00', 'toss-up': '#6b7280', pending: '#9ca3af',
}

const PIPELINE = [
  { stage:'1', label:'Historical Evidence Base', status:'Active',
    detail:'2021 post-tribunal results, 2016, 2011. All 45 seats in database.' },
  { stage:'2', label:'Candidate Intelligence', status:'Active',
    detail:'Six-pillar KPI scorecard per seat. Candidate-based, party weight where relevant.' },
  { stage:'3', label:'KPI Model + Confidence Classification', status:'Pending',
    detail:'Ground 30% · Historical 20% · Religious 15% · Structural 15% · Candidate 15% · Social 5%' },
  { stage:'4', label:'Final Adjudication', status:'Pending',
    detail:'Manual review of toss-up seats. Published with confidence ratings.' },
]

const numSort = (a: string, b: string) =>
  parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])

export default function Projection() {
  const [scores, setScores]     = useState<SeatScore[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<string>('all')

  useEffect(() => {
    supabase.from('seat_scores').select('*')
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => numSort(a.seat_id, b.seat_id))
        setScores(sorted)
        setLoading(false)
      })
  }, [])

  const called   = scores.filter(s => s.projected_winner && s.projected_winner !== '')
  const high     = called.filter(s => s.confidence === 'high')
  const moderate = called.filter(s => s.confidence === 'moderate')
  const tossup   = called.filter(s => s.confidence === 'toss-up')

  // Party seat tally from high-confidence calls only
  const partyTally: Record<string, number> = {}
  for (const s of high) {
    partyTally[s.projected_party] = (partyTally[s.projected_party] || 0) + 1
  }

  const filtered = filter === 'all' ? called
    : filter === 'high' ? high
    : filter === 'moderate' ? moderate
    : tossup

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 font-display">2026 Projection</h2>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Candidate-based KPI model · {called.length} of 33 in-region seats scored ·
          Party weight applied where seat dynamics warrant it
        </p>
      </div>

      {/* Pipeline */}
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {PIPELINE.map(p => (
          <div key={p.stage} className="card"
               style={{ borderTop: `3px solid ${p.status==='Active'?'#1B7A43':'var(--border)'}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text3)' }}>Stage {p.stage}</span>
              <span className="badge text-xs"
                    style={{ backgroundColor: p.status==='Active'?'#1B7A43':'var(--bg3)',
                             color: p.status==='Active'?'white':'var(--text2)' }}>
                {p.status}
              </span>
            </div>
            <p className="text-sm font-semibold mb-1">{p.label}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>{p.detail}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Seats scored" value={`${called.length} / 33`} sub="In-region only" />
        <StatCard label="High confidence" value={String(high.length)}
          sub={`${moderate.length} moderate · ${tossup.length} toss-up`} />
        <StatCard label="Majority threshold" value="23" sub="of 45 seats" />
        <StatCard label="Model stage" value="2 / 4" sub="KPI scoring active" />
      </div>

      {/* Party tally from high-confidence calls */}
      {Object.keys(partyTally).length > 0 && (
        <div className="card mb-6">
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text3)' }}>
            Projected seat tally — high confidence calls only
          </h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(partyTally).sort((a,b) => b[1]-a[1]).map(([party, seats]) => (
              <div key={party} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: partyColor(party) }} />
                <span className="text-sm font-semibold">{party}</span>
                <span className="text-lg font-bold" style={{ color: partyColor(party) }}>{seats}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
            Moderate and toss-up seats excluded. Not a final forecast — model in progress.
          </p>
        </div>
      )}

      {/* Filter tabs */}
      {called.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            ['all', `All scored (${called.length})`],
            ['high', `High confidence (${high.length})`],
            ['moderate', `Moderate (${moderate.length})`],
            ['toss-up', `Toss-up (${tossup.length})`],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter === k ? 'var(--accent)' : 'var(--bg3)',
                color: filter === k ? '#fff' : 'var(--text2)',
                border: '1px solid var(--border)',
              }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Seat cards */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text2)' }}>Loading projections…</div>
      ) : called.length === 0 ? (
        <div className="card text-center py-12">
          <p className="font-semibold mb-1">No seats scored yet</p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            Use the{' '}
            <a href="/score" style={{ color: 'var(--accent)' }}>scoring interface</a>
            {' '}to begin entering KPI assessments.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {filtered.map(s => {
            const pc = partyColor(s.projected_party)
            return (
              <div key={s.seat_id} className="card"
                   style={{ borderLeft: `4px solid ${pc}` }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>
                      {s.seat_id}
                    </p>
                    <p className="font-semibold text-sm leading-snug">{SEAT_NAMES[s.seat_id]}</p>
                  </div>
                  <span className="badge text-white text-xs ml-2 flex-shrink-0"
                        style={{ backgroundColor: pc }}>
                    {s.projected_party}
                  </span>
                </div>

                <p className="font-bold text-sm mb-1" style={{ color: pc }}>
                  {s.projected_winner}
                </p>

                {s.runner_up_name && (
                  <p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>
                    Runner-up: {s.runner_up_name}
                    {s.runner_up_party && ` (${s.runner_up_party})`}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold"
                        style={{ color: CONFIDENCE_COLOR[s.confidence] }}>
                    {s.confidence.charAt(0).toUpperCase() + s.confidence.slice(1)} confidence
                  </span>
                  {s.kpi_score > 0 && (
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                      KPI {s.kpi_score.toFixed(0)}/100
                    </span>
                  )}
                  {s.party_weight_pct > 0 && (
                    <span className="text-xs px-1 rounded"
                          style={{ backgroundColor: 'var(--soft)', color: 'var(--accent)' }}>
                      {s.party_weight_pct}% party weight
                    </span>
                  )}
                </div>

                {s.analyst_note && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text3)' }}>
                    {s.analyst_note}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* KPI rubric reference */}
      <div className="card">
        <h3 className="font-semibold mb-3">Six-Pillar KPI Rubric</h3>
        <div className="space-y-2">
          {[
            ['Ground organisation', 30, "Candidate's local infrastructure, biraderi network, booth-agent coverage"],
            ['Historical baseline', 20, '2011/2016/2021 results, volatility class, margin trajectory'],
            ['Religious & sectarian dynamics', 15, 'Biraderi and local religious bloc alignment'],
            ['Structural factors', 15, 'Voter roll growth, new voter demographics, female registration gap'],
            ['Candidate strength', 15, 'Incumbency, disqualification history, local standing vs main opponent'],
            ['Social-media signal', 5, 'Aggregated sentiment from public posts and local press'],
          ].map(([label, weight, desc]) => (
            <div key={String(label)} className="flex gap-3 items-start">
              <div className="w-10 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                              text-xs font-bold text-white"
                   style={{ backgroundColor: 'var(--accent)' }}>
                {weight}%
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
