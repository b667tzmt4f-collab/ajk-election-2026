import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import AJKConstituencyMap, { DistrictDatum } from '@/components/AJKConstituencyMap'
import { partyColor, Candidate } from '@/lib/supabase'
import { fetchTable } from '@/lib/api'
import type { SeatResult2026 } from '@/hooks/useResults2026'

// ─────────────────────────────────────────────────────────────────────────────
// Map page (v2 — dual-layer: district colour + constituency boundaries)
//
// District layer: shaded by dominant winning party for the selected year
// (2026 by default, 2021 via the toggle). Postponed 2026 seats are grey.
//   → Clicking a district CALLOUT BOX opens district seat breakdown (right panel).
//
// Constituency layer: colourless polygons with red LA-N labels overlaid on top.
//   → Clicking a constituency opens its 2021 candidate list (right panel).
//
// Panel mode: 'idle' | 'district' | 'constituency'
// ─────────────────────────────────────────────────────────────────────────────

// ── District → seat mapping ──────────────────────────────────────────────────
const SEAT_TO_DISTRICT: Record<string, string> = {
  'LA-1':  'Mirpur',       'LA-2':  'Mirpur',       'LA-3':  'Mirpur',    'LA-4':  'Mirpur',
  'LA-5':  'Bhimber',      'LA-6':  'Bhimber',      'LA-7':  'Bhimber',
  'LA-8':  'Kotli',        'LA-9':  'Kotli',         'LA-10': 'Kotli',
  'LA-11': 'Kotli',        'LA-12': 'Kotli',         'LA-13': 'Kotli',
  'LA-14': 'Bagh',         'LA-15': 'Bagh',          'LA-16': 'Bagh',
  'LA-17': 'Haveli',
  'LA-18': 'Poonch',       'LA-19': 'Poonch',        'LA-20': 'Poonch',
  'LA-21': 'Poonch',       'LA-22': 'Poonch',
  'LA-23': 'Sudhnoti',     'LA-24': 'Sudhnoti',
  'LA-25': 'Neelum',       'LA-26': 'Neelum',
  'LA-27': 'Muzaffarabad', 'LA-28': 'Muzaffarabad',
  'LA-29': 'Muzaffarabad', 'LA-31': 'Muzaffarabad',
  'LA-30': 'Jhelum Valley','LA-32': 'Jhelum Valley', 'LA-33': 'Jhelum Valley',
}

const DISTRICTS = [
  'Muzaffarabad', 'Neelum', 'Jhelum Valley', 'Bagh', 'Haveli',
  'Poonch', 'Sudhnoti', 'Kotli', 'Mirpur', 'Bhimber',
]

// ── Seat-level data (from constituencies table) ──────────────────────────────
type SeatRow = {
  seat_id: string
  seat_name: string
  winner_party_2021: string
  winner_2021: string
}

// ── Panel mode union ─────────────────────────────────────────────────────────
type PanelMode = 'idle' | 'district' | 'constituency'

