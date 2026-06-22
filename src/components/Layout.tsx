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
        style={{ backgroundColor: 'var(--card-bg)',
                 borderBottom: '1px solid var(--border)',
                 backdropFilter: 'blur(8px)',
                 opacity: 0.97 }}>
        <div className="max-w-7xl mx-auto px-4 py-3
                         flex items-center justify-between gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold font-display text-lg"
                 style={{ backgroundColor: 'var(--accent)' }}>A</div>
            <div className="leading-tight">
              <h1 className="text-sm md:text-base font-medium" style={{ color: 'var(--text)', fontWeight: 500 }}>
                AJK Election Analytics
              </h1>
              <p className="text-[10px] md:text-xs uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
                An ApexInsights Platform
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-5 overflow-x-auto scrollbar-hide">
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className="text-sm whitespace-nowrap transition-colors"
                  style={{
                    color: active ? 'var(--accent)'
                      : item.special ? 'var(--accent)'
                      : 'var(--text2)',
                    fontWeight: 500,
                    fontFamily: '"Hanken Grotesk", sans-serif',
                  }}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold font-mono"
                 style={{ color: '#B42318' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#E4002B' }} />
              LIVE FEED READY
            </div>

            <button onClick={toggle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                         font-mono transition-colors"
              style={{ backgroundColor: 'var(--bg3)',
                       border: '1px solid var(--border)',
                       color: 'var(--text2)' }}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              {theme === 'dark' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="py-4 text-center text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text3)' }}>
        AJK GE 2026 Analytics · An ApexInsights Platform · Independent · Not affiliated with any party or government
      </footer>
    </div>
  )
}
