import { NextResponse } from "next/server"
import type { RiskRates } from "@/lib/projection"

// Representative ETFs used as proxies for broad asset classes.
const EQUITY = "SPY" // US large-cap equities
const BONDS = "AGG" // US aggregate bonds

// Cache the upstream fetch + computed result for a day so we don't hammer
// Yahoo Finance and so repeated calculations reuse the same numbers.
export const revalidate = 86400

type YahooChart = {
  chart?: {
    result?: Array<{
      indicators?: { adjclose?: Array<{ adjclose?: Array<number | null> }> }
    }>
  }
}

/** Compound annual growth rate from ~5y of monthly adjusted closes. */
async function annualReturn(symbol: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5y&interval=1mo`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ReckonBot/1.0)" },
    next: { revalidate },
  })
  if (!res.ok) return null

  const json = (await res.json()) as YahooChart
  const closes = json.chart?.result?.[0]?.indicators?.adjclose?.[0]?.adjclose
  if (!closes) return null

  const clean = closes.filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n) && n > 0,
  )
  if (clean.length < 13) return null

  const first = clean[0]
  const last = clean[clean.length - 1]
  const years = (clean.length - 1) / 12
  if (years <= 0) return null

  const cagr = Math.pow(last / first, 1 / years) - 1
  // Guard against absurd values from bad data.
  if (!Number.isFinite(cagr) || cagr < -0.5 || cagr > 0.5) return null
  return cagr
}

// Each risk band blends equity/bond exposure and applies a volatility spread
// to derive bear/base/bull around the expected (base) return.
const BANDS = {
  low: { equity: 0.3, spread: 0.03 },
  medium: { equity: 0.6, spread: 0.04 },
  high: { equity: 0.9, spread: 0.06 },
} as const

export async function GET() {
  const [equity, bonds] = await Promise.all([
    annualReturn(EQUITY),
    annualReturn(BONDS),
  ])

  // If either proxy failed, signal the client to use its fixed fallback.
  if (equity === null || bonds === null) {
    return NextResponse.json({ error: "unavailable" }, { status: 502 })
  }

  const rates = Object.fromEntries(
    Object.entries(BANDS).map(([risk, { equity: w, spread }]) => {
      const base = w * equity + (1 - w) * bonds
      return [risk, { bear: base - spread, base, bull: base + spread }]
    }),
  ) as RiskRates

  return NextResponse.json({ rates, source: "yahoo-finance", asOf: Date.now() })
}
