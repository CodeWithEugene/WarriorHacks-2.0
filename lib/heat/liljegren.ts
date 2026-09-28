/**
 * Liljegren et al. (2008) wet bulb globe temperature.
 *
 * TypeScript port of the Liljegren module in ECMWF thermofeel
 * (https://github.com/ecmwf/thermofeel, Apache License 2.0, (C) Copyright 1996- ECMWF),
 * which itself is transcribed from Liljegren's reference C code.
 * Reference: https://doi.org/10.1080/15459620802310770
 *
 * The globe temperature and the natural wet bulb temperature are each solved
 * from their steady-state energy balance by fixed-point iteration, then
 * combined as WBGT = 0.7 Tnwb + 0.2 Tg + 0.1 Ta.
 */

const STEFANB = 5.6696e-8
const CP = 1003.5
const M_AIR = 28.97
const M_H2O = 18.015
const R_GAS = 8314.34
const R_AIR = R_GAS / M_AIR
const PR = CP / (CP + 1.25 * R_AIR)
const RATIO = (CP * M_AIR) / M_H2O
const EMIS_WICK = 0.95
const ALB_WICK = 0.4
const D_WICK = 0.007
const L_WICK = 0.0254
const EMIS_GLOBE = 0.95
const ALB_GLOBE = 0.05
const D_GLOBE = 0.0508
const EMIS_SFC = 0.999
const ALB_SFC = 0.45
export const CZA_MIN = 0.00873
const MIN_SPEED = 0.13
const CONVERGENCE = 0.02
const MAX_ITER = 500
export const MIN_WIND_10M = 0.62
const MAX_FDIR = 0.9

