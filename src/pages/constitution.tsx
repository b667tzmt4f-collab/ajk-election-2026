import { useState } from 'react'
import Layout from '@/components/Layout'
import DevNote from '@/components/DevNote'

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

const EC_FACTS = [
  { label: 'Chief Election Commissioner', value: '1' },
  { label: 'Members', value: '2' },
  { label: 'Term', value: '5 years' },
  { label: 'Removal', value: 'Supreme Judicial Council only — Art. 42-E' },
  { label: 'Qualification', value: 'Former Judge (SC/HC) or BPS-21+ civil servant' },
]

const EC_APPOINTMENT = [
  { role: 'Chief Election Commissioner', appointer: 'President on advice of AJK Council Chairman (PM of Pakistan)', article: 'Art. 50(3)' },
  { role: 'Members (×2)', appointer: 'President on advice of AJK Prime Minister', article: 'Art. 50(6)' },
]

const EC_POWERS = [
  { power: 'Superintendence, direction and control of all elections', article: 'Art. 50(1)' },
  { power: 'Delimitation of constituencies', article: 'Art. 51' },
  { power: 'Preparation and revision of electoral rolls', article: 'Art. 22(2)' },
  { power: 'Final opinion on member disqualification — binding on Speaker', article: 'Art. 25(2)' },
  { power: 'All executive authorities must assist the Commission', article: 'Art. 50(18)' },
]

type Tab = 'assembly' | 'elections' | 'commission'

export default function Constitution() {
  const [tab, setTab] = useState<Tab>('assembly')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'assembly', label: 'Legislative Assembly' },
    { id: 'elections', label: 'General Elections' },
    { id: 'commission', label: 'Election Commission' },
  ]

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-1 font-display">      <DevNote type="extra" label="Consider removing this page entirely">
        Analytics platform doesn't need to host constitutional text — publicly available
        elsewhere. Already removed from nav. Consider removing or reducing to a paragraph
        in Methodology.
      </DevNote>
Constitutional Framework</h2>
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
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Seat Composition</h3>
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
              Membership Qualifications
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: 'var(--muted)' }}>Art. 24</span>
            </h3>
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--muted)' }}>A candidate must:</p>
            <ul className="space-y-1.5 text-sm">
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

          <div className="card">
            <h3 className="font-bold mb-3" style={{ color: 'var(--text)' }}>
              Seat Vacation
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: 'var(--muted)' }}>Art. 25</span>
            </h3>
            <ul className="text-sm space-y-1.5 list-disc list-inside" style={{ color: 'var(--text3)' }}>
              <li>Written resignation to Speaker — Art. 25(1)(a)</li>
              <li>Absent without leave for <strong style={{ color: 'var(--text)' }}>30 consecutive sitting days</strong> — Art. 25(1)(b)</li>
              <li>Failure to take oath within <strong style={{ color: 'var(--text)' }}>90 days</strong> of election — Art. 25(1)(c)</li>
              <li>Election to Council membership — Art. 25(1)(d)</li>
              <li>Elected to multiple seats: must resign all but one within <strong style={{ color: 'var(--text)' }}>30 days</strong> of last result — Art. 25(1-A)</li>
            </ul>
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
                  <span style={{ color: 'var(--muted)' }}>Results by: </span>{t.result}
                </p>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Election Procedure</h3>

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

            <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--muted)' }}>Post-election steps — both paths</p>
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

        </div>
      )}

      {/* ── Tab: Commission ── */}
      {tab === 'commission' && (
        <div className="space-y-6 max-w-4xl">

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>
              Composition
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: 'var(--muted)' }}>Art. 50</span>
            </h3>
            <div className="space-y-2 text-sm">
              {EC_FACTS.map(r => (
                <div key={r.label} className="flex justify-between gap-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                  <span className="text-right" style={{ color: 'var(--text3)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>
              Appointment Chain
              <span className="text-xs font-normal ml-2 font-mono" style={{ color: 'var(--muted)' }}>Art. 50(3)(4)(6)</span>
            </h3>
            <div className="space-y-4 text-sm">
              {EC_APPOINTMENT.map(a => (
                <div key={a.role}>
                  <div className="flex justify-between mb-0.5">
                    <span className="font-medium" style={{ color: 'var(--text)' }}>{a.role}</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{a.article}</span>
                  </div>
                  <p style={{ color: 'var(--text3)' }}>{a.appointer}</p>
                </div>
              ))}
              <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Before nominating the Commissioner, the AJK PM must consult the Leader of the Opposition — Art. 50(4).
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>
              Powers &amp; Functions
            </h3>
            <ul className="space-y-2">
              {EC_POWERS.map(p => (
                <li key={p.article} className="flex justify-between gap-4 text-sm" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text3)' }}>{p.power}</span>
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--muted)' }}>{p.article}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </Layout>
  )
}
