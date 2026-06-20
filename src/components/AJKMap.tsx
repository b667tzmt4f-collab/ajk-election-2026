import { useMemo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// AJKMap — renders the 10 AJK districts as filled SVG polygons from a GeoJSON
// file in /public. Pure SVG projection (no map library, no tiles, works offline).
// Each district is shaded by a caller-supplied colour + value, with a label and
// optional HIGHEST/LOWEST badges, echoing the old matplotlib choropleth style.
// ─────────────────────────────────────────────────────────────────────────────

export type DistrictDatum = {
  fill: string          // hex colour for the district fill
  label: string         // primary line (district name)
  value?: string        // optional second line (e.g. "PTI · 3 seats")
}

type GeoFeature = {
  properties: { district: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
}
type GeoJSON = { features: GeoFeature[] }

const MISSING = 'var(--bg3)'
const W = 600   // viewBox width; height derived from data aspect

// Pull every [lon,lat] ring out of a feature, normalising Polygon/MultiPolygon.
function ringsOf(f: GeoFeature): number[][][] {
  if (f.geometry.type === 'Polygon') return f.geometry.coordinates as number[][][]
  // MultiPolygon: flatten one level
  return (f.geometry.coordinates as number[][][][]).flat()
}

export default function AJKMap({
  geo,
  data,
  highlight,
  onSelect,
}: {
  geo: GeoJSON | null
  data: Record<string, DistrictDatum>
  highlight?: { district: string; tag: string; color: string }[]
  onSelect?: (district: string) => void
}) {
  const projected = useMemo(() => {
    if (!geo) return null

    // bounds across all coordinates
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const f of geo.features)
      for (const ring of ringsOf(f))
        for (const [x, y] of ring) {
          if (x < minX) minX = x; if (x > maxX) maxX = x
          if (y < minY) minY = y; if (y > maxY) maxY = y
        }

    // mercator-ish latitude stretch so the shape isn't squashed
    const latMid = (minY + maxY) / 2
    const kx = 1
    const ky = 1 / Math.cos((latMid * Math.PI) / 180)

    const spanX = (maxX - minX) * kx
    const spanY = (maxY - minY) * ky
    const scale = W / spanX
    const H = spanY * scale

    // lon/lat → svg x,y (y flipped: north is up)
    const project = (x: number, y: number): [number, number] => [
      (x - minX) * kx * scale,
      H - (y - minY) * ky * scale,
    ]

    const shapes = geo.features.map((f) => {
      const name = f.properties.district
      const paths = ringsOf(f).map((ring) =>
        ring.map(([x, y]) => project(x, y).join(',')).join(' ')
      )
      // label point = centroid of the largest ring
      const big = ringsOf(f).reduce((a, b) => (a.length > b.length ? a : b))
      let cx = 0, cy = 0
      for (const [x, y] of big) { cx += x; cy += y }
      const [lx, ly] = project(cx / big.length, cy / big.length)
      return { name, paths, lx, ly }
    })

    return { shapes, H }
  }, [geo])

  if (!projected) {
    return (
      <div className="flex items-center justify-center h-96"
           style={{ color: 'var(--text3)' }}>
        Loading map…
      </div>
    )
  }

  const badgeFor = (name: string) =>
    highlight?.find((h) => h.district === name)

  return (
    <svg viewBox={`0 0 ${W} ${projected.H}`} className="w-full h-auto"
         style={{ maxHeight: '78vh' }} role="img" aria-label="Map of AJK districts">
      {projected.shapes.map((sh) => {
        const datum = data[sh.name]
        const fill = datum?.fill ?? MISSING
        const badge = badgeFor(sh.name)
        return (
          <g key={sh.name}
             onClick={() => onSelect?.(sh.name)}
             style={{ cursor: onSelect ? 'pointer' : 'default' }}>
            {sh.paths.map((d, i) => (
              <polygon key={i} points={d}
                fill={fill} stroke="#ffffff" strokeWidth={1.2}
                strokeLinejoin="round" />
            ))}
            <text x={sh.lx} y={sh.ly} textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none', fontSize: 12, fontWeight: 700 }}
                  fill="#ffffff" stroke="rgba(0,0,0,0.35)" strokeWidth={0.4}
                  paintOrder="stroke">
              {sh.name}
            </text>
            {datum?.value && (
              <text x={sh.lx} y={sh.ly + 14} textAnchor="middle"
                    style={{ pointerEvents: 'none', fontSize: 9.5, fontWeight: 600 }}
                    fill="#ffffff" stroke="rgba(0,0,0,0.35)" strokeWidth={0.3}
                    paintOrder="stroke">
                {datum.value}
              </text>
            )}
            {badge && (
              <text x={sh.lx} y={sh.ly - 16} textAnchor="middle"
                    style={{ pointerEvents: 'none', fontSize: 9, fontWeight: 800 }}
                    fill={badge.color}>
                {badge.tag}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
