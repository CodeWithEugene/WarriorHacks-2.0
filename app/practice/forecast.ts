import type { ForecastPoint } from "./practice-app"

export function forecastAt(forecast: readonly ForecastPoint[], at: number): number | null {
  const hour = forecast.find((f) => f.t <= at && at < f.t + 3_600_000) ?? forecast[0]
  return hour ? hour.wbgtF : null
}