// Pasquill-Gifford stability lookup (rows: wind bins, columns: radiation or night bins).
const LSRDT: readonly (readonly number[])[] = [
  [1, 1, 2, 4, 0, 5, 6, 0],
  [1, 2, 3, 4, 0, 5, 6, 0],
  [2, 2, 3, 4, 0, 4, 4, 0],
  [3, 3, 4, 4, 0, 0, 0, 0],
  [3, 4, 4, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
]
const URBAN_EXP = [0.15, 0.15, 0.2, 0.25, 0.3, 0.3] as const

function esat(tk: number): number {
  const y = (tk - 273.15) / (tk - 32.18)
  return 1.004 * 6.1121 * Math.exp(17.502 * y)
}

function dewPoint(e: number): number {
  const z = Math.log(e / (6.1121 * 1.004))
  return 273.15 + (240.97 * z) / (17.502 - z)
}

function viscosity(tk: number): number {
  const sigma = 3.617
  const epsKappa = 97.0
  const tr = tk / epsKappa
  const omega = ((tr - 2.9) / 0.4) * -0.034 + 1.048
  return (2.6693e-6 * Math.sqrt(M_AIR * tk)) / (sigma * sigma * omega)
}

function thermalCond(tk: number): number {
  return (CP + 1.25 * R_AIR) * viscosity(tk)
}

function diffusivity(tk: number, pair: number): number {
  const pcritAir = 36.4
  const pcritH2o = 218.0
  const tcritAir = 132.0
  const tcritH2o = 647.3
  const a = 3.64e-4
  const b = 2.334
  const pcrit13 = (pcritAir * pcritH2o) ** (1 / 3)
  const tcrit512 = (tcritAir * tcritH2o) ** (5 / 12)
  const tcrit12 = Math.sqrt(tcritAir * tcritH2o)
  const mmix = Math.sqrt(1 / M_AIR + 1 / M_H2O)
  const patm = pair / 1013.25
  return ((a * (tk / tcrit12) ** b * pcrit13 * tcrit512 * mmix) / patm) * 1e-4
}

function evap(tk: number): number {
  return ((313.15 - tk) / 30.0) * -71100.0 + 2.4073e6
}

function emisAtm(tk: number, rhFrac: number): number {
  return 0.575 * (rhFrac * esat(tk)) ** 0.143
}

function hSphereInAir(tk: number, pair: number, speed: number): number {
  const density = (pair * 100) / (R_AIR * tk)
  const re = (Math.max(speed, MIN_SPEED) * density * D_GLOBE) / viscosity(tk)
  const nu = 2.0 + 0.6 * Math.sqrt(re) * PR ** 0.3333
  return (nu * thermalCond(tk)) / D_GLOBE
}

function hCylinderInAir(tk: number, pair: number, speed: number): number {
  const a = 0.56
  const b = 0.281
  const c = 0.4
  const density = (pair * 100) / (R_AIR * tk)
  const re = (Math.max(speed, MIN_SPEED) * density * D_WICK) / viscosity(tk)
  const nu = b * re ** (1 - c) * PR ** (1 - a)
  return (nu * thermalCond(tk)) / D_WICK
}

type SensorInputs = {
  /** Air temperature [K] */
  taK: number
  /** Relative humidity as a fraction 0..1 */
  rhFrac: number
  /** Surface pressure [hPa] */
  pairHpa: number
  /** Wind speed at 2 m [m/s] */
  speed2m: number
  /** Global shortwave radiation [W/m2] */
  solar: number
  /** Direct beam fraction 0..0.9 */
  fdir: number
  /** Cosine of the solar zenith angle */
  cza: number
}

/** Globe temperature [C], or NaN if the iteration does not converge. */
export function solveGlobe(i: SensorInputs): number {
  const { taK: ta, rhFrac, pairHpa: pair, speed2m: speed, solar, fdir, cza } = i
  const tsfc = ta
  const emis = emisAtm(ta, rhFrac)
  const czaSafe = cza > CZA_MIN ? cza : 1
  const beam = fdir > 0 ? fdir * (1 / (2 * czaSafe) - 1) : 0
  let tgPrev = ta
  for (let n = 0; n < MAX_ITER; n++) {
    const tref = 0.5 * (tgPrev + ta)
    const h = hSphereInAir(tref, pair, speed)
    const tgNew =
      (0.5 * (emis * ta ** 4 + EMIS_SFC * tsfc ** 4) -
        (h / (STEFANB * EMIS_GLOBE)) * (tgPrev - ta) +
        (solar / (2 * STEFANB * EMIS_GLOBE)) * (1 - ALB_GLOBE) * (beam + 1 + ALB_SFC)) **
      0.25
    if (Math.abs(tgNew - tgPrev) < CONVERGENCE) return tgNew - 273.15
    tgPrev = 0.9 * tgPrev + 0.1 * tgNew
  }
  return Number.NaN
}

/** Natural wet bulb temperature [C] (rad = 1), or NaN if not converged. */
export function solveNaturalWetBulb(i: SensorInputs, rad = 1): number {
  const { taK: ta, rhFrac, pairHpa: pair, speed2m: speed, solar, fdir, cza } = i
  const tsfc = ta
  const czaSafe = cza > CZA_MIN ? cza : 1
  const sza = Math.acos(Math.min(1, Math.max(-1, czaSafe)))
  const emis = emisAtm(ta, rhFrac)
  const eair = rhFrac * esat(ta)
  let twPrev = dewPoint(eair)
  for (let n = 0; n < MAX_ITER; n++) {
    const tref = 0.5 * (twPrev + ta)
    const h = hCylinderInAir(tref, pair, speed)
    const fatm =
      STEFANB * EMIS_WICK * (0.5 * (emis * ta ** 4 + EMIS_SFC * tsfc ** 4) - twPrev ** 4) +
      (1 - ALB_WICK) *
        solar *
        ((1 - fdir) * (1 + (0.25 * D_WICK) / L_WICK) +
          fdir * (Math.tan(sza) / Math.PI + (0.25 * D_WICK) / L_WICK) +
          ALB_SFC)
    const ewick = esat(twPrev)
    const density = (pair * 100) / (R_AIR * tref)
    const sc = viscosity(tref) / (density * diffusivity(tref, pair))
    const twNew =
      ta -
      ((evap(tref) / RATIO) * (ewick - eair)) / (pair - ewick) * (PR / sc) ** 0.56 +
      (fatm / h) * rad
    if (Math.abs(twNew - twPrev) < CONVERGENCE) return twNew - 273.15
    twPrev = 0.9 * twPrev + 0.1 * twNew
  }
  return Number.NaN
}

/** 10 m to 2 m wind speed via the stability-dependent power-law profile. */
export function windSpeed2m(va10m: number, cza: number, ssrd: number): number {
  const daytime = cza > 0
  const col = daytime ? (ssrd >= 925 ? 0 : ssrd >= 675 ? 1 : ssrd >= 175 ? 2 : 3) : 5
  const row = daytime
    ? va10m >= 6
      ? 4
      : va10m >= 5
        ? 3
        : va10m >= 3
          ? 2
          : va10m >= 2
            ? 1
            : 0
    : va10m >= 2.5
      ? 2
      : va10m >= 2
        ? 1
        : 0
  const stabilityClass = LSRDT[row]![col]!
  const exponent = URBAN_EXP[stabilityClass - 1] ?? URBAN_EXP[0]
  return Math.max(va10m * (2 / 10) ** exponent, MIN_SPEED)
}

export type LiljegrenInputs = {
  /** Air temperature at 2 m [C] */
  tempC: number
  /** Relative humidity [%] */
  rhPct: number
  /** Surface pressure [hPa] */
  pressureHpa: number
  /** Wind speed at 10 m [m/s] */
  wind10mMs: number
  /** Instantaneous global shortwave radiation [W/m2] */
  shortwaveWm2: number
  /** Direct beam fraction of shortwave, 0..1 (clamped internally) */
  fdir: number
  /** Cosine of the solar zenith angle */
  cosZenith: number
}

export type LiljegrenResult = { wbgtC: number; globeC: number; naturalWetBulbC: number }

/** Outdoor WBGT [C] with the KNMI operational guards used by thermofeel. */
export function wbgtLiljegren(i: LiljegrenInputs): LiljegrenResult {
  const va = Math.max(i.wind10mMs, MIN_WIND_10M)
  const speed2m = windSpeed2m(va, i.cosZenith, i.shortwaveWm2)
  let fdir = Math.min(MAX_FDIR, Math.max(0, i.fdir))
  if (i.cosZenith < CZA_MIN) fdir = 0
  const sensor: SensorInputs = {
    taK: i.tempC + 273.15,
    rhFrac: i.rhPct / 100,
    pairHpa: i.pressureHpa,
    speed2m,
    solar: i.shortwaveWm2,
    fdir,
    cza: i.cosZenith,
  }
  const globeC = solveGlobe(sensor)
  const naturalWetBulbC = solveNaturalWetBulb(sensor, 1)
  const wbgtC = 0.1 * i.tempC + 0.2 * globeC + 0.7 * naturalWetBulbC
  return { wbgtC, globeC, naturalWetBulbC }
}
