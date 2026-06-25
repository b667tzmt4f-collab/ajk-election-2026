import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: 'var(--bg)',
      color: 'var(--text)', fontFamily: 'Hanken Grotesk, sans-serif',
      padding: 32,
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <p style={{ fontSize: 72, fontWeight: 500, margin: '0 0 8px',
          color: 'var(--accent)', fontFamily: 'IBM Plex Mono, monospace' }}>
          404
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
          This page doesn't exist or has been moved.
        </p>
        <Link href="/" style={{
          display: 'inline-block', padding: '10px 24px',
          backgroundColor: 'var(--accent)', color: '#fff',
          borderRadius: 8, fontSize: 14, textDecoration: 'none',
        }}>
          Back to home
        </Link>
      </div>
    </div>
  )
}
