import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// ── Types ────────────────────────────────────────────────────────────────────

export type Constituency = {
  seat_id: string
  seat_name: string
  region: string
  refugee_bloc: string
  registered_2021: number
  registered_male_2021: number
  registered_female_2021: number
  polled_2021: number
  turnout_pct_2021: number
  winner_2021: string
  winner_party_2021: string
  winner_votes_2021: number
  runner_2021: string
  runner_party_2021: string
  runner_votes_2021: number
  margin_2021: number
  registered_2026: number
  registered_male_2026: number
  registered_female_2026: number
}

export type Candidate = {
  id: number
  seat_id: string
  candidate_name: string
  party_2021: string | null
  party_2026: string
  votes_2021: number | null
  rank_2021: number | null
  votes_2026: number
  updated_at: string
  ticket_status: 'declared' | 'confirmed' | 'withdrawn' | 'rejected'
  ticket_source: string | null
  ticket_updated_at: string
}

export const PARTY_COLORS: Record<string, string> = {
  'PTI':          '#E4002B',
  'IND (ex-PTI)': '#FF6B35',
  'PPP':          '#0A0A8C',
  'PML-N':        '#1B7A43',
  'AJKMC':        '#F2A900',
  'JKPP':         '#6A0DAD',
  'Independent':  '#888780',
  'TLP':          '#1C1C1C',
  'JI':           '#004D40',
  'Other':        '#AAAAAA',
}

export function partyColor(party: string): string {
  for (const [key, col] of Object.entries(PARTY_COLORS)) {
    if (party?.startsWith(key.slice(0, 6))) return col
  }
  return '#AAAAAA'
}

export type ElectionHistory = {
  id: number
  seat_id: string
  seat_name: string
  division: string
  region_type: string
  election_year: number
  winner: string
  winner_party: string
  winner_votes: number
  runner_up: string
  runner_up_party: string
  runner_up_votes: number
  total_votes_polled: number
  margin_votes: number
  notes: string
}
