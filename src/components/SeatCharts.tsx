import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import { partyColor } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// SeatCharts — donut (seat share of the house) + vertical bar (seats per party),
// side by side. Reused anywhere a party→seats tally is shown: Live Results,
// Records (per year), Projection. Themed via CSS variables.
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  tally: Record<string, number>
  houseSize?: number     // total seats in the house (for the donut remainder)
  title?: string
}

// read a CSS variable at render time so charts follow light/dark theme
function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export default function SeatCharts({ tally, houseSize = 45, title }: Props) {
  const sorted = Object.entries(tally)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'var(--text3)' }}>
        No seats to chart yet.
      </div>
    )
  }

  const declared = sorted.reduce((s, [, n]) => s + n, 0)
  const remaining = Math.max(houseSize - declared, 0)

  const barData = sorted.map(([party, seats]) => ({ party, seats }))
  const pieData = [
    ...sorted.map(([party, seats]) => ({ name: party, value: seats })),
    ...(remaining > 0 ? [{ name: 'Undeclared', value: remaining }] : []),
  ]

  const axis = cssVar('--text3', '#8a7a66')
  const grid = cssVar('--border', '#d9d0c0')
  const cardBg = cssVar('--card-bg', '#ffffff')

  const colorFor = (name: string) =>
    name === 'Undeclared' ? grid : partyColor(name)

  return (
    <div>
      {title && (
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--text3)' }}>
          {title}
        </h4>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Donut — seat share */}
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={1}
                stroke={cardBg}
                strokeWidth={2}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={colorFor(d.name)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: cardBg,
                  border: `1px solid ${grid}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v, n) => [`${v} seats`, String(n)]}
              />
              {/* centre label: declared / house */}
              <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 22, fontWeight: 800, fill: 'var(--text)' }}>
                {declared}
              </text>
              <text x="50%" y="59%" textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 11, fill: axis }}>
                of {houseSize}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Vertical bar — seats per party */}
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="party"
                tick={{ fill: axis, fontSize: 11 }}
                axisLine={{ stroke: grid }}
                tickLine={false}
                interval={0}
                angle={barData.length > 4 ? -30 : 0}
                textAnchor={barData.length > 4 ? 'end' : 'middle'}
                height={barData.length > 4 ? 48 : 24}
              />
              <YAxis
                tick={{ fill: axis, fontSize: 11 }}
                axisLine={{ stroke: grid }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--bg3)', opacity: 0.4 }}
                contentStyle={{
                  backgroundColor: cardBg,
                  border: `1px solid ${grid}`,
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => [`${v} seats`, 'Seats']}
              />
              <Bar dataKey="seats" radius={[4, 4, 0, 0]}>
                {barData.map((d) => (
                  <Cell key={d.party} fill={partyColor(d.party)} />
                ))}
                <LabelList dataKey="seats" position="top"
                           style={{ fill: 'var(--text2)', fontSize: 11, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
