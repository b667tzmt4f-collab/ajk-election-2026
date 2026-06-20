import { useState } from 'react'
import Layout from '@/components/Layout'
import StatCard from '@/components/StatCard'
import PartyTallyBar from '@/components/PartyTallyBar'
import { useLiveResults } from '@/hooks/useLiveResults'
import { partyColor } from '@/lib/supabase'

export default function LiveResults() {
  const {
    seatResults,
    seatsDecided,
    seatsPending,
    partyTally,
    loading,
    lastUpdated,
  } = useLiveResults()

  const [filter, setFilter] = useState<'All' | 'In-Region' | 'Refugee'>('All')
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)

  const filtered = seatResults
    .filter((s) => filter === 'All' || s.region === filter)
    .sort((a, b) => parseInt(a.seat_id.split('-')[1]) - parseInt(b.seat_id.split('-')[1]))

  const selectedData = seatResults.find((s) => s.seat_id === selectedSeat)

  const topParty = Object.entries(partyTally).sort((a, b) => b[1] - a[1])[0]

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">📡 Live Election Results</h2>
          <p className="text-sm mt-0.5" style={{color:"var(--text2)"}}>
            {lastUpdated
              ? `Last updated: ${lastUpdated.toLocaleTimeString()} · updates instantly`
              : 'Connecting to live feed...'}
          </p>
        </div>
        <div className="flex gap-2">
          {(['All', 'In-Region', 'Refugee'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === f
                  ? '' : ''
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20" style={{color:"var(--text2)"}}>
          <p className="text-lg mb-2">Loading results...</p>
          <p className="text-sm" style={{color:"var(--text3)"}}>Connecting to Supabase</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Seats declared"
              value={`${seatsDecided.length} / 45`}
              sub="Results reported"
            />
            <StatCard
              label="Seats pending"
              value={seatsPending.length}
              sub="Awaiting results"
            />
            <StatCard label="Majority needed" value="23" sub="of 45 seats" />
            {topParty ? (
              <StatCard
                label="Currently leading"
                value={`${topParty[0]} (${topParty[1]})`}
                color={partyColor(topParty[0])}
              />
            ) : (
              <StatCard label="Currently leading" value="—" sub="No results yet" />
            )}
          </div>

          {/* Party tally */}
          {Object.keys(partyTally).length > 0 && (
            <div className="card mb-6">
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'var(--text2)' }}>
                Seat Tally
              </h3>
              <PartyTallyBar tally={partyTally} />
            </div>
          )}

          {Object.keys(partyTally).length === 0 && (
            <div className="card mb-6 text-center py-8" style={{ color: 'var(--text3)' }}>
              <p className="text-lg mb-1">⏳ Awaiting first results</p>
              <p className="text-sm">
                Seat tally will appear here as results are entered.
                Go to{' '}
                <a href="/enter" className="underline" style={{ color: 'var(--accent)' }}>
                  Data Entry
                </a>{' '}
                to enter results.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Seat list */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide" style={{ color: 'var(--text2)' }}>
                Constituencies ({filtered.length})
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map((seat) => {
                  const isSelected = selectedSeat === seat.seat_id
                  return (
                    <button
                      key={seat.seat_id}
                      onClick={() =>
                        setSelectedSeat(
                          selectedSeat === seat.seat_id ? null : seat.seat_id
                        )
                      }
                      className="w-full text-left p-3 rounded-lg border transition-colors"
                      style={{
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                        backgroundColor: isSelected ? 'var(--bg3)' : 'var(--card-bg)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs" style={{ color: 'var(--text3)' }}>
                            {seat.seat_id} ·{' '}
                          </span>
                          <span className="text-sm font-medium">{seat.seat_name}</span>
                        </div>
                        {seat.has_results && seat.winner ? (
                          <span
                            className="badge text-white px-2 py-0.5 text-xs rounded font-semibold"
                            style={{ backgroundColor: partyColor(seat.winner.party_2026) }}
                          >
                            {seat.winner.party_2026}
                          </span>
                        ) : (
                          <span
                            className="badge px-2 py-0.5 text-xs rounded"
                            style={{ backgroundColor: 'var(--bg3)', color: 'var(--text3)' }}
                          >
                            Pending
                          </span>
                        )}
                      </div>
                      {seat.has_results && seat.winner && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>
                          {seat.winner.candidate_name} ·{' '}
                          {seat.winner.votes_2026.toLocaleString()} votes
                          {seat.margin_2026 != null &&
                            ` · margin ${seat.margin_2026.toLocaleString()}`}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Seat detail */}
            <div className="card">
              {selectedData ? (
                <>
                  <h3 className="text-sm font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text2)' }}>
                    {selectedData.seat_id} — {selectedData.seat_name}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--text3)' }}>
                    {selectedData.region} · Registered 2026:{' '}
                    {selectedData.registered_2026.toLocaleString()}
                  </p>

                  <div className="space-y-3">
                    {selectedData.candidates.map((c) => {
                      const total = selectedData.total_votes_2026 || 1
                      const pct = ((c.votes_2026 / total) * 100).toFixed(1)
                      const isWinner =
                        selectedData.has_results &&
                        c.id === selectedData.winner?.id
                      return (
                        <div key={c.id} className="space-y-0.5">
                          <div className="flex justify-between text-sm">
                            <span
                              className={isWinner ? 'font-bold' : ''}
                              style={{ color: isWinner ? 'var(--text)' : 'var(--text2)' }}
                            >
                              {isWinner && '✓ '}
                              {c.candidate_name}
                            </span>
                            <span style={{ color: 'var(--text3)' }}>
                              {c.votes_2026 > 0
                                ? `${c.votes_2026.toLocaleString()} (${pct}%)`
                                : '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                              style={{ backgroundColor: partyColor(c.party_2026) }}
                            >
                              {c.party_2026}
                            </span>
                            {c.votes_2026 > 0 && (
                              <div className="flex-1 rounded h-2" style={{ backgroundColor: 'var(--bg3)' }}>
                                <div
                                  className="h-2 rounded transition-all duration-500"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: partyColor(c.party_2026),
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text3)' }}>
                            2021: {c.votes_2021.toLocaleString()}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  <div
                    className="mt-4 pt-4 text-xs"
                    style={{ borderTop: '1px solid var(--border)', color: 'var(--text3)' }}
                  >
                    2021: {selectedData.winner_2021} ({selectedData.winner_party_2021})
                    won with {selectedData.winner_votes_2021.toLocaleString()} votes ·
                    Turnout {selectedData.turnout_pct_2021}%
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text3)' }}>
                  ← Click a constituency to see the full result
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}
