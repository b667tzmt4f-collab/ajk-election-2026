// ─────────────────────────────────────────────────────────────────────────
// src/lib/neon.ts   (SERVER-ONLY)
//
// Connects to the Neon database using DATABASE_URL from .env.local
// (and from Vercel's environment variables once deployed).
//
// ⚠️ Only import this file from files inside src/pages/api/.
//    DATABASE_URL is a secret; it must never reach the browser.
// ─────────────────────────────────────────────────────────────────────────
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add it to .env.local (and to Vercel).')
}

// `sql` sends one query over HTTPS per call. Ideal for Vercel serverless:
// no open connections to manage, no connection-limit problems at peak traffic.
export const sql = neon(process.env.DATABASE_URL)
