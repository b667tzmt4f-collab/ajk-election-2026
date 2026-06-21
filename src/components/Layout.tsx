import Link from 'next/link'
import { useRouter } from 'next/router'

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
              <h1 className="text-sm md:text-base font-bold" style={{ color: 'var(--text)' }}>
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
                    fontWeight: active || item.special ? 600 : 500,
                  }}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold font-mono shrink-0"
               style={{ color: '#B42318' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#E4002B' }} />
            LIVE FEED READY
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
