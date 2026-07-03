import { useMemo } from 'react'
import { partyColor } from '@/lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// AJKConstituencyMap v3 — dual-layer SVG map of AJK.
//
// Coordinate system: W=500, H=692 (same projection as original AJKMap.tsx).
// Constituency polygon centroids derived from the rendered screenshot:
//   pixel positions read from the live render → converted to SVG coordinates
//   via (px/screenshotW)*500, (py/screenshotH)*692.
// Polygons are approximate hexagons sized to reflect relative constituency
// area from the official EC delimitation map.
//
// Layers:
//   1. District GeoJSON polygons (shaded by dominant 2021 party)
//   2. Constituency hexagons (transparent fill, white border, red LA-N label)
//   3. District callout boxes (dot → leader line → label rect)
// ─────────────────────────────────────────────────────────────────────────────

export type DistrictDatum = {
  fill: string
  label: string
  value?: string
}

type GeoFeature = {
  properties: { district: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
}
type GeoJSON = { features: GeoFeature[] }

const W = 500
const H = 692

// ── District callout boxes ────────────────────────────────────────────────────
// bx,by = top-left of label rect (88×22px)
// ax,ay = anchor dot position on the district (near centroid)
// Anchor points from computed district centroids:
//   Muzaffarabad(37,241) Neelum(224,114) Jhelum Valley(97,270)
//   Bagh(81,340) Haveli(161,351) Poonch(111,394) Sudhnoti(91,417)
//   Kotli(91,477) Mirpur(78,564) Bhimber(190,637)
const DISTRICT_CALLOUT: Record<string, { bx: number; by: number; ax: number; ay: number }> = {
  'Neelum':         { bx: 358, by:  12, ax: 224, ay:  80  },
  'Muzaffarabad':   { bx:   8, by: 228, ax:  60, ay: 265  },
  'Jhelum Valley':  { bx: 340, by: 248, ax: 245, ay: 290  },
  'Bagh':           { bx:   8, by: 348, ax:  81, ay: 371  },
  'Haveli':         { bx: 340, by: 340, ax: 283, ay: 370  },
  'Poonch':         { bx: 340, by: 395, ax: 280, ay: 405  },
  'Sudhnoti':       { bx:   8, by: 428, ax:  91, ay: 437  },
  'Kotli':          { bx: 340, by: 462, ax: 270, ay: 475  },
  'Mirpur':         { bx:   8, by: 524, ax:  78, ay: 538  },
  'Bhimber':        { bx: 340, by: 553, ax: 270, ay: 570  },
}

// ── 33 Constituency polygons ──────────────────────────────────────────────────
// Positions derived from live render screenshot pixel coordinates → SVG space.
const CONSTITUENCIES: {
  id: string
  district: string
  labelX: number
  labelY: number
  points: string
}[] = [
  // ── Neelum ──
  { id:'LA-25', district:'Neelum',        labelX:263.3, labelY:100.9, points:'307.7,108.4 275.2,128.9 230.8,121.4 218.9,93.4 251.4,72.9 295.8,80.4' },
  { id:'LA-26', district:'Neelum',        labelX:234.8, labelY:178.5, points:'251.8,178.5 243.3,188.9 226.3,188.9 217.8,178.5 226.3,168.1 243.3,168.1' },

  // ── Muzaffarabad ──
  { id:'LA-27', district:'Muzaffarabad',  labelX:195.1, labelY:283.1, points:'208.1,283.1 201.6,291.8 188.6,291.8 182.1,283.1 188.6,274.4 201.6,274.4' },
  { id:'LA-28', district:'Muzaffarabad',  labelX:220.2, labelY:300.6, points:'230.8,302.9 223.0,309.3 212.4,307.0 209.6,298.3 217.4,291.9 228.0,294.2' },
  { id:'LA-29', district:'Muzaffarabad',  labelX:179.0, labelY:306.4, points:'189.4,310.9 179.0,315.4 168.6,310.9 168.6,301.9 179.0,297.4 189.4,301.9' },
  { id:'LA-31', district:'Muzaffarabad',  labelX:193.6, labelY:333.3, points:'205.2,331.0 202.1,339.7 190.5,342.0 182.0,335.6 185.1,326.9 196.7,324.6' },

  // ── Jhelum Valley ──
  { id:'LA-30', district:'Jhelum Valley', labelX:234.5, labelY:300.6, points:'245.3,302.2 238.3,309.1 227.4,307.5 223.7,299.0 230.7,292.1 241.6,293.7' },
  { id:'LA-32', district:'Jhelum Valley', labelX:236.0, labelY:333.3, points:'248.0,333.3 242.0,341.1 230.0,341.1 224.0,333.3 230.0,325.5 242.0,325.5' },
  { id:'LA-33', district:'Jhelum Valley', labelX:248.3, labelY:282.6, points:'261.9,287.7 249.6,294.6 236.0,289.5 234.7,277.5 247.0,270.6 260.6,275.7' },

  // ── Bagh ──
  { id:'LA-14', district:'Bagh',          labelX:193.3, labelY:366.1, points:'211.0,363.7 204.9,376.8 187.1,379.3 175.6,368.5 181.7,355.4 199.5,352.9' },
  { id:'LA-15', district:'Bagh',          labelX:218.7, labelY:380.9, points:'231.7,380.9 225.2,389.6 212.2,389.6 205.7,380.9 212.2,372.2 225.2,372.2' },
  { id:'LA-16', district:'Bagh',          labelX:226.2, labelY:371.9, points:'237.5,375.3 228.3,381.7 217.0,378.3 214.9,368.5 224.1,362.1 235.4,365.5' },

  // ── Haveli ──
  { id:'LA-17', district:'Haveli',        labelX:270.8, labelY:380.9, points:'302.8,380.9 286.8,396.5 254.8,396.5 238.8,380.9 254.8,365.3 286.8,365.3' },

  // ── Poonch ──
  { id:'LA-22', district:'Poonch',        labelX:202.6, labelY:393.5, points:'212.9,396.6 204.5,402.4 194.2,399.3 192.3,390.4 200.7,384.6 211.0,387.7' },
  { id:'LA-21', district:'Poonch',        labelX:213.5, labelY:395.7, points:'223.3,394.3 219.9,401.8 210.1,403.2 203.7,397.1 207.1,389.6 216.9,388.2' },
  { id:'LA-20', district:'Poonch',        labelX:226.6, labelY:393.5, points:'236.4,394.9 230.0,401.0 220.2,399.6 216.8,392.1 223.2,386.0 233.0,387.4' },
  { id:'LA-18', district:'Poonch',        labelX:235.6, labelY:393.5, points:'245.9,396.6 237.5,402.4 227.2,399.3 225.3,390.4 233.7,384.6 244.0,387.7' },
  { id:'LA-19', district:'Poonch',        labelX:229.6, labelY:411.5, points:'239.6,411.5 234.6,418.4 224.6,418.4 219.6,411.5 224.6,404.6 234.6,404.6' },

  // ── Sudhnoti ──
  { id:'LA-23', district:'Sudhnoti',      labelX:204.5, labelY:428.4, points:'217.5,428.4 211.0,437.1 198.0,437.1 191.5,428.4 198.0,419.7 211.0,419.7' },
  { id:'LA-24', district:'Sudhnoti',      labelX:216.9, labelY:428.4, points:'228.7,430.1 221.0,437.8 209.2,436.1 205.1,426.7 212.8,419.0 224.6,420.7' },

  // ── Kotli ──
  { id:'LA-8',  district:'Kotli',         labelX:224.7, labelY:454.8, points:'236.7,454.8 230.7,463.5 218.7,463.5 212.7,454.8 218.7,446.1 230.7,446.1' },
  { id:'LA-9',  district:'Kotli',         labelX:241.9, labelY:454.8, points:'256.0,458.6 244.5,465.6 230.4,461.9 227.8,451.0 239.3,444.0 253.4,447.7' },
  { id:'LA-10', district:'Kotli',         labelX:216.9, labelY:467.5, points:'228.7,465.8 224.6,475.2 212.8,476.9 205.1,469.2 209.2,459.8 221.0,458.1' },
  { id:'LA-11', district:'Kotli',         labelX:206.4, labelY:465.4, points:'218.2,467.1 210.5,474.8 198.7,473.1 194.6,463.7 202.3,456.0 214.1,457.7' },
  { id:'LA-12', district:'Kotli',         labelX:208.2, labelY:485.5, points:'220.2,485.5 214.2,494.2 202.2,494.2 196.2,485.5 202.2,476.8 214.2,476.8' },
  { id:'LA-13', district:'Kotli',         labelX:236.0, labelY:485.5, points:'249.2,489.3 238.4,496.3 225.3,492.6 222.8,481.7 233.6,474.7 246.7,478.4' },

  // ── Mirpur ──
  { id:'LA-1',  district:'Mirpur',        labelX:165.5, labelY:524.5, points:'179.6,520.4 177.0,532.2 162.9,536.3 151.4,528.6 154.0,516.8 168.1,512.7' },
  { id:'LA-2',  district:'Mirpur',        labelX:216.9, labelY:515.0, points:'232.7,517.3 222.4,527.2 206.6,525.0 201.1,512.7 211.4,502.8 227.2,505.0' },
  { id:'LA-3',  district:'Mirpur',        labelX:165.5, labelY:553.6, points:'179.3,555.5 170.3,563.9 156.5,562.0 151.7,551.7 160.7,543.3 174.5,545.2' },
  { id:'LA-4',  district:'Mirpur',        labelX:202.6, labelY:553.6, points:'216.4,551.7 211.6,562.0 197.8,563.9 188.8,555.5 193.6,545.2 207.4,543.3' },

  // ── Bhimber ──
  { id:'LA-5',  district:'Bhimber',       labelX:270.8, labelY:563.1, points:'285.8,567.5 273.6,575.9 258.5,571.5 255.8,558.7 268.0,550.3 283.1,554.7' },
  { id:'LA-6',  district:'Bhimber',       labelX:241.9, labelY:538.8, points:'254.7,536.9 250.3,547.2 237.5,549.1 229.1,540.7 233.5,530.4 246.3,528.5' },
  { id:'LA-7',  district:'Bhimber',       labelX:216.9, labelY:577.9, points:'229.7,579.8 221.3,588.2 208.5,586.3 204.1,576.0 212.5,567.6 225.3,569.5' },
]

function ringsOf(f: GeoFeature): number[][][] {
  if (f.geometry.type === 'Polygon') return f.geometry.coordinates as number[][][]
  return (f.geometry.coordinates as number[][][][]).flat()
}

// Identical projection to original AJKMap.tsx: W=500, scale=W/spanX, no padding
function buildProjection(geo: GeoJSON) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const f of geo.features)
    for (const ring of ringsOf(f))
      for (const [x, y] of ring) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
      }
  const latMid = (minY + maxY) / 2
  const kx = 1, ky = 1 / Math.cos((latMid * Math.PI) / 180)
  const spanX = (maxX - minX) * kx, spanY = (maxY - minY) * ky
  const scale = W / spanX
  const projH = spanY * scale
  const project = (x: number, y: number): [number, number] => [
    (x - minX) * kx * scale,
    projH - (y - minY) * ky * scale,
  ]
  return { project }
}

