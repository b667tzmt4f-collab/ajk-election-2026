import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from '@/hooks/useTheme'
import { useState } from 'react'

export const NAV = [
  { href: '/live',        label: 'Live' },
  { href: '/records',     label: 'Records' },
  { href: '/analysis',    label: 'Analysis' },
  { href: '/projection',  label: 'Projection' },
  { href: '/map',         label: 'Map' },
  { href: '/demography',  label: 'Demography' },
]

export default function Header() {
  const { pathname } = useRouter()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>

          {/* Brand */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
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

          {/* Desktop nav */}
          <nav style={{ display: 'flex', gap: 22 }} className="header-nav">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} style={{
                fontSize: 13,
                fontWeight: 500,
                color: pathname === n.href ? 'var(--accent)' : 'var(--text3)',
                textDecoration: 'none',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}>
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 12, fontWeight: 600, color: '#B42318',
              fontFamily: "'IBM Plex Mono', monospace",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#E4002B', display: 'inline-block',
                animation: 'pulse 2s infinite',
              }} />
              Live
            </div>

            <button onClick={toggle} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg3)',
              color: 'var(--text2)', fontSize: 12, fontWeight: 600,
              fontFamily: "'IBM Plex Mono', monospace",
              cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
            }}>
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
              {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>

            {/* Burger — mobile only */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              className="header-burger"
              style={{
                display: 'none', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text)', cursor: 'pointer',
              }}>
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav style={{
            display: 'flex', flexDirection: 'column',
            borderTop: '1px solid var(--border)',
            background: 'var(--card-bg)', padding: '8px 24px 14px',
          }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontSize: 14.5, fontWeight: 500,
                  color: pathname === n.href ? 'var(--accent)' : 'var(--text)',
                  padding: '11px 0',
                  borderBottom: '1px solid var(--border)',
                  textDecoration: 'none',
                }}>
                {n.label}
              </Link>
            ))}
            <div style={{ paddingTop: 8, display: 'flex', gap: 16 }}>
              <Link href="/enter" onClick={() => setMenuOpen(false)}
                style={{ fontSize: 12, opacity: 0.6, color: 'var(--text3)', textDecoration: 'none' }}>
                Enter Results
              </Link>
              <Link href="/score" onClick={() => setMenuOpen(false)}
                style={{ fontSize: 12, opacity: 0.6, color: 'var(--text3)', textDecoration: 'none' }}>
                Score Seats
              </Link>
            </div>
          </nav>
        )}
      </header>

      <style jsx global>{`
        @keyframes pulse {
          0%  { box-shadow: 0 0 0 0 rgba(228,0,43,.45); }
          70% { box-shadow: 0 0 0 9px rgba(228,0,43,0); }
          100%{ box-shadow: 0 0 0 0 rgba(228,0,43,0); }
        }
        @media (max-width: 768px) {
          .header-nav { display: none !important; }
          .header-burger { display: flex !important; }
          .header-wrap { padding: 0 16px !important; }
        }
      `}</style>
    </>
  )
}