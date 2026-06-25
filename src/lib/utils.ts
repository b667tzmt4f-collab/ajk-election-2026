// ─────────────────────────────────────────────────────────────────────────────
// lib/utils.ts — shared utility functions used across all pages.
// Import from here instead of redefining per-file.
// ─────────────────────────────────────────────────────────────────────────────

// Numeric sort for constituency IDs (e.g. LA-1, LA-2 ... LA-45).
// String sort produces wrong order: LA-1, LA-10, LA-11 ... LA-2.
export const numSort = (a: string, b: string) =>
  parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])
