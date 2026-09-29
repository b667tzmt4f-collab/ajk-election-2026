import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchTable, TableName } from '@/lib/api'

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
      out.database = 'Neon (via /api/table)'
      // Row count per table; ✅ if it loads, ❌ with the reason if not.
      const tables: TableName[] = [
        'constituencies', 'candidates', 'elections_history', 'seat_scores', 'candidate_results',
      ]
      for (const t of tables) {
        try {
          const rows = await fetchTable(t, { fresh: true })
          out[t] = `✅ ${rows.length} rows`
        } catch (err: any) {
          out[t] = `❌ ${err.message}`
        }
      }
      setResults(out)
      setLoading(false)
    }
    run()
  }, [allowed])

  if (!allowed) return null

  return (
    <div style={{ fontFamily: 'monospace', padding: 32, background: '#111', minHeight: '100vh', color: '#eee' }}>
      <h1 style={{ color: '#60a5fa', marginBottom: 24 }}>🔍 Database Debug</h1>
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
