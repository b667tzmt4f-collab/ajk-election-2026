import Link from 'next/link'

function Error({ statusCode, message }: { statusCode: number; message?: string }) {
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
          {statusCode || '!'}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
          {statusCode === 404 ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 24 }}>
          {message || 'An unexpected error occurred.'}
        </p>
        {statusCode === 500 && (
          <div style={{
            backgroundColor: 'var(--bg3)', borderRadius: 8,
            padding: '12px 16px', marginBottom: 24,
            textAlign: 'left', fontSize: 13, color: 'var(--text2)',
          }}>
            <p style={{ fontWeight: 500, marginBottom: 6 }}>Common causes:</p>
            <ul style={{ paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
              <li>Missing or incorrect <code>.env.local</code></li>
              <li>Wrong Supabase URL or API key</li>
              <li>Supabase tables not yet created</li>
            </ul>
          </div>
        )}
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

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode, message: err?.message }
}

export default Error
