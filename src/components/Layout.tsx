import Link from 'next/link'
import { useRouter } from 'next/router'
import { clsx } from 'clsx'
import { useTheme } from '@/hooks/useTheme'

// NOTE: '/' is now the ApexInsights landing page (pages/index.tsx), not the
// live dashboard. The dashboard lives at '/live'. Keep this in sync if either
// route ever changes — Layout.tsx and pages/index.tsx's own NAV array are
// the two places that define site navigation.
const NAV = [
  { href: '/live',        label: 'Live Results'  },
  { href: '/records',     label: 'Records'       },
  { href: '/demography',  label: 'Voters Details' },
  { href: '/candidates',  label: 'Candidates'    },
  { href: '/projection',  label: 'Projection'    },
  { href: '/map',         label: 'Map'           },
  { href: '/enter',       label: 'Enter Results', special: true },
  { href: '/methodology', label: 'Methodology'   },
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
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2 gap-3">
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

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold font-mono"
                   style={{ color: '#B42318' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#E4002B' }} />
                LIVE FEED READY
              </div>
              <button onClick={toggle}
                className="w-9 h-9 flex items-center justify-center rounded-lg
                           text-base transition-colors"
                style={{ backgroundColor: 'var(--bg3)',
                         border: '1px solid var(--border)',
                         color: 'var(--text2)' }}
                title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
                <span className="font-mono text-xs">{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium
                             whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                    color: active
                      ? '#ffffff'
                      : item.special ? 'var(--accent)'
                      : 'var(--text2)',
                    border: active ? 'none'
                      : item.special ? '1px solid var(--accent)'
                      : '1px solid transparent',
                  }}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
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
