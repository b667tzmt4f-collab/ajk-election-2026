import { useState } from 'react'
import Layout from '@/components/Layout'

const COMPOSITION = [
  { category: 'AJK residents (directly elected)', seats: 33, method: 'State Subjects residing in AJK — adult franchise' },
  { category: 'Muzaffarabad / Anantnag / Baramula refugees', seats: 6, method: 'Refugees from these districts (as of 14 Aug 1947) now in Pakistan' },
  { category: 'Jammu / Kathua / Mirpur / Mangla Dam affectees', seats: 6, method: 'State Subjects from these areas now in Pakistan' },
  { category: 'Women', seats: 5, method: 'Elected by the 45 directly elected members' },
  { category: 'Ulema-e-Din / Mushaikh', seats: 1, method: 'Elected by the 45 directly elected members' },
  { category: 'Overseas State Subjects', seats: 1, method: 'Elected by the 45 directly elected members' },
  { category: 'Technocrats / Professionals', seats: 1, method: 'Elected by the 45 directly elected members' },
]

const TIMELINES = [
  { scenario: 'Ordinary expiry', article: 'Art. 22(4)', window: 'Within 60 days immediately preceding expiry', result: '≥ 14 days before expiry date', color: 'text-emerald-400' },
  { scenario: 'After dissolution', article: 'Art. 28(2)', window: 'Within 90 days of dissolution', result: '≤ 14 days after polls close', color: 'text-amber-400' },
  { scenario: 'Casual vacancy', article: 'Art. 25(3)', window: 'Within 60 days of vacancy (if > 120 days before term end)', result: 'Not specified', color: 'text-blue-400' },
]

const DISQUALIFICATIONS = [
  { ground: 'Unsound mind (court-declared)', lifted: 'Reversal of declaration', clause: 'Art. 24(2)(a)' },
  { ground: 'Undischarged insolvent', lifted: '10 years post-adjudication', clause: 'Art. 24(2)(b)' },
  { ground: 'Convicted, sentenced ≥ 2 years', lifted: '5 years after release', clause: 'Art. 24(2)(c)' },
  { ground: 'Office of profit (AJK / Pakistan service)', lifted: 'Until ceasing to hold office', clause: 'Art. 24(2)(d)' },
  { ground: 'Dismissed for misconduct', lifted: '5 years after dismissal', clause: 'Art. 24(2)(e)' },
]

const ELECTION_PATHS = [
  {
    path: 'expiry',
    label: 'Path A — Ordinary Expiry',
    borderColor: 'border-emerald-500',
    accentBg: 'bg-emerald-500',
    steps: [
      { title: '5-year term lapses', note: 'Operates as automatic dissolution — Art. 22(3)' },
      { title: 'Election Commission schedules poll', note: 'Within 60 days immediately before expiry — Art. 22(4)' },
      { title: 'Results declared', note: 'No later than 14 days before expiry date — Art. 22(4)' },
    ],
  },
  {
    path: 'dissolution',
    label: 'Path B — Dissolution',
    borderColor: 'border-amber-500',
    accentBg: 'bg-amber-500',
    steps: [
      { title: 'PM advises President to dissolve', note: 'Assembly auto-dissolves 48 hrs after advice if President delays — Art. 28(1)' },
      { title: 'Election Commission schedules poll', note: 'Within 90 days of dissolution — Art. 28(2)' },
      { title: 'Results declared', note: 'No later than 14 days after polls close — Art. 28(2)' },
    ],
  },
]

const POST_ELECTION = [
  { title: 'New Assembly convenes', note: 'Day 30 after election — Art. 13(1)' },
  { title: 'Speaker & Deputy Speaker elected', note: 'At first meeting or as soon thereafter — Art. 29' },
  { title: 'Prime Minister elected', note: 'Majority of total membership — Art. 13(3)' },
  { title: 'President elected', note: 'Within 30 days of general election — Art. 5(3-A)' },
  { title: 'Members take oath', note: 'Within 90 days of election — Art. 23 / First Schedule' },
]

const INDEPENDENCE_STRENGTHS = [
  { label: '5-year tenure protection', article: 'Art. 50(11)' },
  { label: 'Removal only via Supreme Judicial Council', article: 'Art. 42-E' },
  { label: 'Opposition consultation required before appointment', article: 'Art. 50(4)' },
  { label: 'All executive authorities must assist the Commission', article: 'Art. 50(18)' },
  { label: "CEC's disqualification opinion is constitutionally final", article: 'Art. 25(2)' },
]

