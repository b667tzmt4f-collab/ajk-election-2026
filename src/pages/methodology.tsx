import Layout from '@/components/Layout'

export default function Methodology() {
  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-2">ℹ️ Methodology</h2>
      <p className="text-sm text-gray-400 mb-6">
        AJK Election Analytics Platform · Version 1.0 · June 2026 ·
        Independent · Not affiliated with any party, government, or media organisation.
      </p>

      <div className="space-y-6 max-w-3xl">
        <div className="card">
          <h3 className="font-bold text-white mb-2">Four-Stage Pipeline</h3>
          <p className="text-sm text-gray-400">
            Per-seat analysis is the output of a four-stage pipeline: (1) Historical
            evidence base — official EC results for 2021, 2016, and 2011. (2) Field
            survey — voting intention and sentiment instrument, 450–675 respondents
            stratified by region and gender (not yet fielded). (3) Six-pillar KPI
            rubric — Ground organisation 30%, Historical baseline 20%, Religious &
            sectarian dynamics 15%, Structural factors 15%, Candidate strength 15%,
            Social-media signal 5%. (4) Cross-verification — independent LLM jury
            (Claude, GPT-4, Gemini) plus manual adjudication against EC candidate list
            and Pakistani press coverage.
          </p>
        </div>

        <div className="card">
          <h3 className="font-bold text-white mb-2">Data Sources</h3>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>2021 GE: Official AJK EC booklet (25 July 2021) + post-tribunal gazette.
              LA-15: PPP by-election 2023. LA-35: PML-N recount 2024.</li>
            <li>2011 & 2016: PPP-compiled document (Amar Zeeshan Jaral, Secretary
              Coordination PPP AJK). 35/45 seats cross-verified.</li>
            <li>2026 voter rolls: EC notification EC/S/12890-13062/2026, 22 May 2026.</li>
            <li>2022 LG results: AJK local body elections by tier and district.</li>
            <li>2026 candidates: Based on 2021 EC data. PTI candidates shown as
              IND (ex-PTI). Will be updated when EC publishes the 2026 final list.</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="font-bold text-white mb-2">Live Results Architecture</h3>
          <p className="text-sm text-gray-400">
            Live results are stored in a Supabase PostgreSQL database with real-time
            WebSocket subscriptions. Viewers see vote counts update the instant a
            data-entry team member saves a result — no polling, no page refresh.
            Only authenticated users can write results. All writes are logged with
            a timestamp and user identifier for auditability.
          </p>
        </div>

        <div className="card">
          <h3 className="font-bold text-white mb-2">Independence Statement</h3>
          <p className="text-sm text-gray-400">
            This is an independent, data-driven analytical platform published for
            public reference. It is not affiliated with any political party,
            government body, or media organisation. All source documents are cited
            above. The platform publishes its methodology openly so that every
            figure can be audited against its inputs.
          </p>
        </div>
      </div>
    </Layout>
  )
}
