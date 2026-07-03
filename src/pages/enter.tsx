import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase, Candidate } from '@/lib/supabase'
import { fmt2021 } from '@/lib/utils'
import { syncFromSheet, SyncResult } from '@/lib/sheetSync'

const ENTRY_PASSWORD = process.env.NEXT_PUBLIC_ENTRY_PASSWORD || 'ajk2026'

// Published Google Sheet CSV URL — see lib/sheetSync.ts for the full
// publish/format contract (seat_id, candidate_name, votes_2026 columns).
// Override via NEXT_PUBLIC_RESULTS_SHEET_CSV_URL in .env.local / Vercel env
// vars if the sheet is ever recreated and gets a new URL.
const RESULTS_SHEET_CSV_URL =
  process.env.NEXT_PUBLIC_RESULTS_SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRE3KCdMVObOw8ty3BjIfeE8N6FcIs0MkBro6GBcUycGArczznrMAtWzN5K3vYaOaSUt2XQ46TcW-Nn/pub?output=csv'

export default function DataEntry() {
  const [authed, setAuthed]       = useState(false)
  const [pw, setPw]               = useState('')
  const [pwError, setPwError]     = useState('')
  const [seats, setSeats]         = useState<{ seat_id: string; seat_name: string }[]>([])
  const [selectedSeat, setSelectedSeat] = useState('')
  const [candidates, setCandidates]     = useState<Candidate[]>([])
  const [votes, setVotes]               = useState<Record<number, string>>({})
  const [saving, setSaving]             = useState(false)
  const [savedMsg, setSavedMsg]         = useState('')

  // ── Sheet sync state ──────────────────────────────────────────────────────
  const [syncing, setSyncing]         = useState(false)
  const [syncResult, setSyncResult]   = useState<SyncResult | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  // Load seat list
  useEffect(() => {
    supabase
      .from('constituencies')
      .select('seat_id, seat_name')
      .order('seat_id')
      .then(({ data }) => setSeats(data || []))
  }, [])

  // Load candidates when seat changes
  useEffect(() => {
    if (!selectedSeat) { setCandidates([]); setVotes({}); return }
    supabase
      .from('candidates')
      .select('*')
      .eq('seat_id', selectedSeat)
      .order('rank_2021')
      .then(({ data }) => {
        setCandidates(data || [])
        const v: Record<number, string> = {}
        for (const c of data || []) {
          v[c.id] = c.votes_2026 > 0 ? String(c.votes_2026) : ''
        }
        setVotes(v)
      })
  }, [selectedSeat])

  function handleLogin() {
    if (pw === ENTRY_PASSWORD) {
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('Incorrect password')
    }
  }

  async function handleSave() {
    setSaving(true)
    setSavedMsg('')

    const updates = candidates
      .filter((c) => votes[c.id] !== '' && votes[c.id] !== undefined)
      .map((c) => ({
        id: c.id,
        votes_2026: parseInt(votes[c.id] || '0', 10),
        updated_at: new Date().toISOString(),
      }))

    for (const u of updates) {
      await supabase.from('candidates').update({
        votes_2026: u.votes_2026,
        updated_at: u.updated_at,
      }).eq('id', u.id)
    }

    setSaving(false)
    setSavedMsg(`Saved ${updates.length} candidate votes for ${selectedSeat}`)
    setTimeout(() => setSavedMsg(''), 4000)
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const result = await syncFromSheet(RESULTS_SHEET_CSV_URL)
    setSyncResult(result)
    setSyncing(false)
    if (!result.error) {
      setLastSyncedAt(new Date())
      // Refresh the currently-open seat's vote inputs so the manual-entry
      // form below reflects whatever the sync just wrote, in case the same
      // seat is open for a spot-check.
      if (selectedSeat) {
        const { data } = await supabase
          .from('candidates').select('*').eq('seat_id', selectedSeat).order('rank_2021')
        if (data) {
          setCandidates(data)
          const v: Record<number, string> = {}
          for (const c of data) v[c.id] = c.votes_2026 > 0 ? String(c.votes_2026) : ''
          setVotes(v)
        }
      }
    }
  }

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto mt-24">
          <div className="card">
            <h2 className="text-lg font-bold mb-4 text-center font-display">Data Entry Login</h2>
            <p className="text-sm text-gray-400 mb-4 text-center">
              For authorised data-entry team only
            </p>
            <input
              type="password"
              placeholder="Enter password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white mb-3"
            />
            {pwError && <p className="text-red-400 text-sm mb-2">{pwError}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // ── Entry screen ────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-display">Enter Live Results</h2>
          <button
            onClick={() => setAuthed(false)}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Logout
          </button>
        </div>

        {/* ── Sheet sync — primary election-night workflow ─────────────────── */}
        <div className="card mb-4" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Sync from Google Sheet
            </h3>
            {lastSyncedAt && (
              <span className="text-xs text-gray-500">
                Last synced {lastSyncedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Pulls the published sheet's <code className="text-gray-400">votes_2026</code> column
            and updates every matched candidate. Blank cells are left untouched —
            type <code className="text-gray-400">0</code> explicitly to reset a result.
          </p>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50
                       text-white rounded-lg py-2.5 font-semibold transition-colors"
          >
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>

          {syncResult && (
            <div className="mt-4 text-sm space-y-2">
              {syncResult.error ? (
                <p className="text-red-400 font-medium">⚠ {syncResult.error}</p>
              ) : (
                <>
                  <p className="text-green-400 font-medium">
                    ✓ Updated {syncResult.matched} candidate{syncResult.matched === 1 ? '' : 's'}
                    {' '}from {syncResult.totalRows} sheet rows
                  </p>
                  {syncResult.skippedBlank > 0 && (
                    <p className="text-gray-500 text-xs">
                      {syncResult.skippedBlank} row{syncResult.skippedBlank === 1 ? '' : 's'} skipped
                      (blank votes_2026 — not yet reported)
                    </p>
                  )}
                  {syncResult.unmatched.length > 0 && (
                    <div className="text-amber-400 text-xs">
                      <p className="font-medium mb-1">
                        ⚠ {syncResult.unmatched.length} row{syncResult.unmatched.length === 1 ? '' : 's'}
                        {' '}didn't match any candidate — check spelling/seat_id:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                        {syncResult.unmatched.slice(0, 10).map((r, i) => (
                          <li key={i}>{r.seat_id} — {r.candidate_name}</li>
                        ))}
                        {syncResult.unmatched.length > 10 && (
                          <li>…and {syncResult.unmatched.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="card mb-4">
          <label className="block text-sm text-gray-400 mb-1">Select Constituency</label>
          <select
            value={selectedSeat}
            onChange={(e) => setSelectedSeat(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="">-- Select --</option>
            {seats.map((s) => (
              <option key={s.seat_id} value={s.seat_id}>
                {s.seat_id} — {s.seat_name}
              </option>
            ))}
          </select>
        </div>

        {candidates.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wide">
              Manual entry — {selectedSeat}
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Use this for one-off corrections. For full election-night entry, use Sync above.
            </p>

            <div className="space-y-3">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.candidate_name}</p>
                    <p className="text-xs text-gray-500">
                      {c.party_2026} · 2021: {fmt2021(c.votes_2021)}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Votes"
                    value={votes[c.id] ?? ''}
                    onChange={(e) =>
                      setVotes((v) => ({ ...v, [c.id]: e.target.value }))
                    }
                    className="w-28 bg-gray-800 border border-gray-700 rounded px-3 py-1.5
                               text-white text-right focus:border-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50
                           text-white rounded-lg py-2.5 font-semibold transition-colors"
              >
                {saving ? 'Saving...' : 'Save Results'}
              </button>
              <button
                onClick={() => setVotes({})}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                Clear
              </button>
            </div>

            {savedMsg && (
              <p className="mt-3 text-green-400 text-sm font-medium">{savedMsg}</p>
            )}

            <p className="mt-3 text-xs text-gray-600">
              Results are saved instantly and appear on the live dashboard in real-time.
              No page refresh needed by viewers.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