const INDEPENDENCE_GAPS = [
  { label: "Commissioner appointed on advice of Pakistan's PM — federal executive influence", article: 'Art. 50(3)' },
  { label: "Members appointed on AJK PM's advice — ruling party influence", article: 'Art. 50(6)' },
  { label: 'Staff rules require PM advice until Assembly legislates otherwise', article: 'Art. 50(19)' },
  { label: 'No dedicated ring-fenced Commission budget in Consolidated Fund', article: 'Art. 37-A' },
  { label: 'Missed deadlines do not invalidate acts — removes enforcement mechanism', article: 'Art. 56-A' },
  { label: 'Core electoral rules delegated to subordinate legislation', article: 'Art. 22(2)' },
]

type Tab = 'assembly' | 'elections' | 'commission'

export default function Constitution() {
  const [tab, setTab] = useState<Tab>('assembly')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'assembly', label: 'Legislative Assembly' },
    { id: 'elections', label: 'Election Procedure' },
    { id: 'commission', label: 'Election Commission' },
  ]

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1 font-display">Constitutional Framework</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        AJK Interim Constitution 1974 · Legislative Assembly &amp; General Elections ·
        All citations reference the primary text.
      </p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={
              tab === t.id
                ? { color: 'var(--text)', borderBottom: '2px solid var(--text)', marginBottom: '-1px' }
                : { color: 'var(--muted)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Assembly ── */}
      {tab === 'assembly' && (
        <div className="space-y-6 max-w-4xl">

          <div className="card">
            <div className="flex items-baseline gap-3 mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Assembly Composition</h3>
              <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>Art. 22(1)</span>
              <span className="ml-auto text-2xl font-bold font-display" style={{ color: 'var(--text)' }}>53</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>total seats</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                    <th className="text-left pb-2 pr-4">Category</th>
                    <th className="text-center pb-2 px-4">Seats</th>
                    <th className="text-left pb-2 pl-4">Electoral Method</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPOSITION.map(row => (
                    <tr key={row.category} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-2 pr-4" style={{ color: 'var(--text3)' }}>{row.category}</td>
                      <td className="py-2 px-4 text-center font-bold" style={{ color: 'var(--text)' }}>{row.seats}</td>
                      <td className="py-2 pl-4 text-xs" style={{ color: 'var(--muted)' }}>{row.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              Term: 5 years from date of first meeting. Expiry operates as dissolution — Art. 22(3).
              Women, Ulema, Overseas, and Technocrat seats are elected by the 45 directly elected members only.
            </p>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>
              Qualifications &amp; Disqualifications{' '}
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: 'var(--muted)' }}>Art. 24</span>
            </h3>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--muted)' }}>To qualify, a candidate must:</p>
              <ul className="space-y-1 text-sm">
                {[
                  { condition: 'Be a State Subject', clause: 'Art. 24(1)(a)' },
                  { condition: 'Be at least 25 years of age', clause: 'Art. 24(1)(b)' },
                  { condition: 'Have name on electoral roll (AJK or Pakistan)', clause: 'Art. 24(1)(c)' },
                ].map(q => (
                  <li key={q.clause} className="flex justify-between">
                    <span style={{ color: 'var(--text3)' }}>{q.condition}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{q.clause}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--muted)' }}>Disqualifying grounds:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs" style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                      <th className="text-left pb-1 pr-4">Ground</th>
                      <th className="text-left pb-1 px-4">Lifted after</th>
                      <th className="text-right pb-1 pl-4">Clause</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DISQUALIFICATIONS.map(d => (
                      <tr key={d.clause} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2 pr-4" style={{ color: 'var(--text3)' }}>{d.ground}</td>
                        <td className="py-2 px-4 text-xs" style={{ color: 'var(--muted)' }}>{d.lifted}</td>
                        <td className="py-2 pl-4 text-right text-xs font-mono" style={{ color: 'var(--muted)' }}>{d.clause}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-3" style={{ color: 'var(--text)' }}>
              Seat Vacation Rules{' '}
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: 'var(--muted)' }}>Art. 25</span>
            </h3>
            <ul className="text-sm space-y-1.5 list-disc list-inside" style={{ color: 'var(--text3)' }}>
              <li>Written resignation to Speaker — Art. 25(1)(a)</li>
              <li>Absent without leave for <strong style={{ color: 'var(--text)' }}>30 consecutive sitting days</strong> — Art. 25(1)(b)</li>
              <li>Failure to take oath within <strong style={{ color: 'var(--text)' }}>90 days</strong> of election (extendable by Speaker for good cause) — Art. 25(1)(c)</li>
              <li>Election to Council membership — Art. 25(1)(d)</li>
              <li>Multi-seat: must resign all but one within <strong style={{ color: 'var(--text)' }}>30 days</strong> of last result — Art. 25(1-A)</li>
            </ul>
            <div className="mt-3 p-3 rounded text-xs" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>Disqualification disputes:</span> Speaker refers to
              Chief Election Commissioner. CEC opinion is{' '}
              <span className="text-amber-400">constitutionally final</span> — no judicial review prescribed. Art. 25(2).
            </div>
          </div>

        </div>
      )}

      {/* ── Tab: Elections ── */}
      {tab === 'elections' && (
        <div className="space-y-6 max-w-4xl">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIMELINES.map(t => (
              <div key={t.scenario} className="card">
                <p className={`text-xs font-semibold uppercase mb-1 ${t.color}`}>{t.scenario}</p>
                <p className="text-xs font-mono mb-2" style={{ color: 'var(--muted)' }}>{t.article}</p>
                <p className="text-sm mb-1" style={{ color: 'var(--text3)' }}>
                  <span style={{ color: 'var(--muted)' }}>Poll window: </span>{t.window}
                </p>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>
                  <span style={{ color: 'var(--muted)' }}>Results: </span>{t.result}
                </p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Step-by-Step Procedure</h3>

            {/* Two paths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {ELECTION_PATHS.map(path => (
                <div key={path.path} className={`border-l-2 ${path.borderColor} pl-4`}>
                  <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--text3)' }}>{path.label}</p>
                  <div className="space-y-3">
                    {path.steps.map((s, i) => (
                      <div key={i} className="flex gap-3">
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full ${path.accentBg} text-xs font-bold text-white flex items-center justify-center`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm" style={{ color: 'var(--text)' }}>{s.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Merge */}
            <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)' }}>Both paths converge here</p>
              <div className="space-y-3">
                {POST_ELECTION.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                          style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>
                      {i + 4}
                    </span>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>{s.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'rgba(153,27,27,0.4)' }}>
            <p className="text-xs font-semibold text-red-400 uppercase mb-1">Constitutional gap — Art. 56-A</p>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>
              Failure to act within any prescribed period does{' '}
              <strong style={{ color: 'var(--text)' }}>not</strong> invalidate the act itself. All mandatory
              timelines above are therefore unenforceable in court — political convention is the only
              practical mechanism for compliance.
            </p>
          </div>

        </div>
      )}

      {/* ── Tab: Commission ── */}
      {tab === 'commission' && (
        <div className="space-y-6 max-w-4xl">

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>
              Election Commission Composition{' '}
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: 'var(--muted)' }}>Art. 50</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                {[
                  { label: 'Chief Election Commissioner', value: '1' },
                  { label: 'Members', value: '2' },
                  { label: 'Term', value: '5 years' },
                  { label: 'Removal', value: 'Art. 42-E (SJC only)' },
                  { label: 'Qualification', value: 'Former Judge (SC/HC) or BPS-21+ civil servant' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between gap-4">
                    <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                    <span className="text-right" style={{ color: 'var(--text3)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Commissioner appointed by</p>
                  <p style={{ color: 'var(--text3)' }}>President on advice of AJK Council Chairman (= PM of Pakistan) — Art. 50(3)</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Members appointed by</p>
                  <p style={{ color: 'var(--text3)' }}>President on advice of AJK Prime Minister — Art. 50(6)</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Opposition check</p>
                  <p style={{ color: 'var(--text3)' }}>AJK PM must consult Leader of Opposition before nominating Commissioner — Art. 50(4). Advisory only.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <p className="text-xs font-semibold text-emerald-400 uppercase mb-3">Independence strengths</p>
              <ul className="space-y-2">
                {INDEPENDENCE_STRENGTHS.map(s => (
                  <li key={s.article} className="flex justify-between gap-2">
                    <span className="text-sm" style={{ color: 'var(--text3)' }}>{s.label}</span>
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--muted)' }}>{s.article}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ borderColor: 'rgba(153,27,27,0.3)' }}>
              <p className="text-xs font-semibold text-red-400 uppercase mb-3">Structural gaps</p>
              <ul className="space-y-2">
                {INDEPENDENCE_GAPS.map(g => (
                  <li key={g.article} className="flex justify-between gap-2">
                    <span className="text-sm" style={{ color: 'var(--text3)' }}>{g.label}</span>
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--muted)' }}>{g.article}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>Critical Analysis</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
              The Election Commission has constitutionally adequate{' '}
              <span style={{ color: 'var(--text)' }}>formal</span> independence — tenure protection, oath
              requirements, and mandatory executive assistance. However, its{' '}
              <span style={{ color: 'var(--text)' }}>structural</span> independence is compromised: the
              appointment chain runs through the federal Pakistani executive (Commissioner) and the
              sitting AJK government (Members). The Opposition consultation under Art. 50(4) is
              advisory only — not a veto. The absence of a ring-fenced Commission budget and the
              delegation of core electoral rules to subordinate legislation mean that operational
              independence depends on political convention rather than hard constitutional
              architecture. Art. 56-A compounds this by removing legal consequences for deadline
              violations.
            </p>
          </div>

        </div>
      )}
    </Layout>
  )
}
