import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ── Fonts ─────────────────────────────────────────────────────
            Loaded here (not in globals.css) so the browser gets the
            preconnect hint early and avoids flash of unstyled text.
            ────────────────────────────────────────────────────────── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
        />

        {/* ── Favicon ───────────────────────────────────────────────── */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* ── Default SEO meta ──────────────────────────────────────── */}
        <meta name="description"
          content="Independent data-driven analytics for the AJK General Election 2026. Live results, projections, voter demography and historical records across all 45 constituencies." />
        <meta name="author" content="ApexInsights" />
        <meta name="robots" content="index, follow" />

        {/* ── Open Graph (WhatsApp, Facebook, LinkedIn previews) ────── */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AJK Election Analytics" />
        <meta property="og:title" content="AJK Election Analytics 2026 — ApexInsights" />
        <meta property="og:description"
          content="Independent data-driven analytics for the AJK General Election 2026. Live results, projections, voter demography and historical records across all 45 constituencies." />
        <meta property="og:url" content="https://apexinsights.live" />
        <meta property="og:image" content="https://apexinsights.live/og-image.png" />

        {/* ── Twitter/X card ────────────────────────────────────────── */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AJK Election Analytics 2026 — ApexInsights" />
        <meta name="twitter:description"
          content="Independent analytics platform for AJK GE 2026. Live results, projections and historical records." />
        <meta name="twitter:image" content="https://apexinsights.live/og-image.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}