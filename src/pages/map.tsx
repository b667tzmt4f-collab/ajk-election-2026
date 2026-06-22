import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import AJKMap, { DistrictDatum } from '@/components/AJKMap'
import { supabase, partyColor } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Map view (v1 — district level).
//
// AJK has 10 in-region districts. Election data lives at constituency (seat)
// level, so we roll seats up to districts using SEAT_TO_DISTRICT below, then
// colour each district by its dominant 2021 winning party.
//
// The mapping is derived from the official constituency names (e.g. "LA-1 Mirpur
// I" → Mirpur). It is hard-coded rather than inferred so the rollup stays
// auditable and stable. Constituency-level boundaries are a planned v2.
// ─────────────────────────────────────────────────────────────────────────────

const SEAT_TO_DISTRICT: Record<string, string> = {
  // Mirpur — LA-1 to LA-4
  'LA-1': 'Mirpur',  'LA-2': 'Mirpur',  'LA-3': 'Mirpur',  'LA-4': 'Mirpur',
  // Bhimber — LA-5 to LA-7
  'LA-5': 'Bhimber', 'LA-6': 'Bhimber', 'LA-7': 'Bhimber',
  // Kotli — LA-8 to LA-13
  'LA-8': 'Kotli',   'LA-9': 'Kotli',   'LA-10': 'Kotli',
  'LA-11': 'Kotli',  'LA-12': 'Kotli',  'LA-13': 'Kotli',
  // Bagh — LA-14 to LA-16
  'LA-14': 'Bagh',   'LA-15': 'Bagh',   'LA-16': 'Bagh',
  // Haveli — LA-17
  'LA-17': 'Haveli',
  // Poonch — LA-18 to LA-22
  'LA-18': 'Poonch', 'LA-19': 'Poonch', 'LA-20': 'Poonch',
  'LA-21': 'Poonch', 'LA-22': 'Poonch',
  // Sudhnoti — LA-23 to LA-24
  'LA-23': 'Sudhnoti', 'LA-24': 'Sudhnoti',
  // Neelum — LA-25 to LA-26
  'LA-25': 'Neelum',   'LA-26': 'Neelum',
  // Muzaffarabad — LA-27, LA-28, LA-29, LA-31
  'LA-27': 'Muzaffarabad', 'LA-28': 'Muzaffarabad',
  'LA-29': 'Muzaffarabad', 'LA-31': 'Muzaffarabad',
  // Jhelum Valley — LA-30, LA-32, LA-33
  'LA-30': 'Jhelum Valley', 'LA-32': 'Jhelum Valley', 'LA-33': 'Jhelum Valley',
}

const DISTRICTS = [
  'Muzaffarabad', 'Neelum', 'Jhelum Valley', 'Bagh', 'Haveli',
  'Poonch', 'Sudhnoti', 'Kotli', 'Mirpur', 'Bhimber',
]

type SeatRow = {
  seat_id: string
  seat_name: string
  winner_party_2021: string
  winner_2021: string
}

export default function MapView() {
  const [geo, setGeo] = useState<any>(null)
  const [seats, setSeats] = useState<SeatRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // load boundary file from /public
  useEffect(() => {
    fetch('/ajk_districts.geojson')
      .then((r) => r.json())
      .then(setGeo)
      .catch(() => setGeo(null))
  }, [])

  // load 2021 winners
  useEffect(() => {
    supabase
      .from('constituencies')
      .select('seat_id, seat_name, winner_party_2021, winner_2021')
      .then(({ data }) => {
        setSeats(data || [])
        setLoading(false)
      })
  }, [])

  // roll seats up to districts: count winning party per district
  const districtStats: Record<
    string,
    { seats: number; parties: Record<string, number>; topParty: string; rows: SeatRow[] }
  > = {}
  for (const d of DISTRICTS)
    districtStats[d] = { seats: 0, parties: {}, topParty: '—', rows: [] }

  for (const s of seats) {
    const d = SEAT_TO_DISTRICT[s.seat_id]
    if (!d || !districtStats[d]) continue
    const ds = districtStats[d]
    ds.seats += 1
    ds.rows.push(s)
    const p = s.winner_party_2021 || 'Other'
    ds.parties[p] = (ds.parties[p] || 0) + 1
  }
  for (const d of DISTRICTS) {
    const entries = Object.entries(districtStats[d].parties).sort((a, b) => b[1] - a[1])
    districtStats[d].topParty = entries[0]?.[0] ?? '—'
  }

  // build the colour map the SVG consumes
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

  // most/least seats for badges
  const ranked = [...DISTRICTS].sort((a, b) => districtStats[b].seats - districtStats[a].seats)
  const highlight = [
    { district: ranked[0], tag: '▲ MOST SEATS', color: '#fde68a' },
    { district: ranked[ranked.length - 1], tag: '▼ FEWEST', color: '#fde68a' },
  ]

  // legend: unique parties present
  const partiesPresent = [...new Set(DISTRICTS.map((d) => districtStats[d].topParty).filter((p) => p !== '—'))]

  const totalSeats = seats.filter((s) => SEAT_TO_DISTRICT[s.seat_id]).length
  const sel = selected ? districtStats[selected] : null

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 font-display">Constituency Map</h2>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          AJK districts shaded by the dominant party in the 2021 general election.
          Tap a district for its seat breakdown. Constituency-level boundaries coming in a future update.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Districts mapped" value={`${DISTRICTS.length}`} sub="In-region" />
        <StatCard label="Seats rolled up" value={totalSeats} sub="In-region constituencies" />
        <StatCard
          label="Parties leading districts"
          value={partiesPresent.length}
          sub="Distinct 2021 winners"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="card lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center h-96" style={{ color: 'var(--text3)' }}>
              Loading results…
            </div>
          ) : (
            <AJKMap
              geo={geo}
              data={mapData}
              highlight={highlight}
              onSelect={(d) => setSelected(selected === d ? null : d)}
            />
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4"
               style={{ borderTop: '1px solid var(--border)' }}>
            {partiesPresent.map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: partyColor(p) }} />
                <span className="text-xs" style={{ color: 'var(--text2)' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="card">
          {sel && selected ? (
            <>
              <h3 className="text-lg font-bold mb-1">{selected}</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
                {sel.seats} {sel.seats === 1 ? 'seat' : 'seats'} · dominant 2021 party:{' '}
                <span style={{ color: partyColor(sel.topParty), fontWeight: 700 }}>
                  {sel.topParty}
                </span>
              </p>

              <div className="space-y-2">
                {sel.rows
                  .sort((a, b) => parseInt(a.seat_id.split('-')[1]) - parseInt(b.seat_id.split('-')[1]))
                  .map((r) => (
                    <div key={r.seat_id}
                         className="flex items-center justify-between p-2 rounded-lg"
                         style={{ backgroundColor: 'var(--bg3)' }}>
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
                      <span className="badge text-white ml-2 shrink-0"
                            style={{ backgroundColor: partyColor(r.winner_party_2021) }}>
                        {r.winner_party_2021}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-center"
                 style={{ color: 'var(--text3)' }}>
              Tap a district on the map to see its constituencies and 2021 winners.
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
