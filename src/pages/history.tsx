import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase, Constituency, partyColor } from '@/lib/supabase'

const PARTIES_2021 = {
  PTI: 24, PPP: 12, 'PML-N': 7, AJKMC: 1, JKPP: 1,
}
const PARTIES_2016 = {
  'PML-N': 31, PPP: 3, AJKMC: 3, PTI: 2, Independent: 1, JKPP: 1,
}
const PARTIES_2011 = {
  PPP: 22, 'PML-N': 10, AJKMC: 4, MQM: 2, Independent: 1, PMLQ: 1,
}

export default function History() {
  const [seats, setSeats] = useState<Constituency[]>([])
  const [selectedSeat, setSelectedSeat] = useState('')

  useEffect(() => {
    supabase.from('constituencies').select('*').order('seat_id')
      .then(({ data }) => setSeats(data || []))
  }, [])

  const selected = seats.find((s) => s.seat_id === selectedSeat)

  function TallyBar({ data, year }: { data: Record<string, number>; year: string }) {
    const total = Object.values(data).reduce((a, b) => a + b, 0)
    return (
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">{year}</h3>
        <div className="space-y-1.5">
          {Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .map(([party, seats]) => (
              <div key={party} className="flex items-center gap-2">
                <span className="w-24 text-xs text-right text-gray-300">{party}</span>
                <div className="flex-1 bg-gray-800 rounded h-5">
                  <div
                    className="h-5 rounded flex items-center justify-end pr-2"
                    style={{
                      width: `${(seats / 45) * 100}%`,
                      backgroundColor: partyColor(party),
                    }}
                  >
                    <span className="text-xs font-bold text-white">{seats}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">{total} seats declared</p>
      </div>
    )
  }

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-2">Past Elections</h2>
      <p className="text-sm text-gray-400 mb-6">
        AJK General Elections 2011, 2016, and 2021. Post-tribunal position for 2021:
        PTI 24, PPP 12, PML-N 7, AJKMC 1, JKPP 1.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <TallyBar data={PARTIES_2011} year="2011 — PPP majority" />
        <TallyBar data={PARTIES_2016} year="2016 — PML-N sweep" />
        <TallyBar data={PARTIES_2021} year="2021 — PTI wins (post-tribunal)" />
      </div>

      <div className="card mb-4">
        <p className="text-sm text-gray-400 mb-1">
          Each election was won by a different party. Anti-incumbency is the
          dominant structural force in AJK. 19 of 41 comparable seats flipped at
          every election. Only 7 seats were won by the same party all three times.
        </p>
      </div>

      {/* Per-seat 2021 detail */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
          2021 Per-Seat Results
        </h3>
        <div className="mb-4">
          <select
            value={selectedSeat}
            onChange={(e) => setSelectedSeat(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
          >
            <option value="">All constituencies</option>
            {seats.map((s) => (
              <option key={s.seat_id} value={s.seat_id}>
                {s.seat_id} — {s.seat_name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                <th className="text-left py-2">Seat</th>
                <th className="text-left py-2">Constituency</th>
                <th className="text-left py-2">Winner</th>
                <th className="text-left py-2">Party</th>
                <th className="text-right py-2">Votes</th>
                <th className="text-right py-2">Margin</th>
                <th className="text-right py-2">Turnout</th>
              </tr>
            </thead>
            <tbody>
              {(selectedSeat ? seats.filter((s) => s.seat_id === selectedSeat) : seats).map((s) => (
                <tr key={s.seat_id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-2 text-gray-400">{s.seat_id}</td>
                  <td className="py-2">{s.seat_name}</td>
                  <td className="py-2">{s.winner_2021}</td>
                  <td className="py-2">
                    <span
                      className="badge text-white"
                      style={{ backgroundColor: partyColor(s.winner_party_2021) }}
                    >
                      {s.winner_party_2021}
                    </span>
                  </td>
                  <td className="py-2 text-right">{s.winner_votes_2021.toLocaleString()}</td>
                  <td className="py-2 text-right">{s.margin_2021.toLocaleString()}</td>
                  <td className="py-2 text-right">{s.turnout_pct_2021}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
