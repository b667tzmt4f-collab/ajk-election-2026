import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase, partyColor } from '@/lib/supabase'
import { SEAT_NAMES } from '@/lib/seatNames'
import { numSort } from '@/lib/utils'
import DevNote from '@/components/DevNote'

type C = {
  id: number
  seat_id: string
  candidate_name: string
  party_2026: string
  party_2021: string
  rank_2021: number
}

export default function Candidates() {
  const [candidates, setCandidates] = useState<C[]>([])
  const [loading, setLoading]       = useState(true)
  const [dbError, setDbError]       = useState('')
  const [search, setSearch]         = useState('')
  const [seatF, setSeatF]           = useState('')

  useEffect(() => {
    supabase
      .from('candidates')
      .select('id, seat_id, candidate_name, party_2026, party_2021, rank_2021')
      .then(({ data, error }) => {
        if (error) { setDbError(error.message); setLoading(false); return }
        const sorted = (data || []).sort((a, b) => {
          const n = numSort(a.seat_id, b.seat_id)
          return n !== 0 ? n : a.rank_2021 - b.rank_2021
        })
        setCandidates(sorted)
        setLoading(false)
      })
  }, [])

  const seats = [...new Set(candidates.map(c => c.seat_id))].sort(numSort)

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    return (
      (!search || c.candidate_name.toLowerCase().includes(q)
               || c.party_2026.toLowerCase().includes(q)
               || c.seat_id.toLowerCase().includes(q)
               || (SEAT_NAMES[c.seat_id]||'').toLowerCase().includes(q)) &&
      (!seatF || c.seat_id === seatF)
    )
  })

  const grouped: Record<string, C[]> = {}
  for (const c of filtered) {
    if (!grouped[c.seat_id]) grouped[c.seat_id] = []
    grouped[c.seat_id].push(c)
  }
  const groupedSeats = Object.keys(grouped).sort(numSort)

  return (
    <Layout>
      {/* Loading state — min height prevents layout jump */}
      {loading && !dbError && (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--text3)' }}>
          Loading candidates...
        </div>
      )}

      {/* Error state */}
      {dbError && (
        <div className="card mb-4" style={{ borderLeft: '4px solid #dc2626' }}>
          <p className="font-semibold text-sm mb-1" style={{ color: '#dc2626' }}>
            Database error: {dbError}
          </p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            Run <code style={{ backgroundColor: 'var(--bg3)', padding: '0 4px', borderRadius: 3 }}>
            002_seed.sql</code> in Supabase SQL Editor to load candidates.
          </p>
        </div>
      )}

      {/* Main content */}
      {!loading && !dbError && (
        <>
          <DevNote type="action" label="Candidate list incomplete — 30 days to polling">
          PTI candidates are currently listed as IND (ex-PTI) pending the EC final notified list.
          This disclaimer undermines the page's credibility. The 2026 final candidate list must
          be updated the moment EC publishes it — this is the most time-sensitive data on the site.
        </DevNote>
        <DevNote type="missing" label="No historical context per candidate">
          The candidate list shows 2026 data only. There is no link from a candidate row
          to their 2021 performance in the constituency results. Cross-referencing would
          significantly increase the analytical value of this page.
        </DevNote>
        <DevNote type="missing" label="No last-updated timestamp">
          The page has no "Last updated: [date]" indicator. Visitors — especially press —
          need to know how current the data is.
        </DevNote>
        <h2 className="text-2xl font-bold mb-1 font-display">2026 Candidate List</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
            Based on 2021 EC data · PTI shown as IND (ex-PTI) ·
            Will be updated when EC publishes 2026 final list
          </p>

          {candidates.length === 0 ? (
            <div className="card text-center py-12">
              <p className="font-bold text-lg mb-3">No candidates in database yet</p>
              <div className="text-sm text-left max-w-sm mx-auto space-y-2"
                   style={{ color: 'var(--text2)' }}>
                <p>1. Go to <strong>supabase.com</strong> → your project</p>
                <p>2. Click <strong>SQL Editor → New query</strong></p>
                <p>3. Paste contents of <strong>002_seed.sql</strong> → click <strong>Run</strong></p>
                <p>4. Refresh this page</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search constituency or candidate..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 min-w-52"
                />
                <select value={seatF} onChange={e => setSeatF(e.target.value)}>
                  <option value="">All constituencies</option>
                  {seats.map(s => (
                    <option key={s} value={s}>{s} — {SEAT_NAMES[s] || ''}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
                {filtered.length} candidates across {groupedSeats.length} constituencies
              </p>

              <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--accent)' }}>
                      <th className="text-left py-3 px-4 text-white font-semibold text-xs uppercase w-40">
                        Constituency
                      </th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-xs uppercase">
                        Candidate Name
                      </th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-xs uppercase w-36">
                        Party (2026)
                      </th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-xs uppercase w-36">
                        Party (2021)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSeats.map((sid, gi) => (
                      <>
                        <tr key={`hdr-${sid}`}
                            style={{ backgroundColor: 'var(--bg3)',
                                     borderTop: gi > 0 ? '2px solid var(--border)' : undefined }}>
                          <td colSpan={4} className="py-2 px-4 text-xs font-bold uppercase"
                              style={{ color: 'var(--accent)', letterSpacing: '0.05em' }}>
                            {sid} — {SEAT_NAMES[sid] || sid}
                          </td>
                        </tr>
                        {grouped[sid].map((c, ci) => (
                          <tr key={c.id}
                              style={{ backgroundColor: ci % 2 === 0 ? 'var(--card-bg)' : 'var(--bg3)',
                                       borderBottom: '1px solid var(--border)' }}>
                            <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--text3)' }}>
                            </td>
                            <td className="py-2.5 px-4 font-medium">{c.candidate_name}</td>
                            <td className="py-2.5 px-4">
                              <span className="badge text-white"
                                    style={{ backgroundColor: partyColor(c.party_2026) }}>
                                {c.party_2026}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-xs" style={{ color: 'var(--text2)' }}>
                              {c.party_2021}
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  )
}