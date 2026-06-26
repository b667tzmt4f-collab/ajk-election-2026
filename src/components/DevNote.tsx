/**
 * DevNote — inline editorial annotation component.
 *
 * Renders ONLY when NEXT_PUBLIC_DEV_NOTES=true is set in .env.local
 * Completely invisible on production (apexinsights.live).
 *
 * Usage:
 *   <DevNote type="missing" label="Source citation required">
 *     Add official EC source reference below this table.
 *   </DevNote>
 *
 * Types:
 *   missing  — red    — something that needs to be added
 *   extra    — amber  — something that may need to be removed
 *   data     — blue   — data quality / accuracy issue
 *   action   — purple — requires a specific action before launch
 */

import { useState } from 'react'

type NoteType = 'missing' | 'extra' | 'data' | 'action'

const STYLES: Record<NoteType, { bg: string; border: string; label: string; icon: string }> = {
  missing: { bg: '#fff1f2', border: '#f4566f', label: 'MISSING',  icon: '✕' },
  extra:   { bg: '#fffbeb', border: '#e8902a', label: 'EXTRA',    icon: '!' },
  data:    { bg: '#eff6ff', border: '#2e5bd8', label: 'DATA',     icon: 'i' },
  action:  { bg: '#faf5ff', border: '#9333ea', label: 'ACTION',   icon: '→' },
}

// Dark mode overrides
const STYLES_DARK: Record<NoteType, { bg: string }> = {
  missing: { bg: '#2a1215' },
  extra:   { bg: '#2a1f0a' },
  data:    { bg: '#0f1e3a' },
  action:  { bg: '#1e0f3a' },
}

interface DevNoteProps {
  type: NoteType
  label?: string
  children: React.ReactNode
}

export default function DevNote({ type, label, children }: DevNoteProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Gate: only render when NEXT_PUBLIC_DEV_NOTES=true
  if (process.env.NEXT_PUBLIC_DEV_NOTES !== 'true') return null

  const s = STYLES[type]

  return (
    <div
      style={{
        border: `2px dashed ${s.border}`,
        borderRadius: 10,
        marginBottom: 16,
        overflow: 'hidden',
        fontFamily: 'IBM Plex Mono, monospace',
      }}>
      {/* Header bar */}
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          backgroundColor: s.border,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 12px',
          cursor: 'pointer',
          userSelect: 'none',
        }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {s.icon}
        </span>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.1em' }}>
          {s.label}{label ? ` — ${label}` : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
          {collapsed ? '▼ show' : '▲ hide'}
        </span>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{
          backgroundColor: s.bg,
          padding: '10px 14px',
          fontSize: 12,
          lineHeight: 1.6,
          color: '#1a1a1a',
        }}>
          {children}
        </div>
      )}
    </div>
  )
}
