import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from '@/hooks/useTheme'

// NOTE: '/' is now the ApexInsights landing page (pages/index.tsx), not the
// live dashboard. The dashboard lives at '/live'. Keep this in sync if either
// route ever changes — Layout.tsx and pages/index.tsx's own NAV array are
// the two places that define site navigation.
//
// Header layout intentionally mirrors the landing page's single-row header
// (logo+brand, inline nav, live indicator) for site-wide visual consistency.
// Dark-mode toggle removed for now — useTheme hook still drives the CSS
// variables in globals.css, so dark mode itself isn't gone, just the
// in-header switch. Re-add a toggle control here when ready.
const NAV = [
  { href: '/live',        label: 'Live' },
  { href: '/projection',  label: 'Projection' },
  { href: '/records',     label: 'Records' },
  { href: '/map',         label: 'Map' },
  { href: '/demography',  label: 'Demography' },
  { href: '/candidates',  label: 'Candidates' },
  { href: '/enter',       label: 'Enter Results', special: true },
  { href: '/methodology', label: 'Methodology' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter()
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-screen flex flex-col"
         style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      <header className="sticky top-0 z-50"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
        }}>
        <div style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 48px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none', flexShrink:0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontFamily: "'Newsreader', serif", fontSize: 18,
            }}>A</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-.01em', color: 'var(--text)', fontFamily: "'Hanken Grotesk', sans-serif" }}>
                AJK Election Analytics
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: "'Hanken Grotesk', sans-serif" }}>
                An ApexInsights Platform
              </div>
            </div>
          </Link>

          <nav style={{ display:'flex', alignItems:'center', gap:26, overflowX:'auto' }}>
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    color: active ? 'var(--accent)' : item.special ? 'var(--accent)' : 'var(--text2)',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color .15s',
                    borderBottom: 'none',
                    outline: 'none',
                  }}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:600, color:'#B42318', fontFamily:"'IBM Plex Mono', monospace" }}
                 className="hidden sm:flex">
              <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:'#E4002B', animation:'pulse 1.5s infinite' }} />
              LIVE FEED READY
            </div>

            <button onClick={toggle}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8,
                fontSize: 12, fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                backgroundColor: 'var(--bg3)',
                border: '1px solid var(--border)',
                color: 'var(--text2)',
                cursor: 'pointer',
                transition: 'background .15s',
              }}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', width: '100%', padding: '24px 48px 48px' }}>
        {children}
      </main>

      <footer className="py-4 text-center text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text3)' }}>
        AJK GE 2026 Analytics · An ApexInsights Platform · Independent · Not affiliated with any party or government
      </footer>
    </div>
  )
}
