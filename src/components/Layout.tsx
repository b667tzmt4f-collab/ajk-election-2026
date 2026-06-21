import Link from 'next/link'
import { useRouter } from 'next/router'
import { clsx } from 'clsx'
import { useTheme } from '@/hooks/useTheme'

const NAV = [
  { href: '/live',            label: '📡 Live Results'  },
  { href: '/records',     label: '📊 Records'       },
  { href: '/map',         label: '🌍 Map'           },
  { href: '/demography',  label: '🗺️ Voters Details' },
  { href: '/candidates',  label: '👤 Candidates'    },
  { href: '/projection',  label: '🔮 Projection'    },
  { href: '/enter',       label: '✏️ Enter Results', special: true },
  { href: '/methodology', label: 'ℹ️ Methodology'   },
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
                 boxShadow: '0 1px 6px var(--shadow)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-base md:text-lg font-bold leading-tight"
                  style={{ color: 'var(--accent)' }}>
                AJK Legislative Assembly — Election Analytics 2026
              </h1>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                45 constituencies · Independent platform · Not affiliated with any party
              </p>
            </div>
            <button onClick={toggle}
              className="w-9 h-9 flex items-center justify-center rounded-lg
                         text-base transition-colors"
              style={{ backgroundColor: 'var(--bg3)',
                       border: '1px solid var(--border)',
                       color: 'var(--text2)' }}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  className="px-3 py-1.5 rounded text-xs md:text-sm font-medium
                             whitespace-nowrap transition-all"
                  style={{
                    backgroundColor: active ? 'var(--accent)' : 'transparent',
                    color: active
                      ? '#ffffff'
                      : item.special ? 'var(--accent)'
                      : 'var(--text2)',
                    border: active ? 'none'
                      : item.special ? '1px solid var(--border)'
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

      <footer className="py-4 text-center text-xs"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--text3)' }}>
        AJK GE 2026 Analytics · Independent · Not affiliated with any party or government
      </footer>
    </div>
  )
}
