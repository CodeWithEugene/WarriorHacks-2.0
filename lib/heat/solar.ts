/**
 * Solar position from the NOAA General Solar Position equations
 * (https://gml.noaa.gov/grad/solcalc/solareqns.PDF).
 * Accurate to roughly 0.1 degrees, which is ample for WBGT radiation terms.
 */

const DEG = Math.PI / 180

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Cosine of the solar zenith angle at a UTC instant and location. */
export function cosZenith(time: Date, latDeg: number, lonDeg: number): number {
  const year = time.getUTCFullYear()
  const startOfYear = Date.UTC(year, 0, 1)
  const dayOfYear = Math.floor((time.getTime() - startOfYear) / 86_400_000) + 1
  const hour = time.getUTCHours() + time.getUTCMinutes() / 60 + time.getUTCSeconds() / 3600
  const daysInYear = isLeapYear(year) ? 366 : 365

  // Fractional year in radians.
  const g = ((2 * Math.PI) / daysInYear) * (dayOfYear - 1 + (hour - 12) / 24)

  // Equation of time in minutes, declination in radians.
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g))
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g)

  // True solar time in minutes (UTC input, so no time zone offset), hour angle in radians.
  const trueSolarMinutes = hour * 60 + eqTime + 4 * lonDeg
  const hourAngle = (trueSolarMinutes / 4 - 180) * DEG

  const lat = latDeg * DEG
  const cz = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle)
  return Math.max(-1, Math.min(1, cz))
}
