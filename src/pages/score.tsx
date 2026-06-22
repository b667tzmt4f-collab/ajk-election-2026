import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { SEAT_NAMES, SEAT_IDS } from '@/lib/seatNames'

// ─────────────────────────────────────────────────────────────────────────────
// /score — Analyst scoring interface for the 2026 projection model.
// Password-protected (same as /enter). Each seat gets a KPI scorecard
// (6 pillars, 1–5 scale) plus candidate fields and party weight override.
// Saves to Supabase seat_scores table → feeds /projection page publicly.
// ─────────────────────────────────────────────────────────────────────────────

const ENTRY_PASSWORD = process.env.NEXT_PUBLIC_ENTRY_PASSWORD || 'ajk2026'

// KPI pillars — weight must sum to 100
const PILLARS = [
  { key: 'kpi_ground_org',   label: 'Ground Organisation',        weight: 30,
    hint: 'Candidate local infrastructure, biraderi network, booth-agent coverage' },
  { key: 'kpi_historical',   label: 'Historical Baseline',        weight: 20,
    hint: '2011/2016/2021 results, volatility class, margin trajectory' },
  { key: 'kpi_religious',    label: 'Religious & Sectarian',      weight: 15,
    hint: 'Biraderi bloc alignment, local religious vote concentration' },
  { key: 'kpi_structural',   label: 'Structural Factors',         weight: 15,
    hint: 'Voter roll growth, new voter demographics, female registration gap' },
  { key: 'kpi_candidate',    label: 'Candidate Strength',         weight: 15,
    hint: 'Incumbency, disqualification history, local standing vs main opponent' },
  { key: 'kpi_social_media', label: 'Social Media Signal',        weight: 5,
    hint: 'Aggregated sentiment from public posts and local press' },
] as const

type PillarKey = typeof PILLARS[number]['key']

type Score = {
  seat_id: string
  kpi_ground_org: number; kpi_historical: number; kpi_religious: number
  kpi_structural: number; kpi_candidate: number; kpi_social_media: number
  kpi_score: number
  party_weight_pct: number; dominant_party: string; party_score: number
  projected_winner: string; projected_party: string
  runner_up_name: string; runner_up_party: string
  confidence: string; analyst_note: string; stage: number
}

const DEFAULT_SCORE = (seat_id: string): Score => ({
  seat_id, kpi_ground_org: 3, kpi_historical: 3, kpi_religious: 3,
  kpi_structural: 3, kpi_candidate: 3, kpi_social_media: 3,
  kpi_score: 60, party_weight_pct: 0, dominant_party: '', party_score: 50,
  projected_winner: '', projected_party: '', runner_up_name: '', runner_up_party: '',
  confidence: 'pending', analyst_note: '', stage: 1,
})

// KPI formula: weighted average of 6 pillars scaled to 0–100
function computeKpi(s: Score, partyWeightPct: number, partyScore: number): number {
  const raw = (
    s.kpi_ground_org   * 30 +
    s.kpi_historical   * 20 +
    s.kpi_religious    * 15 +
    s.kpi_structural   * 15 +
    s.kpi_candidate    * 15 +
    s.kpi_social_media * 5
  ) / 5  // converts 1–5 scale to 0–100
  if (partyWeightPct === 0) return Math.round(raw * 10) / 10
  const blended = raw * (1 - partyWeightPct / 100) + partyScore * (partyWeightPct / 100)
  return Math.round(blended * 10) / 10
}

// Confidence auto-classification based on analyst-set gap
function autoConfidence(kpiScore: number): string {
  if (kpiScore >= 80) return 'high'
  if (kpiScore >= 65) return 'moderate'
  if (kpiScore >= 50) return 'toss-up'
  return 'pending'
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#1B7A43', moderate: '#B26A00', 'toss-up': '#6b7280', pending: '#9ca3af',
}

// 1–5 slider with labelled endpoints
function PillarSlider({ pillar, value, onChange }: {
  pillar: typeof PILLARS[number]; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <div>
          <span className="text-sm font-medium">{pillar.label}</span>
          <span className="text-xs ml-2" style={{ color: 'var(--text3)' }}>
            ({pillar.weight}% weight)
          </span>
        </div>
        <span className="text-sm font-bold w-6 text-right" style={{ color: 'var(--accent)' }}>
          {value}
        </span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: 'var(--accent)' }} />
      <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text3)' }}>
        <span>1 — Very weak</span><span>3 — Neutral</span><span>5 — Very strong</span>
      </div>
      <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{pillar.hint}</p>
    </div>
  )
}

