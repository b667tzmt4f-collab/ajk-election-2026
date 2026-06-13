interface Props {
  label: string
  value: string | number
  sub?: string
  color?: string
}
export default function StatCard({ label, value, sub, color }: Props) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wide font-semibold"
         style={{ color: 'var(--text3)' }}>{label}</p>
      <p className="text-2xl font-bold"
         style={{ color: color || 'var(--text)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text3)' }}>{sub}</p>}
    </div>
  )
}