export default function MapView() {
  // ── GeoJSON for district boundaries ────────────────────────────────────
  const [geo, setGeo] = useState<any>(null)

  // ── 2021 seat-level summary data ───────────────────────────────────────
  const [seats, setSeats] = useState<SeatRow[]>([])
  const [loading, setLoading] = useState(true)

  // ── 2026 results + year toggle ─────────────────────────────────────────
  const [year, setYear] = useState<2026 | 2021>(2026)
  const [res26, setRes26] = useState<Record<string, SeatResult2026>>({})
  useEffect(() => {
    fetchTable<SeatResult2026>('results_2026')
      .then((rows) => {
        const m: Record<string, SeatResult2026> = {}
        for (const r of rows) m[r.seat_id] = r
        setRes26(m)
      })
      .catch((err) => console.error('results_2026 load failed:', err))
  }, [])

  // ── Panel state ────────────────────────────────────────────────────────
  const [panelMode, setPanelMode] = useState<PanelMode>('idle')
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)

  // ── 2021 candidates for the selected constituency ──────────────────────
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [seatMeta, setSeatMeta] = useState<SeatRow | null>(null)

  // Load district boundary GeoJSON from /public
  useEffect(() => {
    fetch('/ajk_districts.geojson')
      .then((r) => r.json())
      .then(setGeo)
      .catch(() => setGeo(null))
  }, [])

  // Load 2021 seat-level winners for district rollup
  useEffect(() => {
    fetchTable<any>('constituencies')
      .then((data) => setSeats(data))
      .catch((err) => console.error('constituencies load failed:', err))
      .finally(() => setLoading(false))
  }, [])

  // ── Fetch 2021 candidates when a constituency is selected ───────────────
  useEffect(() => {
    if (!selectedSeat) return
    setCandidatesLoading(true)
    setCandidates([])

    // Fetch all candidates for this seat, ranked by 2021 votes descending
    // Server returns all candidates sorted by seat then rank_2021;
    // keep only this seat's rows (order is preserved).
    fetchTable<Candidate>('candidates')
      .then((data) => setCandidates(data.filter((c) => c.seat_id === selectedSeat)))
      .catch((err) => console.error('Candidate fetch error:', err))
      .finally(() => setCandidatesLoading(false))

    // Also grab seat meta (name, winner) for the panel header
    const meta = seats.find((s) => s.seat_id === selectedSeat) ?? null
    setSeatMeta(meta)
  }, [selectedSeat, seats])

  // Winning party / winner name for the selected year.
  // 2026 seats that did not poll return 'Postponed'.
  const partyFor = (s: SeatRow): string => {
    if (year === 2021) return s.winner_party_2021 || 'Other'
    const r = res26[s.seat_id]
    if (!r) return '—'
    return r.status === 'declared' ? (r.winner_party || 'Other') : 'Postponed'
  }
  const winnerFor = (s: SeatRow): string => {
    if (year === 2021) return s.winner_2021 || ''
    const r = res26[s.seat_id]
    return r?.status === 'declared' ? (r.winner_name || '') : 'Polling postponed'
  }

  // ── Roll seats up to districts ──────────────────────────────────────────
  const districtStats: Record<
    string,
    { seats: number; parties: Record<string, number>; topParty: string; rows: SeatRow[] }
  > = {}
  for (const d of DISTRICTS)
    districtStats[d] = { seats: 0, parties: {}, topParty: '—', rows: [] }

  for (const s of seats) {
    const d = SEAT_TO_DISTRICT[s.seat_id]
    if (!d || !districtStats[d]) continue
    districtStats[d].seats += 1
    districtStats[d].rows.push(s)
    const p = partyFor(s)
    if (p === 'Postponed' || p === '—') continue // no result: doesn't count toward a district lead
    districtStats[d].parties[p] = (districtStats[d].parties[p] || 0) + 1
  }
  for (const d of DISTRICTS) {
    const entries = Object.entries(districtStats[d].parties).sort((a, b) => b[1] - a[1])
    districtStats[d].topParty = entries[0]?.[0] ?? '—'
  }

  // Build the colour/label map the map component consumes
  const mapData: Record<string, DistrictDatum> = {}
  for (const d of DISTRICTS) {
    const ds = districtStats[d]
    const top = ds.topParty
    mapData[d] = {
      fill: top === '—' ? 'var(--bg3)' : partyColor(top),
      label: d,
      value: !ds.seats ? 'no data'
        : top === '—' ? 'postponed'
        : `${top} · ${ds.parties[top]}/${ds.seats}`,
    }
  }

  // ── Interaction handlers ────────────────────────────────────────────────
  function handleDistrictClick(district: string) {
    // Toggle: clicking same district deselects
    if (selectedDistrict === district && panelMode === 'district') {
      setSelectedDistrict(null)
      setPanelMode('idle')
    } else {
      setSelectedDistrict(district)
      setSelectedSeat(null)
      setPanelMode('district')
    }
  }

  function handleConstituencyClick(seatId: string) {
    // Toggle: clicking same seat deselects
    if (selectedSeat === seatId && panelMode === 'constituency') {
      setSelectedSeat(null)
      setPanelMode('idle')
    } else {
      setSelectedSeat(seatId)
      setSelectedDistrict(null)
      setPanelMode('constituency')
    }
  }

  // ── Summary stats ───────────────────────────────────────────────────────
  const partiesPresent = [
    ...new Set(DISTRICTS.map((d) => districtStats[d].topParty).filter((p) => p !== '—')),
  ]
  const totalSeats = seats.filter((s) => SEAT_TO_DISTRICT[s.seat_id]).length

  // ── District panel data ─────────────────────────────────────────────────
  const sel = selectedDistrict ? districtStats[selectedDistrict] : null

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 font-display">Constituency Map</h2>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Districts shaded by dominant {year} party. Click a{' '}
          <strong>district label box</strong> for its seat breakdown, or click a{' '}
          <strong>constituency</strong> for its results.
        </p>
        {/* Year toggle */}
        <div className="flex gap-2 mt-3">
          {([2026, 2021] as const).map((y) => (
            <button key={y} onClick={() => setYear(y)}
              className="px-3 py-1.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: year === y ? 'var(--accent)' : 'var(--bg3)',
                color: year === y ? '#fff' : 'var(--text2)',
                border: '1px solid var(--border)',
              }}>
              {y} {y === 2026 ? 'result' : 'baseline'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary stat cards ────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Districts" value={`${DISTRICTS.length}`} sub="In-region" />
        <StatCard label="Constituencies" value={totalSeats} sub="In-region (LA-1 – LA-33)" />
        <StatCard
          label="Parties leading districts"
          value={partiesPresent.length}
          sub={`Distinct ${year} winners`}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Map ──────────────────────────────────────────────────────── */}
        <div className="card lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-96"
                 style={{ color: 'var(--text3)' }}>
              Loading results…
            </div>
          ) : (
            <AJKConstituencyMap
              geo={geo}
              districtData={mapData}
              onSelectDistrict={handleDistrictClick}
              onSelectConstituency={handleConstituencyClick}
              selectedDistrict={selectedDistrict}
              selectedConstituency={selectedSeat}
            />
          )}

          {/* ── Legend ─────────────────────────────────────────────── */}
          <div
            className="flex flex-wrap gap-3 mt-4 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {partiesPresent.map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: partyColor(p) }}
                />
                <span className="text-xs" style={{ color: 'var(--text2)' }}>{p}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                className="inline-block w-3 h-1 rounded"
                style={{ backgroundColor: '#E4002B' }}
              />
              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                LA-N = constituency label
              </span>
            </div>
          </div>
        </div>

        {/* ── Right panel ──────────────────────────────────────────────── */}
        <div className="card overflow-y-auto" style={{ maxHeight: '82vh' }}>

          {/* IDLE STATE */}
          {panelMode === 'idle' && (
            <div
              className="flex flex-col items-center justify-center h-48 text-sm text-center gap-2"
              style={{ color: 'var(--text3)' }}
            >
              <span>Tap a district callout to see its seat breakdown.</span>
              <span>Tap a constituency polygon for 2021 candidate results.</span>
            </div>
          )}

          {/* DISTRICT MODE */}
          {panelMode === 'district' && sel && selectedDistrict && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-block w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: partyColor(districtStats[selectedDistrict].topParty) }}
                />
                <h3 className="text-lg font-bold">{selectedDistrict}</h3>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
                {sel.seats} {sel.seats === 1 ? 'seat' : 'seats'} · dominant {year} party:{' '}
                <span style={{ color: partyColor(sel.topParty), fontWeight: 700 }}>
                  {sel.topParty}
                </span>
              </p>

              <div className="space-y-2">
                {sel.rows
                  .sort(
                    (a, b) =>
                      parseInt(a.seat_id.split('-')[1]) - parseInt(b.seat_id.split('-')[1])
                  )
                  .map((r) => (
                    <button
                      key={r.seat_id}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left"
                      style={{ backgroundColor: 'var(--bg3)', cursor: 'pointer' }}
                      onClick={() => handleConstituencyClick(r.seat_id)}
                      title="Click to view 2021 candidates"
                    >
                      <div className="min-w-0">
                        <span className="text-xs" style={{ color: 'var(--text3)' }}>
                          {r.seat_id} ·{' '}
                        </span>
                        <span className="text-sm font-medium">{r.seat_name}</span>
                        {winnerFor(r) && (
                          <p className="text-xs" style={{ color: 'var(--text3)' }}>
                            {year}: {winnerFor(r)}
                          </p>
                        )}
                      </div>
                      <span
                        className="badge text-white ml-2 shrink-0"
                        style={{ backgroundColor: partyColor(partyFor(r)) }}
                      >
                        {partyFor(r)}
                      </span>
                    </button>
                  ))}
              </div>
            </>
          )}

          {/* CONSTITUENCY MODE — 2021 candidate results */}
          {panelMode === 'constituency' && selectedSeat && (
            <>
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-bold"
                        style={{ color: '#E4002B' }}>
                    {selectedSeat}
                  </span>
                  {seatMeta && (
                    <span
                      className="badge text-white text-xs"
                      style={{ backgroundColor: partyColor(partyFor(seatMeta)) }}
                    >
                      {partyFor(seatMeta)}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold leading-tight">
                  {seatMeta?.seat_name ?? selectedSeat}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                  2021 General Election · All candidates
                </p>
              </div>

              {/* 2026 result box */}
              {res26[selectedSeat] && (() => {
                const r = res26[selectedSeat]
                if (r.status === 'postponed') return (
                  <div className="rounded-lg p-3 mb-4 text-sm"
                       style={{ backgroundColor: 'var(--bg3)', color: 'var(--text2)' }}>
                    <strong>2026:</strong> polling postponed (security situation).
                  </div>
                )
                const rows = [
                  { tag: '✓ Winner', name: r.winner_name, party: r.winner_party, votes: r.winner_votes, pct: r.winner_pct },
                  { tag: 'Runner-up', name: r.runner_name, party: r.runner_party, votes: r.runner_votes, pct: r.runner_pct },
                ]
                return (
                  <div className="rounded-lg p-3 mb-5" style={{ border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--accent)' }}>
                      2026 General Election
                    </p>
                    {rows.map((x) => (
                      <div key={x.tag} className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <span className="text-xs" style={{ color: 'var(--text3)' }}>{x.tag} · </span>
                          <span className="text-sm font-semibold">{x.name}</span>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="badge text-white text-xs"
                                style={{ backgroundColor: partyColor(x.party || 'Other') }}>{x.party}</span>
                          <span className="font-mono text-xs font-bold">
                            {(x.votes ?? 0).toLocaleString()}{x.pct != null ? ` · ${x.pct}%` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs mt-2" style={{ color: 'var(--text3)' }}>
                      Margin {(r.margin ?? 0).toLocaleString()}
                      {r.turnout_pct != null && ` · Turnout ${r.turnout_pct}%`}
                      {r.data_note && ` · ${r.data_note}`}
                    </p>
                  </div>
                )
              })()}

              {/* Candidate list */}
              {candidatesLoading ? (
                <div className="flex items-center justify-center py-12"
                     style={{ color: 'var(--text3)' }}>
                  Loading candidates…
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-sm py-8 text-center" style={{ color: 'var(--text3)' }}>
                  No candidate data available for {selectedSeat}.
                </div>
              ) : (
                <>
                  {/* Vote bar chart header */}
                  <div className="text-xs font-semibold mb-2 flex justify-between"
                       style={{ color: 'var(--text3)' }}>
                    <span>Candidate</span>
                    <span>Votes</span>
                  </div>

                  {/* Compute max votes for bar scaling */}
                  {(() => {
                    const maxVotes = Math.max(...candidates.map((c) => c.votes_2021 || 0), 1)
                    return (
                      <div className="space-y-2">
                        {candidates.map((c, i) => {
                          const pct = ((c.votes_2021 || 0) / maxVotes) * 100
                          const isWinner = i === 0 || c.rank_2021 === 1
                          const color = partyColor(c.party_2021 || 'Other')
                          return (
                            <div key={c.id} className="rounded-lg overflow-hidden"
                                 style={{
                                   backgroundColor: 'var(--bg3)',
                                   border: isWinner
                                     ? `1.5px solid ${color}`
                                     : '1.5px solid transparent',
                                 }}>
                              <div className="px-2.5 pt-2 pb-1">
                                {/* Name + party badge */}
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {isWinner && (
                                        <span className="text-xs font-bold"
                                              style={{ color }}>
                                          ✓ Winner
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm font-semibold leading-tight">
                                      {c.candidate_name}
                                    </p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <span
                                      className="badge text-white text-xs"
                                      style={{ backgroundColor: color }}
                                    >
                                      {c.party_2021 || 'IND'}
                                    </span>
                                  </div>
                                </div>

                                {/* Vote count */}
                                <div className="flex items-center justify-between text-xs mb-1"
                                     style={{ color: 'var(--text3)' }}>
                                  <span>#{c.rank_2021 ?? i + 1}</span>
                                  <span className="font-mono font-bold"
                                        style={{ color: 'var(--text)' }}>
                                    {(c.votes_2021 || 0).toLocaleString()}
                                  </span>
                                </div>

                                {/* Vote bar */}
                                <div className="h-1.5 rounded-full overflow-hidden"
                                     style={{ backgroundColor: 'var(--border)' }}>
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: color,
                                      opacity: isWinner ? 1 : 0.6,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* Back to district link */}
                  {SEAT_TO_DISTRICT[selectedSeat] && (
                    <button
                      className="mt-4 text-xs underline"
                      style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => handleDistrictClick(SEAT_TO_DISTRICT[selectedSeat])}
                    >
                      ← Back to {SEAT_TO_DISTRICT[selectedSeat]} district
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
