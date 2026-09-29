// ─────────────────────────────────────────────────────────────────────────
// src/lib/adminAuth.ts   (SERVER-ONLY)
//
// requireAdmin(req, res) → true if the caller is logged in with Clerk AND
// their email is listed in ADMIN_EMAILS (comma-separated env var).
// Otherwise it sends 401/403 and returns false.
//
// Usage inside an API route:
//     if (!(await requireAdmin(req, res))) return
// ─────────────────────────────────────────────────────────────────────────
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth, clerkClient } from '@clerk/nextjs/server'

function adminList(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function requireAdmin(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ error: 'Not logged in' })
    return false
  }

  const allowed = adminList()
  if (allowed.length === 0) {
    // Fail closed: a missing env var must never mean "everyone is admin".
    console.error('[adminAuth] ADMIN_EMAILS is empty; refusing all writes')
    res.status(500).json({ error: 'Server admin list not configured' })
    return false
  }

  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const emails = user.emailAddresses.map((e) => e.emailAddress.toLowerCase())
    if (!emails.some((e) => allowed.includes(e))) {
      res.status(403).json({ error: 'This account is not allowed to make changes' })
      return false
    }
    return true
  } catch (err) {
    console.error('[adminAuth] Clerk lookup failed:', err)
    res.status(500).json({ error: 'Could not verify login' })
    return false
  }
}
