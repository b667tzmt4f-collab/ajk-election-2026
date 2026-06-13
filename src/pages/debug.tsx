import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Debug() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      const out: Record<string, any> = {}

      // 1. Check env vars
      out.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING'
      out.anonKeyFirst20 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20) + '...'
        : '❌ MISSING'

      // 2. Try fetching constituencies
      const { data: seats, error: seatsErr } = await supabase
        .from('constituencies')
        .select('seat_id, seat_name')
        .limit(3)
      out.constituencies = seats ? `✅ ${seats.length} rows returned` : `❌ ${seatsErr?.message}`
      out.constituencies_sample = seats?.map(s => s.seat_id).join(', ') || 'none'

      // 3. Try fetching candidates
      const { data: cands, error: candsErr } = await supabase
        .from('candidates')
        .select('id, candidate_name, party_2026')
        .limit(3)
      out.candidates = cands ? `✅ ${cands.length} rows returned` : `❌ ${candsErr?.message}`
      out.candidates_sample = cands?.map(c => c.candidate_name).join(', ') || 'none'

      // 4. Count totals
      const { count: seatCount } = await supabase
        .from('constituencies')
        .select('*', { count: 'exact', head: true })
      out.total_constituencies = seatCount ?? '❌ count failed'

      const { count: candCount } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
      out.total_candidates = candCount ?? '❌ count failed'

      setResults(out)
      setLoading(false)
    }
    run()
  }, [])

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, background: '#111', minHeight: '100vh', color: '#eee' }}>
      <h1 style={{ color: '#60a5fa', marginBottom: 24 }}>🔍 Supabase Connection Debug</h1>
      {loading ? (
        <p>Running checks...</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {Object.entries(results).map(([key, val]) => (
              <tr key={key} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '10px 16px', color: '#94a3b8', width: 280 }}>{key}</td>
                <td style={{ padding: '10px 16px', color: String(val).startsWith('❌') ? '#f87171' : '#4ade80' }}>
                  {String(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 32, padding: 16, background: '#1e293b', borderRadius: 8 }}>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          If constituencies or candidates show ❌: run the SQL migrations in Supabase SQL Editor.<br/>
          If supabaseUrl shows ❌: your .env.local is missing or wrong.<br/>
          If you see 0 rows but no error: the seed SQL (002_seed.sql) did not run yet.
        </p>
      </div>
    </div>
  )
}
