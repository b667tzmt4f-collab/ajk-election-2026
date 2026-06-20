import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import { partyColor } from '@/lib/supabase'
import SeatCharts from '@/components/SeatCharts'

const PROJECTION = [
  { seat_id:'LA-1', seat_name:'Mirpur-I (Dadyal)', division:'Mirpur',
    projected_winner:'IND (ex-PTI)', confidence:'Moderate',
    ground_note:'Strong personal vote for previous PTI winner, now running independent.' },
  { seat_id:'LA-2', seat_name:'Mirpur-II (Chakswari)', division:'Mirpur',
    projected_winner:'PPP', confidence:'Moderate',
    ground_note:'PPP held 2021. CH Qasim Majeed narrow winner. Competitive 3-way race.' },
  { seat_id:'LA-7', seat_name:'Bhimber-III (Bhimber City)', division:'Mirpur',
    projected_winner:'IND (ex-PTI)', confidence:'High',
    ground_note:'CH Anwar ul Haq dominant. Strongest personal mandate in 2021 (38,308 votes).' },
]

const CONFIDENCE_COLOR: Record<string,string> = {
  'High': '#1B7A43', 'Moderate': '#B26A00', 'Low': '#A32D2D', 'Tossup': '#6b7280'
}

const PIPELINE = [
  { stage:'1', label:'Historical Evidence Base', status:'Active',
    detail:'2021 post-tribunal results, 2016, 2011. 35/45 seats cross-verified.' },
  { stage:'2', label:'Field Survey', status:'Pending',
    detail:'Draft instrument ready. 450–675 respondents. Not yet fielded.' },
  { stage:'3', label:'Six-Pillar KPI Rubric', status:'Pending',
    detail:'Ground organisation 30% · Historical 20% · Religious/sectarian 15% · Structural 15% · Candidate 15% · Social media 5%' },
  { stage:'4', label:'LLM Jury + Manual Adjudication', status:'Pending',
    detail:'Claude + GPT-4 + Gemini independently scored. Disagreements manually adjudicated.' },
]

export default function Projection() {
  // aggregate the sample calls by projected party (partial — not all 45 seats)
  const projTally = PROJECTION.reduce<Record<string, number>>((acc, s) => {
    acc[s.projected_winner] = (acc[s.projected_winner] || 0) + 1
    return acc
  }, {})

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">🔮 2026 Projection</h2>
        <p className="text-sm text-muted">
          Four-stage quantitative forecast. Currently in evidence-base mode — field survey and model pending.
        </p>
      </div>

      {/* Pipeline status */}
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {PIPELINE.map(p => (
          <div key={p.stage} className="card"
               style={{ borderTop: `3px solid ${p.status==='Active'?'#1B7A43':'#374151'}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-muted">Stage {p.stage}</span>
              <span className="badge"
                    style={{ backgroundColor: p.status==='Active'?'#1B7A43':'var(--bg3)',
                             color: p.status==='Active'?'white':'var(--text2)' }}>
                {p.status==='Active'?'✅ Active':'⏳ Pending'}
              </span>
            </div>
            <p className="text-sm font-semibold mb-1">{p.label}</p>
            <p className="text-xs text-muted leading-relaxed">{p.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active factors" value="1 / 4" sub="Historical baseline only" />
        <StatCard label="Seats called" value={`${PROJECTION.length} / 45`} sub="Sample only — full model pending" />
        <StatCard label="Majority threshold" value="23" sub="of 45 seats" />
        <StatCard label="Model status" value="Evidence base" sub="Survey + KPI pending" />
      </div>

      {/* Sample seat calls — GB elections style */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-semibold">Sample Seat Calls</h3>
          <span className="badge" style={{ backgroundColor:'#7c3aed', color:'white' }}>
            ⚠️ ILLUSTRATIVE — Not a final forecast
          </span>
        </div>
        <p className="text-xs text-muted mb-4">
          These calls are for demonstration only, based on 2021 results and basic ground assessment.
          Full model requires survey data and KPI scoring.
        </p>
        <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <SeatCharts
            tally={projTally}
            houseSize={45}
            title={`Sample calls so far (${PROJECTION.length} of 45 — illustrative only)`}
          />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {PROJECTION.map(s => {
            const pc = partyColor(s.projected_winner)
            return (
              <div key={s.seat_id} className="rounded-lg p-4"
                   style={{ border: `1px solid var(--border)`, borderLeft: `4px solid ${pc}` }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-muted">{s.seat_id} · {s.division}</p>
                    <p className="font-semibold text-sm">{s.seat_name}</p>
                  </div>
                  <span className="badge text-white" style={{ backgroundColor: pc }}>
                    {s.projected_winner}
                  </span>
                </div>
                <p className="text-xs mb-2">
                  <span className="font-semibold" style={{ color: CONFIDENCE_COLOR[s.confidence] }}>
                    {s.confidence} confidence
                  </span>
                </p>
                <p className="text-xs text-muted leading-relaxed">{s.ground_note}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* KPI rubric */}
      <div className="card">
        <h3 className="font-semibold mb-3">Six-Pillar KPI Rubric</h3>
        <div className="space-y-2">
          {[
            ['Ground organisation', 30, 'Candidate\'s local infrastructure, biraderi network, booth-agent coverage'],
            ['Historical baseline', 20, '2011/2016/2021 results, volatility class, margin trajectory'],
            ['Religious & sectarian dynamics', 15, 'Biraderi and local religious bloc alignment'],
            ['Structural factors', 15, 'Voter roll growth, new voter demographics, female registration gap'],
            ['Candidate strength', 15, 'Incumbency, disqualification history, local standing vs main opponent'],
            ['Social-media signal', 5, 'Aggregated sentiment from public posts and local press'],
          ].map(([label, weight, desc]) => (
            <div key={String(label)} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                   style={{ backgroundColor: '#2563eb' }}>
                {weight}%
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
