// ─────────────────────────────────────────────────────────────────────────
// src/lib/tally.ts   (BROWSER-SAFE, shared seat-tally logic)
//
// One place for the 2026 seat-type split so every page computes it the
// same way:  house = directly elected (general) + reserved.
// Used by: index.tsx (homepage band), records.tsx (Party Tallies).
// Structural constants come from the constitution / delimitation, not results.
// ─────────────────────────────────────────────────────────────────────────

export const TOTAL_GENERAL  = 45
export const TOTAL_RESERVED = 8
export const HOUSE_TOTAL    = TOTAL_GENERAL + TOTAL_RESERVED // 53
export const GENERAL_MAJORITY = 23 // simple majority of 45
export const HOUSE_MAJORITY   = 27 // simple majority of 53

export type SeatMode = 'all' | 'general' | 'reserved'

export const SEAT_MODE_LABEL: Record<SeatMode, string> = {
  all:      `All seats (${HOUSE_TOTAL})`,
  general:  `Directly elected (${TOTAL_GENERAL})`,
  reserved: `Reserved (${TOTAL_RESERVED})`,
}

/** Row shape of the reserved_seats_2026 table. */
export type ReservedRow = {
  id: number; category: string; member: string; party: string; source: string | null
}

/** Count rows per key, e.g. seats per party. */
export function countBy<T>(rows: T[], key: (r: T) => string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const r of rows) out[key(r)] = (out[key(r)] || 0) + 1
  return out
}

/** Add two tallies party by party (general + reserved = house). */
export function addTallies(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a }
  for (const [p, n] of Object.entries(b)) out[p] = (out[p] || 0) + n
  return out
}

/** Pick the tally for a seat mode. */
export function tallyFor(mode: SeatMode, general: Record<string, number>, reserved: Record<string, number>) {
  if (mode === 'general')  return general
  if (mode === 'reserved') return reserved
  return addTallies(general, reserved)
}

/** Denominator and majority line for a seat mode (reserved has no majority). */
export function scaleFor(mode: SeatMode): { total: number; majority: number | null } {
  if (mode === 'general')  return { total: TOTAL_GENERAL, majority: GENERAL_MAJORITY }
  if (mode === 'reserved') return { total: TOTAL_RESERVED, majority: null }
  return { total: HOUSE_TOTAL, majority: HOUSE_MAJORITY }
}

/** Largest party as [party, seats], or undefined for an empty tally. */
export const topOf = (t: Record<string, number>) =>
  Object.entries(t).sort((a, b) => b[1] - a[1])[0] as [string, number] | undefined

/** Sorted [party, seats] entries, largest first. */
export const sortedEntries = (t: Record<string, number>) =>
  Object.entries(t).sort((a, b) => b[1] - a[1])
