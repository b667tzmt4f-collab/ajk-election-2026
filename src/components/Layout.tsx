export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 48px 48px' }}>
      {children}
    </div>
  )
}
