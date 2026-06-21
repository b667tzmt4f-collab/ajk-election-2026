import { useEffect, useState } from 'react'
import { supabase, partyColor } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// Home / landing page — ApexInsights · AJK Election Analytics
// Self-contained: it renders its OWN header + footer, so it is NOT wrapped in
// <Layout>. Styling is via styled-jsx (built into Next.js — nothing to install).
// ─────────────────────────────────────────────────────────────────────────────

// Polling day for AJK General Election 2026 (edit when the EC confirms the date).
const POLL_DATE = new Date('2026-07-12T08:00:00+05:00')

// Static fallback tally (2021 post-tribunal). Used until Supabase returns data.
const FALLBACK_TALLY: { party: string; seats: number }[] = [
  { party: 'PTI', seats: 24 },
  { party: 'PPP', seats: 12 },
  { party: 'PML-N', seats: 7 },
  { party: 'AJKMC', seats: 1 },
  { party: 'JKPP', seats: 1 },
]

const NAV = [
  { label: 'Live', href: '/live' },
  { label: 'Projection', href: '/projection' },
  { label: 'Records', href: '/records' },
  { label: 'Map', href: '/map' },
  { label: 'Demography', href: '/demography' },
  { label: 'Candidates', href: '/candidates' },
  { label: 'Methodology', href: '/methodology' },
]

const UPDATES = [
  {
    date: '12 Jun 2026', tag: 'Candidates',
    title: '2026 provisional candidate field mapped across all 45 seats',
    body: 'Initial field compiled from 2021 EC data. Ex-PTI candidates listed as IND pending the final notified list.',
  },
  {
    date: '22 May 2026', tag: 'Voter rolls',
    title: 'Election Commission notifies final 2026 electoral rolls',
    body: 'Notification EC/S/12890-13062/2026. Roughly 377,000 new voters added since 2021; no seat exceeds a 50% female share.',
  },
  {
    date: '06 May 2026', tag: 'Analysis',
    title: 'Anti-incumbency holds: every AJK election since 2011 flipped',
    body: '19 of 41 comparable seats changed hands at every election. Only 7 seats stayed with one party across all three.',
  },
  {
    date: '28 Apr 2026', tag: 'Methodology',
    title: 'Four-stage projection framework published for review',
    body: 'Historical evidence base is live; field survey and six-pillar KPI scoring are in preparation ahead of polling day.',
  },
]

const PRODUCTS = [
  { kicker: '01', name: '2026 Projection', href: '/projection', metric: '4-stage', metricLabel: 'model',
    desc: 'Four-stage quantitative forecast — historical baseline, field survey, six-pillar KPI rubric and a cross-model LLM jury.' },
  { kicker: '02', name: 'Election Records', href: '/records', metric: '3', metricLabel: 'elections',
    desc: 'Every seat, every winner, three general elections side by side — with flip analysis and margin trajectories.' },
  { kicker: '03', name: 'Voter Demography', href: '/demography', metric: '+377K', metricLabel: 'new voters',
    desc: 'EC-notified 2026 rolls against 2021 — registration growth, the female-registration gap and new-voter pressure per seat.' },
  { kicker: '04', name: 'Constituency Map', href: '/map', metric: '10', metricLabel: 'districts',
    desc: 'Ten in-region districts shaded by dominant party, rolling 45 constituencies up to an auditable geographic view.' },
]

const FACTS = { seats: 45, majority: 23, newVoters: '~377K' }
const pad = (n: number) => String(n).padStart(2, '0')

