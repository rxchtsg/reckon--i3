import type { Risk, RiskRates, ScenarioRates } from "@/lib/projection"

const RISKS: Risk[] = ["low", "medium", "high"]

/** Narrow unknown JSON into a valid RiskRates object, or null if malformed. */
function parseRates(value: unknown): RiskRates | null {
  if (!value || typeof value !== "object") return null
  const rates = (value as { rates?: unknown }).rates
  if (!rates || typeof rates !== "object") return null

  const out = {} as RiskRates
  for (const risk of RISKS) {
    const band = (rates as Record<string, unknown>)[risk] as
      | Partial<ScenarioRates>
      | undefined
    if (
      !band ||
      typeof band.bear !== "number" ||
      typeof band.base !== "number" ||
      typeof band.bull !== "number"
    ) {
      return null
    }
    out[risk] = { bear: band.bear, base: band.base, bull: band.bull }
  }
  return out
}

/**
 * Fetch live historical-return-based rates from our API route.
 * Returns null on any failure so callers can silently fall back to the
 * fixed default assumptions. SWR caches the result by key, so this is not
 * re-run on every calculation.
 */
export async function fetchReturnRates(): Promise<RiskRates | null> {
  try {
    const res = await fetch("/api/returns")
    if (!res.ok) return null
    return parseRates(await res.json())
  } catch {
    return null
  }
}
