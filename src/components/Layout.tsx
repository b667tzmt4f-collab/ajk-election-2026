import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from '@/hooks/useTheme'

const NAV = [
  { href: '/live',        label: 'Live' },
  { href: '/projection',  label: 'Projection' },
  { href: '/records',     label: 'Records' },
  { href: '/map',         label: 'Map' },
  { href: '/demography',  label: 'Demography' },
  { href: '/candidates',  label: 'Candidates' },
  { href: '/methodology', label: 'Methodology' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const linkStyle = (href: string) => ({
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'Hanken Grotesk', sans-serif",
    color: pathname === href ? 'var(--accent)' : 'var(--text2)',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    transition: 'color .15s',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column',
                  backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          maxWidth: 1120, margin: '0 auto',
          padding: '0 24px',
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Brand */}
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10,
                                  textDecoration:'none', flexShrink:0 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              backgroundColor:'var(--accent)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontWeight:800,
              fontFamily:"'Newsreader', serif", fontSize:18, flexShrink:0,
            }}>A</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, letterSpacing:'-.01em',
                            color:'var(--text)', fontFamily:"'Hanken Grotesk', sans-serif" }}>
                AJK Election Analytics
              </div>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'.04em',
                            textTransform:'uppercase', fontFamily:"'Hanken Grotesk', sans-serif" }}>
                An ApexInsights Platform
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="layout-desknav" style={{
            display:'flex', alignItems:'center', gap:18,
            flexWrap:'nowrap', flexShrink:1, minWidth:0,
          }}>
            {NAV.map(item => (
              <Link key={item.href} href={item.href} style={linkStyle(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div className="layout-live" style={{
              display:'flex', alignItems:'center', gap:7,
              fontSize:12, fontWeight:600, color:'#B42318',
              fontFamily:"'IBM Plex Mono', monospace",
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%',
                             backgroundColor:'#E4002B',
                             animation:'pulse 1.5s infinite' }} />
              Live
            </div>

            <button onClick={toggle} style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'6px 10px', borderRadius:8,
              fontSize:12, fontWeight:600,
              fontFamily:"'IBM Plex Mono', monospace",
              backgroundColor:'var(--bg3)',
              border:'1px solid var(--border)',
              color:'var(--text2)', cursor:'pointer',
            }}>
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
              <span className="layout-darktext">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
            </button>

            {/* Hamburger — mobile only */}
            <button
              className="layout-burger"
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display:'none', alignItems:'center', justifyContent:'center',
                width:36, height:36, borderRadius:8, cursor:'pointer',
                backgroundColor:'var(--bg3)', border:'1px solid var(--border)',
                color:'var(--text)',
              }}>
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {menuOpen && (
          <nav style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--card-bg)',
            padding: '12px 24px 16px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {NAV.map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  ...linkStyle(item.href),
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 15,
                  whiteSpace: 'normal',
                }}>
                {item.label}
              </Link>
            ))}
            <div style={{ marginTop:8, display:'flex', gap:12, alignItems:'center' }}>
              <Link href="/enter" onClick={() => setMenuOpen(false)}
                style={{ fontSize:12, color:'var(--text3)', textDecoration:'none', opacity:0.7 }}>
                Enter Results
              </Link>
              <span style={{ color:'var(--border)' }}>·</span>
              <Link href="/score" onClick={() => setMenuOpen(false)}
                style={{ fontSize:12, color:'var(--text3)', textDecoration:'none', opacity:0.7 }}>
                Score Seats
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        maxWidth: 1120, margin: '0 auto', width: '100%',
        padding: '24px 24px 48px',
      }}>
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize:11, color:'var(--text3)' }}>
          AJK GE 2026 Analytics · An ApexInsights Platform ·
          Independent · Not affiliated with any party or government
        </span>
        <span style={{ fontSize:11, color:'var(--text3)', opacity:0.6 }}>
          Admin:&nbsp;
          <Link href="/enter" style={{ color:'var(--text3)', textDecoration:'none' }}>Enter Results</Link>
          &nbsp;·&nbsp;
          <Link href="/score" style={{ color:'var(--text3)', textDecoration:'none' }}>Score Seats</Link>
        </span>
      </footer>

      {/* ── Responsive styles ──────────────────────────────────────────────── */}
      <style jsx global>{`
        /* Hide desktop nav, show hamburger on mobile */
        @media (max-width: 768px) {
          .layout-desknav { display: none !important; }
          .layout-burger  { display: flex !important; }
          .layout-darktext { display: none; }
        }
        /* Kill any link underlines in header/footer */
        header a, footer a { text-decoration: none !important; border-bottom: none !important; }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}