function useCountdown() {
  const calc = () => {
    let diff = Math.floor((POLL_DATE.getTime() - Date.now()) / 1000)
    if (diff < 0) diff = 0
    return {
      d: Math.floor(diff / 86400),
      h: Math.floor((diff % 86400) / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
    }
  }
  // Static zero-state for the very first server render. The real value is
  // only computed client-side, after mount, so server HTML and the client's
  // first paint always match — this prevents a React hydration mismatch
  // (the clock ticking between server render and client hydration would
  // otherwise produce two different numbers for the same instant).
  const ZERO = { d: 0, h: 0, m: 0, s: 0 }
  const [c, setC] = useState(ZERO)

  useEffect(() => {
    setC(calc())                                   // real value, client-only
    const id = setInterval(() => setC(calc()), 1000)
    return () => clearInterval(id)
  }, [])

  return c
}

export default function Home() {
  const c = useCountdown()
  const [tally, setTally] = useState(FALLBACK_TALLY)

  // Pull the real 2021 seat tally from Supabase; keep the fallback on any error.
  useEffect(() => {
    supabase
      .from('constituencies')
      .select('winner_party_2021')
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return
        const counts: Record<string, number> = {}
        for (const row of data) {
          const p = (row as any).winner_party_2021 || 'Other'
          counts[p] = (counts[p] || 0) + 1
        }
        const next = Object.entries(counts)
          .map(([party, seats]) => ({ party, seats }))
          .sort((a, b) => b.seats - a.seats)
        if (next.length) setTally(next)
      })
  }, [])

  // 45 seat squares coloured by 2021 winner (parliament-style baseline).
  const dots: string[] = []
  tally.forEach((t) => { for (let i = 0; i < t.seats; i++) dots.push(t.party) })

  const Count = ({ v, l }: { v: number; l: string }) => (
    <div className="a-count">
      <span className="a-count-v">{pad(v)}</span>
      <span className="a-count-l">{l}</span>
    </div>
  )

  return (
    <div className="dirA">
      {/* top bar */}
      <header className="a-top">
        <div className="a-wrap a-topin">
          <div className="a-brand">
            <div className="a-mark">A</div>
            <div>
              <div className="a-bname">AJK Election Analytics</div>
              <div className="a-bsub">An ApexInsights platform</div>
            </div>
          </div>
          <nav className="a-nav">
            {NAV.map((n) => <a key={n.label} href={n.href}>{n.label}</a>)}
          </nav>
          <div className="a-live"><span className="a-dot" /> LIVE FEED READY</div>
        </div>
      </header>

      {/* hero */}
      <section className="a-hero">
        <div className="a-wrap">
          <div className="a-kick"><span className="ln" /> General Election · 12 July 2026</div>
          <h1 className="a-h1">Azad Kashmir <em>votes.</em> We count every number.</h1>
          <p className="a-lead">
            Live results, three decades of records and a transparent 2026 projection for all
            45 Legislative Assembly seats — built for the public, the press and the parties alike.
          </p>
          <div className="a-cta">
            <a className="a-btn a-btn-p" href="/projection">See the 2026 projection →</a>
            <a className="a-btn a-btn-s" href="/records">Explore the records</a>
          </div>

          <div className="a-cd">
            <div className="a-cd-lab">Polls open in<br /><b>Muzaffarabad &amp; 44 seats</b></div>
            <div className="a-counts">
              <Count v={c.d} l="Days" /><span className="a-colon">:</span>
              <Count v={c.h} l="Hours" /><span className="a-colon">:</span>
              <Count v={c.m} l="Min" /><span className="a-colon">:</span>
              <Count v={c.s} l="Sec" />
            </div>
          </div>
        </div>
      </section>

      {/* snapshot band */}
      <section className="a-band">
        <div className="a-wrap a-bandin">
          <div className="a-stats">
            <div className="a-stat"><div className="n">{FACTS.seats}</div><div className="l">Assembly seats</div></div>
            <div className="a-stat"><div className="n">{FACTS.majority}</div><div className="l">For a majority</div></div>
            <div className="a-stat"><div className="n">{FACTS.newVoters}</div><div className="l">New voters</div></div>
          </div>
          <div>
            <div className="a-tally-h">
              <span className="a-tally-t">Seat tally — 2021 baseline</span>
              <span className="a-tally-n">Live tally begins on polling day</span>
            </div>
            <div className="a-seats">
              {dots.map((p, i) => (
                <div key={i} className="a-seat" title={p} style={{ background: partyColor(p) }} />
              ))}
            </div>
            <div className="a-leg">
              {tally.map((t) => (
                <span key={t.party}>
                  <i style={{ background: partyColor(t.party) }} />{t.party} {t.seats}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* latest updates */}
      <section className="a-sec a-wrap">
        <div className="a-sec-h">
          <div>
            <h2 className="a-sec-t">Latest from the desk</h2>
            <p className="a-sec-s">Filings, roll changes and analysis as the campaign develops.</p>
          </div>
          <a className="a-more" href="#">All updates →</a>
        </div>
        <div className="a-up">
          {UPDATES.map((u) => (
            <article className="a-upc" key={u.title}>
              <div className="a-upmeta">
                <span className="a-uptag">{u.tag}</span>
                <span className="a-update">{u.date}</span>
              </div>
              <h3 className="a-uptitle">{u.title}</h3>
              <p className="a-upbody">{u.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* products */}
      <section className="a-sec a-wrap" style={{ paddingTop: 0 }}>
        <div className="a-sec-h">
          <div>
            <h2 className="a-sec-t">Four instruments built on one auditable record.</h2>
            <p className="a-sec-s">Each tool draws from the same verified evidence base — so a figure on the projection reconciles with the historical record and the live count.</p>
          </div>
        </div>
        <div className="a-prods">
          {PRODUCTS.map((p) => (
            <a className="a-prod" key={p.name} href={p.href}>
              <div className="a-prod-k">{p.kicker}</div>
              <div>
                <h3 className="a-prod-n">{p.name}</h3>
                <p className="a-prod-d">{p.desc}</p>
                <div className="a-prod-m">
                  <span className="a-prod-mv">{p.metric}</span>
                  <span className="a-prod-ml">{p.metricLabel}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="a-foot">
        <div className="a-wrap a-footin">
          <div>
            <div className="a-brand" style={{ marginBottom: 16 }}>
              <div className="a-mark">A</div>
              <div>
                <div className="a-bname">AJK Election Analytics</div>
                <div className="a-bsub">An ApexInsights platform</div>
              </div>
            </div>
            <p className="a-foot-s">
              An <b>independent, data-driven</b> platform from <b>ApexInsights</b>, published for
              public reference. Not affiliated with any political party, government body or media
              organisation. Every figure is auditable against its cited source.
            </p>
            <p className="a-foot-s" style={{ marginTop: 16, fontSize: 12 }}>© 2026 ApexInsights. All rights reserved.</p>
          </div>
          <div className="a-foot-col">
            <div className="a-foot-h">Data</div>
            <a href="/records">Election records</a>
            <a href="/demography">Voter demography</a>
            <a href="/candidates">Candidate list</a>
          </div>
          <div className="a-foot-col">
            <div className="a-foot-h">Analysis</div>
            <a href="/projection">2026 projection</a>
            <a href="/map">Constituency map</a>
            <a href="/methodology">Methodology</a>
          </div>
        </div>
      </footer>

      {/* All styling lives here — styled-jsx is built into Next.js. */}
      <style jsx global>{`
        .dirA{font-family:'Hanken Grotesk',sans-serif;background:#F5F7FA;color:#0C1320;
          --ink:#0C1320;--muted:#5B6675;--line:#E2E7EE;--accent:#2C4A7C;--soft:#ECF1FF;
          width:100%;-webkit-font-smoothing:antialiased;min-height:100vh;}
        .dirA *{box-sizing:border-box;}
        .dirA a{color:inherit;text-decoration:none;}
        .a-wrap{max-width:1120px;margin:0 auto;padding:0 48px;}

        .a-top{border-bottom:1px solid var(--line);background:rgba(255,255,255,.85);
          backdrop-filter:blur(8px);position:sticky;top:0;z-index:5;}
        .a-topin{display:flex;align-items:center;justify-content:space-between;height:64px;}
        .a-brand{display:flex;align-items:center;gap:12px;}
        .a-mark{width:30px;height:30px;border-radius:7px;background:var(--accent);
          display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;
          font-family:'Newsreader',serif;font-size:18px;}
        .a-bname{font-weight:700;font-size:15px;letter-spacing:-.01em;}
        .a-bsub{font-size:11px;color:var(--muted);letter-spacing:.04em;text-transform:uppercase;}
        .a-nav{display:flex;gap:26px;}
        .a-nav a{font-size:13.5px;color:var(--muted);font-weight:500;transition:color .15s;}
        .a-nav a:hover{color:var(--accent);}
        .a-live{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#B42318;}
        .a-dot{width:8px;height:8px;border-radius:50%;background:#E4002B;animation:apulse 2s infinite;}
        @keyframes apulse{0%{box-shadow:0 0 0 0 rgba(228,0,43,.45)}70%{box-shadow:0 0 0 9px rgba(228,0,43,0)}100%{box-shadow:0 0 0 0 rgba(228,0,43,0)}}

        .a-hero{padding:64px 0 52px;}
        .a-kick{display:inline-flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.16em;
          text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:22px;}
        .a-kick .ln{width:34px;height:1px;background:var(--accent);opacity:.5;}
        .a-h1{font-family:'Newsreader',serif;font-weight:500;font-size:78px;line-height:.98;
          letter-spacing:-.022em;margin:0 0 22px;max-width:14ch;text-wrap:balance;}
        .a-h1 em{font-style:italic;color:var(--accent);}
        .a-lead{font-size:19px;line-height:1.55;color:var(--muted);max-width:54ch;margin:0 0 34px;}
        .a-cta{display:flex;gap:14px;align-items:center;}
        .a-btn{display:inline-flex;align-items:center;gap:9px;height:48px;padding:0 24px;border-radius:9px;
          font-size:14.5px;font-weight:600;transition:transform .12s,box-shadow .15s,background .15s;}
        .a-btn-p{background:var(--accent);color:#fff;box-shadow:0 8px 20px -8px rgba(44,74,124,.6);}
        .a-btn-p:hover{transform:translateY(-1px);box-shadow:0 12px 26px -8px rgba(44,74,124,.7);}
        .a-btn-s{border:1px solid var(--line);background:#fff;color:var(--ink);}
        .a-btn-s:hover{border-color:var(--accent);color:var(--accent);}

        .a-cd{display:flex;align-items:center;gap:30px;margin-top:46px;padding:22px 26px;
          background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 1px 2px rgba(12,19,32,.04);}
        .a-cd-lab{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);line-height:1.4;max-width:14ch;}
        .a-cd-lab b{color:var(--ink);}
        .a-counts{display:flex;gap:22px;margin-left:auto;}
        .a-count{text-align:center;min-width:54px;}
        .a-count-v{font-family:'IBM Plex Mono',monospace;font-size:38px;font-weight:500;letter-spacing:-.02em;display:block;line-height:1;}
        .a-count-l{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-top:7px;display:block;}
        .a-colon{font-family:'IBM Plex Mono',monospace;font-size:30px;color:var(--line);align-self:flex-start;margin-top:2px;}

        .a-band{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff;padding:40px 0;}
        .a-bandin{display:grid;grid-template-columns:1.1fr 1.4fr;gap:56px;align-items:center;}
        .a-stats{display:flex;gap:40px;}
        .a-stat .n{font-family:'Newsreader',serif;font-size:46px;font-weight:500;line-height:1;letter-spacing:-.02em;}
        .a-stat .l{font-size:12.5px;color:var(--muted);margin-top:8px;}
        .a-tally-h{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;}
        .a-tally-t{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600;}
        .a-tally-n{font-size:12.5px;color:var(--muted);}
        .a-seats{display:grid;grid-template-columns:repeat(15,1fr);gap:6px;max-width:460px;}
        .a-seat{aspect-ratio:1;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(12,19,32,.04);}
        .a-leg{display:flex;flex-wrap:wrap;gap:16px;margin-top:18px;}
        .a-leg span{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--muted);}
        .a-leg i{width:10px;height:10px;border-radius:3px;display:inline-block;}

        .a-sec{padding:70px 0;}
        .a-sec-h{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:34px;}
        .a-sec-t{font-family:'Newsreader',serif;font-size:34px;font-weight:500;letter-spacing:-.02em;margin:0;}
        .a-sec-s{font-size:14px;color:var(--muted);margin:6px 0 0;}
        .a-more{font-size:13.5px;color:var(--accent);font-weight:600;display:inline-flex;gap:6px;align-items:center;}
        .a-up{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;}
        .a-upc{background:#fff;padding:28px 28px 30px;transition:background .15s;cursor:pointer;}
        .a-upc:hover{background:#FAFBFD;}
        .a-upmeta{display:flex;align-items:center;gap:12px;margin-bottom:13px;}
        .a-uptag{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.04em;color:var(--accent);background:var(--soft);padding:3px 9px;border-radius:5px;font-weight:500;}
        .a-update{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--muted);}
        .a-uptitle{font-size:18px;font-weight:600;line-height:1.3;letter-spacing:-.01em;margin:0 0 9px;}
        .a-upbody{font-size:14px;line-height:1.55;color:var(--muted);margin:0;}

        .a-prods{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;}
        .a-prod{background:#fff;border:1px solid var(--line);border-radius:16px;padding:30px;display:flex;gap:24px;align-items:flex-start;transition:border-color .15s,transform .12s,box-shadow .15s;}
        .a-prod:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 16px 32px -18px rgba(44,74,124,.45);}
        .a-prod-k{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--accent);border:1px solid var(--soft);background:var(--soft);width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:500;}
        .a-prod-n{font-size:19px;font-weight:700;letter-spacing:-.01em;margin:0 0 8px;}
        .a-prod-d{font-size:13.5px;line-height:1.55;color:var(--muted);margin:0 0 16px;}
        .a-prod-m{display:flex;align-items:baseline;gap:8px;}
        .a-prod-mv{font-family:'Newsreader',serif;font-size:26px;font-weight:500;}
        .a-prod-ml{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);}

        .a-foot{border-top:1px solid var(--line);background:#fff;padding:48px 0 40px;}
        .a-footin{display:flex;justify-content:space-between;gap:40px;align-items:flex-start;}
        .a-foot-s{font-size:13px;line-height:1.6;color:var(--muted);max-width:48ch;}
        .a-foot-s b{color:var(--ink);}
        .a-foot-col{display:flex;flex-direction:column;gap:9px;}
        .a-foot-col a{font-size:13px;color:var(--muted);}
        .a-foot-col a:hover{color:var(--accent);}
        .a-foot-h{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);font-weight:700;margin-bottom:4px;}

        @media (max-width:860px){
          .a-nav{display:none;}
          .a-h1{font-size:48px;}
          .a-bandin{grid-template-columns:1fr;gap:32px;}
          .a-up,.a-prods{grid-template-columns:1fr;}
          .a-wrap{padding:0 24px;}
        }
      `}</style>
    </div>
  )
}
