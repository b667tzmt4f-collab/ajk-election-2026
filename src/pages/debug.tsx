import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function Debug() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  // Only accessible with ?key=ajk-debug-2026 in the URL
  useEffect(() => {
    if (router.query.key === 'ajk-debug-2026') {
      setAllowed(true)
    } else {
      router.replace('/')
    }
  }, [router.query.key])

  useEffect(() => {
    if (!allowed) return
    async function run() {
      const out: Record<string, any> = {}
      out.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING'
      out.anonKeyFirst20 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20) + '...'
        : '❌ MISSING'
      const { data: seats, error: seatsErr } = await supabase
        .from('constituencies').select('seat_id, seat_name').limit(3)
      out.constituencies = seats ? `✅ ${seats.length} rows` : `❌ ${seatsErr?.message}`
      const { data: cands, error: candsErr } = await supabase
        .from('candidates').select('id, candidate_name').limit(3)
      out.candidates = cands ? `✅ ${cands.length} rows` : `❌ ${candsErr?.message}`
      const { count: seatCount } = await supabase
        .from('constituencies').select('*', { count: 'exact', head: true })
      out.total_constituencies = seatCount ?? '❌ failed'
      const { count: candCount } = await supabase
        .from('candidates').select('*', { count: 'exact', head: true })
      out.total_candidates = candCount ?? '❌ failed'
      setResults(out)
      setLoading(false)
    }
    run()
  }, [allowed])

  if (!allowed) return null

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, background: '#111', minHeight: '100vh', color: '#eee' }}>
      <h1 style={{ color: '#60a5fa', marginBottom: 24 }}>🔍 Supabase Debug</h1>
      {loading ? <p>Running checks...</p> : (
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
    </div>
  )
}
