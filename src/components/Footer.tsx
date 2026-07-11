import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--card-bg)',
      padding: '48px 0 40px',
    }}>
      <div style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '0 48px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 40,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>

        {/* Brand + description */}
        <div style={{ maxWidth: 360 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 16 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800,
              fontFamily: "'Newsreader', serif", fontSize: 18, flexShrink: 0,
            }}>A</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                AJK Election Analytics
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                An ApexInsights Platform
              </div>
            </div>
          </Link>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text3)', margin: '0 0 8px' }}>
            An <strong style={{ color: 'var(--text)' }}>independent, data-driven</strong> platform
            from <strong style={{ color: 'var(--text)' }}>ApexInsights</strong>, published for
            public reference. Not affiliated with any political party, government body or media
            organisation. Every figure is auditable against its cited source.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0, opacity: 0.7 }}>
            © 2026 ApexInsights. All rights reserved.
          </p>
        </div>

        {/* Data links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>
            Data
          </div>
          <Link href="/records" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Election records</Link>
          <Link href="/demography" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Voter demography</Link>
          <Link href="/candidates" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Candidate list</Link>
        </div>

        {/* Analysis links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>
            Analysis
          </div>
          <Link href="/analysis" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Vote-bank analysis</Link>
          <Link href="/projection" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>2026 projection</Link>
          <Link href="/map" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Constituency map</Link>
          <Link href="/methodology" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Methodology</Link>
          <Link href="/constitution" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>Constitution</Link>
        </div>

        {/* Admin links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>
            Admin
          </div>
          <Link href="/enter" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', opacity: 0.6 }}>Enter Results</Link>
          <Link href="/score" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none', opacity: 0.6 }}>Score Seats</Link>
        </div>

      </div>
    </footer>
  )
}