export default function ScorePage() {
  const [authed, setAuthed]   = useState(false)
  const [pw, setPw]           = useState('')
  const [pwError, setPwError] = useState('')
  const [scores, setScores]   = useState<Record<string, Score>>({})
  const [selected, setSelected] = useState<string>('LA-1')
  const [saving, setSaving]   = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authed) return
    supabase.from('seat_scores').select('*')
      .then(({ data }) => {
        const map: Record<string, Score> = {}
        // Start with defaults for all 33 in-region seats
        for (const sid of SEAT_IDS.slice(0, 33)) map[sid] = DEFAULT_SCORE(sid)
        // Overlay with any saved DB data
        for (const row of data || []) map[row.seat_id] = { ...DEFAULT_SCORE(row.seat_id), ...row }
        setScores(map)
        setLoading(false)
      })
  }, [authed])

  function updateField(field: string, value: any) {
    setScores(prev => {
      const seat = { ...prev[selected], [field]: value }
      // Recompute KPI score live
      seat.kpi_score = computeKpi(seat, seat.party_weight_pct, seat.party_score)
      seat.confidence = autoConfidence(seat.kpi_score)
      return { ...prev, [selected]: seat }
    })
  }

  async function handleSave() {
    setSaving(true); setSavedMsg('')
    const seat = { ...scores[selected] }
    seat.kpi_score = computeKpi(seat, seat.party_weight_pct, seat.party_score)
    seat.scored_at = new Date().toISOString()
    const { error } = await supabase.from('seat_scores').upsert(seat, { onConflict: 'seat_id' })
    setSaving(false)
    setSavedMsg(error ? `Error: ${error.message}` : `✓ ${selected} saved`)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  // ── Login ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <Layout>
      <div className="max-w-sm mx-auto mt-20 card">
        <h2 className="font-semibold mb-4 text-lg">Analyst Access</h2>
        <input type="password" placeholder="Password" value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              pw === ENTRY_PASSWORD ? setAuthed(true) : setPwError('Wrong password')
            }
          }}
          className="w-full border rounded-lg px-3 py-2 mb-2 text-sm"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
        {pwError && <p className="text-red-500 text-xs mb-2">{pwError}</p>}
        <button onClick={() => pw === ENTRY_PASSWORD ? setAuthed(true) : setPwError('Wrong password')}
          className="w-full py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--accent)' }}>
          Enter
        </button>
      </div>
    </Layout>
  )

  if (loading) return <Layout><div className="text-center py-20" style={{ color: 'var(--text2)' }}>Loading scores…</div></Layout>

  const seat = scores[selected] || DEFAULT_SCORE(selected)
  const kpiScore = computeKpi(seat, seat.party_weight_pct, seat.party_score)
  const inRegionSeats = SEAT_IDS.slice(0, 33) // LA-1 to LA-33

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 font-display">2026 Projection — Scoring</h2>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Six-pillar KPI scorecard · 33 in-region seats · candidate-based model
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* ── Left: Seat selector ─────────────────────────────────────────── */}
        <div className="card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text3)' }}>
            Constituencies
          </h3>
          <div className="space-y-1">
            {inRegionSeats.map(sid => {
              const s = scores[sid]
              const conf = s?.confidence || 'pending'
              const scored = s?.projected_winner !== ''
              return (
                <button key={sid} onClick={() => setSelected(sid)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: selected === sid ? 'var(--soft)' : 'transparent',
                    borderLeft: `3px solid ${CONFIDENCE_COLORS[conf]}`,
                    color: 'var(--text)',
                  }}>
                  <div className="flex justify-between items-center">
                    <span>
                      <span className="font-mono text-xs" style={{ color: 'var(--text3)' }}>{sid} </span>
                      <span className="font-medium">{SEAT_NAMES[sid]?.split('(')[0].trim()}</span>
                    </span>
                    {scored
                      ? <span className="text-[10px] font-semibold" style={{ color: CONFIDENCE_COLORS[conf] }}>
                          {conf}
                        </span>
                      : <span className="text-[10px]" style={{ color: 'var(--text3)' }}>unseen</span>
                    }
                  </div>
                  {s?.projected_winner && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>
                      → {s.projected_winner}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right: Scorecard ─────────────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-4">

          {/* Header */}
          <div className="card">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="font-bold text-lg">{selected} — {SEAT_NAMES[selected]}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                  Score each pillar 1 (weakest) → 5 (strongest) for your projected front-runner
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: CONFIDENCE_COLORS[seat.confidence] }}>
                  {kpiScore.toFixed(1)}
                </div>
                <div className="text-xs font-semibold uppercase" style={{ color: CONFIDENCE_COLORS[seat.confidence] }}>
                  {seat.confidence}
                </div>
              </div>
            </div>

            {/* KPI score bar */}
            <div className="w-full rounded-full h-2 mt-2" style={{ backgroundColor: 'var(--border)' }}>
              <div className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${kpiScore}%`, backgroundColor: CONFIDENCE_COLORS[seat.confidence] }} />
            </div>
          </div>

          {/* Six pillars */}
          <div className="card">
            <h4 className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--text3)' }}>
              Six-Pillar KPI Inputs
            </h4>
            {PILLARS.map(p => (
              <PillarSlider key={p.key} pillar={p}
                value={seat[p.key as PillarKey] as number}
                onChange={v => updateField(p.key, v)} />
            ))}
          </div>

          {/* Party weight override */}
          <div className="card">
            <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text3)' }}>
              Party Weight Override
            </h4>
            <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
              Use when party label meaningfully drives the vote (e.g. PPP stronghold, PML-N bloc seat).
              Set to 0 for pure candidate-based scoring.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium block mb-1">Party weight %</label>
                <input type="number" min={0} max={100} value={seat.party_weight_pct}
                  onChange={e => updateField('party_weight_pct', Number(e.target.value))}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Dominant party</label>
                <input type="text" placeholder="e.g. PPP" value={seat.dominant_party}
                  onChange={e => updateField('dominant_party', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Party score (0–100)</label>
                <input type="number" min={0} max={100} value={seat.party_score}
                  onChange={e => updateField('party_score', Number(e.target.value))}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
              </div>
            </div>
          </div>

          {/* Projected winner */}
          <div className="card">
            <h4 className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text3)' }}>
              Projected Outcome
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium block mb-1">Projected winner (candidate name)</label>
                <input type="text" placeholder="Full name" value={seat.projected_winner}
                  onChange={e => updateField('projected_winner', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Their party</label>
                <input type="text" placeholder="e.g. IND (ex-PTI)" value={seat.projected_party}
                  onChange={e => updateField('projected_party', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Runner-up (candidate name)</label>
                <input type="text" placeholder="Full name" value={seat.runner_up_name}
                  onChange={e => updateField('runner_up_name', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Runner-up party</label>
                <input type="text" placeholder="e.g. PPP" value={seat.runner_up_party}
                  onChange={e => updateField('runner_up_party', e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
              </div>
            </div>

            {/* Confidence override */}
            <div className="mb-3">
              <label className="text-xs font-medium block mb-1">
                Confidence <span style={{ color: 'var(--text3)' }}>(auto-set from KPI, override if needed)</span>
              </label>
              <div className="flex gap-2">
                {['high','moderate','toss-up','pending'].map(c => (
                  <button key={c} onClick={() => updateField('confidence', c)}
                    className="px-3 py-1 rounded text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: seat.confidence === c ? CONFIDENCE_COLORS[c] : 'var(--bg3)',
                      color: seat.confidence === c ? '#fff' : 'var(--text2)',
                      border: '1px solid var(--border)',
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyst note */}
            <div className="mb-4">
              <label className="text-xs font-medium block mb-1">Analyst note (shown publicly)</label>
              <textarea value={seat.analyst_note}
                onChange={e => updateField('analyst_note', e.target.value)}
                rows={3} placeholder="Ground assessment, key factors, caveats…"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg3)' }} />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: saving ? 'var(--border)' : 'var(--accent)' }}>
                {saving ? 'Saving…' : `Save ${selected}`}
              </button>
              {savedMsg && (
                <span className="text-sm font-medium"
                  style={{ color: savedMsg.startsWith('✓') ? '#1B7A43' : '#dc2626' }}>
                  {savedMsg}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}
