import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase, Candidate, partyColor } from '@/lib/supabase'

const numSort = (a: string, b: string) =>
  parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])

export default function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading]       = useState(true)
  const [dbError, setDbError]       = useState('')
  const [search, setSearch]         = useState('')
  const [seatF, setSeatF]           = useState('')
  const [partyF, setPartyF]         = useState('')

  useEffect(() => {
    supabase.from('candidates').select('*')
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

  const seats   = [...new Set(candidates.map(c => c.seat_id))].sort(numSort)
  const parties = [...new Set(candidates.map(c => c.party_2026))].sort()

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    return (
      (!search  || c.candidate_name.toLowerCase().includes(q)
                || c.party_2026.toLowerCase().includes(q)) &&
      (!seatF   || c.seat_id    === seatF) &&
      (!partyF  || c.party_2026 === partyF)
    )
  })

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1">👤 2026 Candidate List</h2>
      <p className="text-sm mb-4" style={{ color:'var(--text2)' }}>
        Based on 2021 EC data · PTI shown as IND (ex-PTI) ·
        Will be updated when EC publishes 2026 final list
      </p>

      {/* Error */}
      {dbError && (
        <div className="card mb-4" style={{ borderLeft:'4px solid #dc2626' }}>
          <p className="font-semibold text-sm mb-1" style={{ color:'#dc2626' }}>
            ⚠️ Database error: {dbError}
          </p>
          <p className="text-sm" style={{ color:'var(--text2)' }}>
            Run <code className="px-1 rounded text-xs"
                      style={{ backgroundColor:'var(--bg3)' }}>002_seed.sql</code> in
            the Supabase SQL Editor to load candidates.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && !dbError && (
        <div className="card text-center py-12" style={{ color:'var(--text2)' }}>
          Loading candidates...
        </div>
      )}

      {/* Seed not run */}
      {!loading && !dbError && candidates.length === 0 && (
        <div className="card text-center py-12">
          <p className="font-bold text-lg mb-3">No candidates in database yet</p>
          <div className="text-sm text-left max-w-sm mx-auto space-y-2"
               style={{ color:'var(--text2)' }}>
            <p><strong>To load the 524 candidates:</strong></p>
            <p>1. Go to <strong>supabase.com</strong> → your project</p>
            <p>2. Click <strong>SQL Editor</strong> → <strong>New query</strong></p>
            <p>3. Open <strong>002_seed.sql</strong> from your project folder</p>
            <p>4. Select all → paste into the editor → click <strong>Run</strong></p>
            <p>5. Refresh this page</p>
          </div>
        </div>
      )}

      {/* Table */}
      {candidates.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3 mb-3">
            <input
              type="text"
              placeholder="Search name or party..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-48"
            />
            <select value={seatF} onChange={e => setSeatF(e.target.value)}>
              <option value="">All seats</option>
              {seats.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={partyF} onChange={e => setPartyF(e.target.value)}>
              <option value="">All parties</option>
              {parties.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <p className="text-xs mb-3" style={{ color:'var(--text3)' }}>
            {filtered.length} of {candidates.length} candidates
          </p>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom:'2px solid var(--border)' }}>
                  {['Seat','Candidate','Party 2026','Party 2021','Votes 2021','Rank'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-xs uppercase font-semibold"
                        style={{ color:'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom:'1px solid var(--border)' }}
                      className="hover:opacity-75 transition-opacity">
                    <td className="py-2 px-2 text-xs font-mono font-semibold"
                        style={{ color:'var(--accent)' }}>{c.seat_id}</td>
                    <td className="py-2 px-2 font-medium">{c.candidate_name}</td>
                    <td className="py-2 px-2">
                      <span className="badge text-white"
                            style={{ backgroundColor:`#${partyColor(c.party_2026)}` }}>
                        {c.party_2026}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-xs" style={{ color:'var(--text2)' }}>
                      {c.party_2021}
                    </td>
                    <td className="py-2 px-2 text-right">{c.votes_2021.toLocaleString()}</td>
                    <td className="py-2 px-2 text-center text-xs" style={{ color:'var(--text3)' }}>
                      #{c.rank_2021}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  )
}
