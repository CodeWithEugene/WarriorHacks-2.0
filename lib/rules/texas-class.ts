/**
 * Suggest a UIL WBGT class from a location.
 *
 * UIL publishes a map (https://www.uiltexas.org/files/health/WBGTMap.jpg) but no county list.
 * Class 2 covers the Panhandle and South Plains lobe (for example Amarillo and Lubbock),
 * extending toward the Permian Basin; the rest of Texas is Class 3. This polygon is a coarse,
 * hand-digitized approximation used only as a suggestion. Schools near the boundary must
 * choose their class before the school year and apply it consistently (UIL FAQ).
 */

// [lon, lat] vertices, clockwise, approximate.
const CLASS2_LOBE: readonly (readonly [number, number])[] = [
  [-103.05, 36.5],
  [-100.0, 36.5],
  [-100.0, 34.6],
  [-100.3, 33.4],
  [-100.9, 32.3],
  [-102.2, 31.8],
  [-103.05, 32.0],
]

const NEAR_BOUNDARY_KM = 40

function pointInPolygon(lon: number, lat: number, poly: readonly (readonly [number, number])[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!
    const [xj, yj] = poly[j]!
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

function kmToSegment(lon: number, lat: number, a: readonly [number, number], b: readonly [number, number]): number {
  const kx = 111.32 * Math.cos((lat * Math.PI) / 180)
  const ky = 110.57
  const px = lon * kx, py = lat * ky
  const ax = a[0] * kx, ay = a[1] * ky, bx = b[0] * kx, by = b[1] * ky
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export type ClassSuggestion = { regionId: "class2" | "class3"; nearBoundary: boolean; inTexas: boolean }

/** Rough Texas bounding box check; outside Texas the KSI categories apply instead. */
export function isRoughlyTexas(lat: number, lon: number): boolean {
  return lat >= 25.8 && lat <= 36.5 && lon >= -106.65 && lon <= -93.5
}

export function suggestTexasClass(lat: number, lon: number): ClassSuggestion {
  const inside = pointInPolygon(lon, lat, CLASS2_LOBE)
  let minKm = Number.POSITIVE_INFINITY
  for (let i = 0; i < CLASS2_LOBE.length; i++) {
    minKm = Math.min(minKm, kmToSegment(lon, lat, CLASS2_LOBE[i]!, CLASS2_LOBE[(i + 1) % CLASS2_LOBE.length]!))
  }
  return { regionId: inside ? "class2" : "class3", nearBoundary: minKm <= NEAR_BOUNDARY_KM, inTexas: isRoughlyTexas(lat, lon) }
}
