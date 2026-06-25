import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTheme } from '@/hooks/useTheme'

// Uses identical header CSS/structure as index.tsx (landing page) so both
// are pixel-perfect consistent — same classes, same breakpoints, same behaviour.

const NAV = [
  { href: '/live',         label: 'Live' },
  { href: '/projection',   label: 'Projection' },
  { href: '/records',      label: 'Records' },
  { href: '/map',          label: 'Map' },
  { href: '/demography',   label: 'Demography' },
  { href: '/candidates',   label: 'Candidates' },
  { href: '/methodology',  label: 'Methodology' },
  { href: '/constitution', label: 'Constitution' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useRouter()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="lA" style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>

      {/* ── Header — identical structure to index.tsx ─────────────────────── */}
      <header className="lA-top">
        <div className="lA-wrap lA-topin">

          <Link href="/" className="lA-brand" style={{ textDecoration:'none' }}>
            <div className="lA-mark">A</div>
            <div>
              <div className="lA-bname">AJK Election Analytics</div>
              <div className="lA-bsub">An ApexInsights Platform</div>
            </div>
          </Link>

          <nav className="lA-nav">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                style={{ color: pathname === n.href ? 'var(--accent)' : undefined }}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="lA-top-right">
            <div className="lA-live">
              <span className="lA-dot" /> Live
            </div>
            <button onClick={toggle} className="lA-toggle">
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
              {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>
            <button onClick={() => setMenuOpen(v => !v)} className="lA-burger" aria-label="Menu">
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

        {menuOpen && (
          <nav className="lA-mobnav" style={{ display:'flex' }}>
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                onClick={() => setMenuOpen(false)}
                style={{ color: pathname === n.href ? 'var(--accent)' : undefined }}>
                {n.label}
              </Link>
            ))}
            <div style={{ paddingTop:8, display:'flex', gap:16 }}>
              <Link href="/enter" onClick={() => setMenuOpen(false)}
                style={{ fontSize:12, opacity:0.6, color:'var(--muted)' }}>
                Enter Results
              </Link>
              <Link href="/score" onClick={() => setMenuOpen(false)}
                style={{ fontSize:12, opacity:0.6, color:'var(--muted)' }}>
                Score Seats
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="lA-wrap" style={{ flex:1, paddingTop:24, paddingBottom:48 }}>
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop:'1px solid var(--border)',
        padding:'14px 24px',
        display:'flex', justifyContent:'space-between',
        alignItems:'center', flexWrap:'wrap', gap:8,
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

      {/* ── Styles — exact same pattern as index.tsx styled-jsx ──────────── */}
      <style jsx global>{`
        .lA { background:var(--bg); color:var(--text);
          font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif;
          -webkit-font-smoothing:antialiased; }
        .lA * { box-sizing:border-box; }
        .lA a { color:inherit; text-decoration:none; }

        .lA-wrap { max-width:1120px; margin:0 auto; padding:0 48px; }

        /* Header */
        .lA-top { border-bottom:1px solid var(--border);
          background:var(--card-bg,rgba(255,255,255,.9));
          backdrop-filter:blur(8px); position:sticky; top:0; z-index:50; }
        .lA-topin { display:flex; align-items:center;
          justify-content:space-between; height:64px; }

        /* Brand */
        .lA-brand { display:flex; align-items:center; gap:12px; }
        .lA-mark { width:30px; height:30px; border-radius:7px;
          background:var(--accent);
          display:flex; align-items:center; justify-content:center;
          color:#fff; font-weight:800;
          font-family:'Newsreader',serif; font-size:18px; flex-shrink:0; }
        .lA-bname { font-weight:700; font-size:15px; letter-spacing:-.01em;
          color:var(--text); }
        .lA-bsub { font-size:11px; color:var(--text3);
          letter-spacing:.04em; text-transform:uppercase; }

        /* Desktop nav */
        .lA-nav { display:flex; gap:22px; }
        .lA-nav a { font-size:13px; color:var(--text2);
          font-weight:500; transition:color .15s; white-space:nowrap; }
        .lA-nav a:hover { color:var(--accent); }

        /* Right controls */
        .lA-top-right { display:flex; align-items:center; gap:14px; }
        .lA-live { display:flex; align-items:center; gap:7px;
          font-size:12px; font-weight:600; color:#B42318;
          font-family:'IBM Plex Mono',monospace; }
        .lA-dot { width:8px; height:8px; border-radius:50%;
          background:#E4002B; animation:lApulse 2s infinite;
          display:inline-block; flex-shrink:0; }
        @keyframes lApulse {
          0%  { box-shadow:0 0 0 0 rgba(228,0,43,.45); }
          70% { box-shadow:0 0 0 9px rgba(228,0,43,0); }
          100%{ box-shadow:0 0 0 0 rgba(228,0,43,0); }
        }
        .lA-toggle { display:flex; align-items:center; gap:6px;
          height:32px; padding:0 12px; border-radius:8px;
          border:1px solid var(--border); background:var(--bg3);
          color:var(--text2); font-size:12px; font-weight:600;
          font-family:'IBM Plex Mono',monospace;
          cursor:pointer; transition:border-color .15s,color .15s; }
        .lA-toggle:hover { border-color:var(--accent); color:var(--accent); }
        .lA-burger { display:none; align-items:center; justify-content:center;
          width:32px; height:32px; border-radius:8px;
          border:1px solid var(--border); background:var(--bg3);
          color:var(--text); cursor:pointer; }
        .lA-mobnav { display:none; flex-direction:column;
          border-top:1px solid var(--border);
          background:var(--card-bg); padding:8px 24px 14px; }
        .lA-mobnav a { font-size:14.5px; font-weight:500; color:var(--text);
          padding:11px 0; border-bottom:1px solid var(--border); }
        .lA-mobnav a:last-of-type { border-bottom:none; }

        /* Mobile */
        @media (max-width:768px) {
          .lA-nav    { display:none; }
          .lA-burger { display:flex; }
          .lA-wrap   { padding:0 16px; }
          .lA-topin  { height:auto; padding:10px 0;
                        flex-wrap:wrap; row-gap:8px; }
          .lA-brand  { flex:1 1 auto; min-width:0; }
          .lA-bname  { font-size:13px; }
          .lA-bsub   { font-size:9.5px; }
          .lA-top-right { gap:8px; flex-wrap:wrap; }
          .lA-live   { font-size:10px; white-space:nowrap; }
          .lA-toggle { height:28px; padding:0 8px; font-size:10.5px; }
          .lA-mobnav { display:flex; }
        }
      `}</style>
    </div>
  )
}