export default function AJKConstituencyMap({
  geo,
  districtData,
  onSelectDistrict,
  onSelectConstituency,
  selectedDistrict,
  selectedConstituency,
}: {
  geo: GeoJSON | null
  districtData: Record<string, DistrictDatum>
  onSelectDistrict: (district: string) => void
  onSelectConstituency: (seatId: string) => void
  selectedDistrict: string | null
  selectedConstituency: string | null
}) {
  const districtShapes = useMemo(() => {
    if (!geo) return []
    const { project } = buildProjection(geo)
    return geo.features.map((f) => ({
      name: f.properties.district,
      paths: ringsOf(f).map((ring) =>
        ring.map(([x, y]) => project(x, y).join(',')).join(' ')
      ),
    }))
  }, [geo])

  if (!geo) {
    return (
      <div className="flex items-center justify-center h-96" style={{ color: 'var(--text3)' }}>
        Loading map…
      </div>
    )
  }

  const BOX_W = 94, BOX_H = 22

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      style={{ maxHeight: '82vh' }}
      role="img"
      aria-label="AJK constituency and district map"
    >
      <defs>
        <filter id="cshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* ── Layer 1: District polygons ─────────────────────────────────────── */}
      {districtShapes.map((sh) => {
        const datum = districtData[sh.name]
        const fill = datum?.fill ?? 'var(--bg3)'
        const isSelected = selectedDistrict === sh.name
        return (
          <g key={`dist-${sh.name}`}>
            {sh.paths.map((d, i) => (
              <polygon key={i} points={d}
                fill={fill}
                fillOpacity={isSelected ? 0.95 : 0.78}
                stroke="#ffffff"
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeLinejoin="round"
                style={{ transition: 'fill-opacity 0.2s' }}
              />
            ))}
          </g>
        )
      })}

      {/* ── Layer 2: Constituency polygons (transparent + red number) ─────── */}
      {CONSTITUENCIES.map((c) => {
        const isSelected = selectedConstituency === c.id
        return (
          <g key={c.id} onClick={() => onSelectConstituency(c.id)} style={{ cursor: 'pointer' }}>
            {/* Wide invisible hit area for easy tapping on small polygons */}
            <polygon points={c.points} fill="transparent" stroke="transparent" strokeWidth={12} />
            {/* Visible polygon */}
            <polygon
              points={c.points}
              fill={isSelected ? 'rgba(44,74,124,0.25)' : 'rgba(255,255,255,0.05)'}
              stroke={isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.7)'}
              strokeWidth={isSelected ? 1.8 : 0.9}
              strokeLinejoin="round"
              style={{ pointerEvents: 'none', transition: 'fill 0.15s' }}
            />
            {/* Red constituency number */}
            <text
              x={c.labelX} y={c.labelY}
              textAnchor="middle" dominantBaseline="middle"
              style={{
                pointerEvents: 'none',
                fontSize: isSelected ? 8.5 : 7.5,
                fontWeight: 700,
                fontFamily: 'system-ui, sans-serif',
              }}
              fill="#E4002B"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2.8}
              paintOrder="stroke"
            >
              {c.id.replace('LA-', '')}
            </text>
          </g>
        )
      })}

      {/* ── Layer 3: District callout boxes ───────────────────────────────── */}
      {Object.entries(DISTRICT_CALLOUT).map(([district, pos]) => {
        const datum = districtData[district]
        if (!datum) return null
        const isActive = selectedDistrict === district
        const fill = datum.fill ?? 'var(--bg3)'
        const midX = pos.bx + BOX_W / 2
        const midY = pos.by + BOX_H / 2
        return (
          <g key={`callout-${district}`} onClick={() => onSelectDistrict(district)} style={{ cursor: 'pointer' }}>
            <line
              x1={pos.ax} y1={pos.ay} x2={midX} y2={midY}
              stroke={fill} strokeWidth={isActive ? 1.8 : 1.2} strokeOpacity={0.9}
            />
            <circle cx={pos.ax} cy={pos.ay} r={2.8} fill={fill} style={{ pointerEvents: 'none' }} />
            <rect
              x={pos.bx} y={pos.by} width={BOX_W} height={BOX_H} rx={5} ry={5}
              fill={isActive ? fill : 'var(--card-bg)'}
              stroke={fill} strokeWidth={isActive ? 2 : 1.2}
              filter="url(#cshadow)"
              style={{ transition: 'fill 0.2s' }}
            />
            <text
              x={midX} y={midY}
              textAnchor="middle" dominantBaseline="middle"
              style={{
                pointerEvents: 'none',
                fontSize: 8.5,
                fontWeight: isActive ? 800 : 600,
                fontFamily: 'system-ui, sans-serif',
              }}
              fill={isActive ? '#ffffff' : 'var(--text)'}
            >
              {district}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
