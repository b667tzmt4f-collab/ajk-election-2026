// ─────────────────────────────────────────────────────────────────────────
// src/middleware.ts
//
// Lets Clerk read the login cookie on every request, so our API routes
// can ask "who is this?" with getAuth(req). It does NOT block any page;
// public pages stay public. Protection happens inside each admin API
// route (see src/lib/adminAuth.ts).
// ─────────────────────────────────────────────────────────────────────────
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|geojson)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
