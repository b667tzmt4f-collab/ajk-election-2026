import { partyColor } from '@/lib/supabase'

interface Props {
  tally: Record<string, number>
  total?: number
  majority?: number
}

export default function PartyTallyBar({ tally, majority = 23 }: Props) {
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1])
  const totalDeclared = sorted.reduce((s, [, n]) => s + n, 0)

  return (
    <div className="space-y-2">
      {sorted.map(([party, seats]) => (
        <div key={party} className="flex items-center gap-3">
          <div className="w-28 text-right text-sm font-medium truncate">{party}</div>
          <div className="flex-1 rounded-full h-6 relative"
               style={{ backgroundColor: 'var(--border)' }}>
            <div
              className="h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
              style={{
                width: `${Math.max((seats / 45) * 100, 2)}%`,
                backgroundColor: partyColor(party),
              }}
            >
              <span className="text-xs font-bold text-white">{seats}</span>
            </div>
          </div>
        </div>
      ))}

      {/* Majority line */}
      <div className="relative mt-1">
        <div
          className="absolute top-0 h-2 border-l-2 border-red-500 border-dashed"
          style={{ left: `${(majority / 45) * 100}%`, marginLeft: 112 + 12 }}
        />
        <p
          className="text-xs text-red-400 mt-1"
          style={{ marginLeft: `calc(${(majority / 45) * 100}% + 128px)` }}
        >
          Majority ({majority})
        </p>
      </div>

      <p className="text-xs pt-1" style={{ color: 'var(--text3)' }}>
        {totalDeclared} / 45 seats declared
      </p>
    </div>
  )
}
