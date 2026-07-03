import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import AJKConstituencyMap, { DistrictDatum } from '@/components/AJKConstituencyMap'
import { supabase, partyColor, Candidate } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Map page (v2 — dual-layer: district colour + constituency boundaries)
//
// District layer: shaded by dominant 2021 winning party.
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
    supabase
      .from('constituencies')
      .select('seat_id, seat_name, winner_party_2021, winner_2021')
      .then(({ data }) => {
        setSeats(data || [])
        setLoading(false)
      })
  }, [])

  // ── Fetch 2021 candidates when a constituency is selected ───────────────
  useEffect(() => {
    if (!selectedSeat) return
    setCandidatesLoading(true)
    setCandidates([])

    // Fetch all candidates for this seat, ranked by 2021 votes descending
    supabase
      .from('candidates')
      .select('id, seat_id, candidate_name, party_2021, votes_2021, rank_2021')
      .eq('seat_id', selectedSeat)
      .order('rank_2021', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Candidate fetch error:', error)
        setCandidates((data as Candidate[]) || [])
        setCandidatesLoading(false)
      })

    // Also grab seat meta (name, winner) for the panel header
    const meta = seats.find((s) => s.seat_id === selectedSeat) ?? null
    setSeatMeta(meta)
  }, [selectedSeat, seats])

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
    const p = s.winner_party_2021 || 'Other'
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
      value: ds.seats ? `${top} · ${ds.parties[top]}/${ds.seats}` : 'no data',
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
          Districts shaded by dominant 2021 party. Click a{' '}
          <strong>district label box</strong> for its seat breakdown, or click a{' '}
          <strong>constituency</strong> for 2021 candidate results.
        </p>
      </div>

      {/* ── Summary stat cards ────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Districts" value={`${DISTRICTS.length}`} sub="In-region" />
        <StatCard label="Constituencies" value={totalSeats} sub="In-region (LA-1 – LA-33)" />
        <StatCard
          label="Parties leading districts"
          value={partiesPresent.length}
          sub="Distinct 2021 winners"
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
                {sel.seats} {sel.seats === 1 ? 'seat' : 'seats'} · dominant 2021 party:{' '}
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
                        {r.winner_2021 && (
                          <p className="text-xs" style={{ color: 'var(--text3)' }}>
                            2021: {r.winner_2021}
                          </p>
                        )}
                      </div>
                      <span
                        className="badge text-white ml-2 shrink-0"
                        style={{ backgroundColor: partyColor(r.winner_party_2021) }}
                      >
                        {r.winner_party_2021}
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
                  {seatMeta?.winner_party_2021 && (
                    <span
                      className="badge text-white text-xs"
                      style={{ backgroundColor: partyColor(seatMeta.winner_party_2021) }}
                    >
                      {seatMeta.winner_party_2021}
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
