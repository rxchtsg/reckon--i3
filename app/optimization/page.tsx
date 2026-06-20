"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

type Risk = "low" | "medium" | "high"

const RISK_LEVELS: { value: Risk; label: string; blurb: string }[] = [
  { value: "low", label: "Low", blurb: "Capital preservation, steadier returns" },
  { value: "medium", label: "Medium", blurb: "Balanced growth and volatility" },
  { value: "high", label: "High", blurb: "Maximum growth, wider swings" },
]

// Dummy allocation — restrained blue/emerald/slate palette, not a rainbow.
const ALLOCATION: { label: string; weight: number; color: string }[] = [
  { label: "US Large Cap", weight: 35, color: "oklch(0.74 0.15 162)" },
  { label: "International", weight: 20, color: "oklch(0.7 0.11 220)" },
  { label: "Bonds", weight: 15, color: "oklch(0.62 0.09 245)" },
  { label: "Real Estate", weight: 10, color: "oklch(0.68 0.08 195)" },
  { label: "Crypto", weight: 10, color: "oklch(0.78 0.13 85)" },
  { label: "Cash", weight: 10, color: "oklch(0.6 0.02 240)" },
]

const RATIONALE: { title: string; detail: string }[] = [
  {
    title: "Growth is the engine, diversified across regions",
    detail:
      "US and international equities make up the bulk of the portfolio because they drive long-term returns — splitting them spreads risk across economies.",
  },
  {
    title: "Bonds and cash cushion the swings",
    detail:
      "A slice of bonds and cash steadies the portfolio in downturns, so you're less likely to sell at the worst time.",
  },
  {
    title: "Small satellites add upside without dominating risk",
    detail:
      "Modest real estate and crypto positions add return potential and diversification while staying small enough to limit damage if they fall.",
  },
]

export default function OptimizationPage() {
  const [deposit, setDeposit] = useState("50,000")
  const [riskIndex, setRiskIndex] = useState(1)
  const [running, setRunning] = useState(false)

  const risk = RISK_LEVELS[riskIndex]

  function handleRun() {
    setRunning(true)
    // Preview only — simulate the optimization pass.
    setTimeout(() => setRunning(false), 900)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(180deg, oklch(0.23 0.035 255) 0%, oklch(0.18 0.018 250) 32%, var(--background) 70%)",
      }}
    >
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        {/* Hero */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Next step
            </span>
            <span className="h-px w-12 bg-primary/40" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Your optimized <span className="text-primary">allocation.</span>
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Set your deposit and risk tolerance, and Reckon maps it to a
            diversified target mix designed to balance growth and resilience.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Configuration card */}
          <section className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Configuration
            </p>

            {/* Total deposit */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="deposit"
                className="text-sm font-medium text-foreground"
              >
                Total deposit
              </label>
              <div className="flex items-center rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                <span className="pl-3.5 font-mono text-sm text-muted-foreground">
                  $
                </span>
                <input
                  id="deposit"
                  type="text"
                  inputMode="decimal"
                  value={deposit}
                  onChange={(e) => setDeposit(formatWithCommas(e.target.value))}
                  placeholder="50,000"
                  className="w-full rounded-lg bg-transparent py-2.5 pl-1.5 pr-3.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Risk tolerance */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="risk"
                className="text-sm font-medium text-foreground"
              >
                Risk tolerance
              </label>
              <div className="rounded-lg border border-input bg-card px-4 py-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-base font-semibold text-primary">
                    {risk.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {risk.blurb}
                  </span>
                </div>
                <input
                  id="risk"
                  type="range"
                  min={0}
                  max={2}
                  step={1}
                  value={riskIndex}
                  onChange={(e) => setRiskIndex(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                  aria-valuetext={risk.label}
                />
                <div className="mt-2 flex justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={handleRun}
              disabled={running}
              aria-busy={running}
              className="mt-1 h-12 w-full text-base font-semibold"
            >
              {running ? (
                <>
                  <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
                  Optimizing…
                </>
              ) : (
                <>
                  <Sparkles className="size-4.5" aria-hidden="true" />
                  Run optimization
                </>
              )}
            </Button>
          </section>

          {/* Allocation ring */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Target allocation
            </p>
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <AllocationRing />
              <ul className="flex w-full flex-col gap-2.5">
                {ALLOCATION.map((slice) => (
                  <li
                    key={slice.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2.5 text-sm text-foreground">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color }}
                        aria-hidden="true"
                      />
                      {slice.label}
                    </span>
                    <span className="font-mono text-sm font-medium text-muted-foreground">
                      {slice.weight}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Why this allocation */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Why this allocation
            </h2>
          </div>
          <ol className="flex flex-col gap-3">
            {RATIONALE.map((point, i) => (
              <li
                key={point.title}
                className="flex gap-4 rounded-xl border border-border bg-card p-4"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-sm font-medium text-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {point.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {point.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          This is a preview using sample data — live optimization coming soon.
        </p>
      </main>
    </div>
  )
}

/** Add thousands separators while preserving an in-progress decimal. */
function formatWithCommas(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "")
  if (cleaned === "") return ""
  const [intPart, ...rest] = cleaned.split(".")
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return rest.length > 0 ? `${grouped}.${rest.join("")}` : grouped
}

function AllocationRing() {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 120 120"
        className="size-40 -rotate-90"
        role="img"
        aria-label="Target portfolio allocation breakdown"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
        />
        {ALLOCATION.map((slice) => {
          const gap = 2.5
          const length = (slice.weight / 100) * circumference - gap
          const dashOffset = -offset
          offset += length + gap
          return (
            <circle
              key={slice.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
            />
          )
        })}
      </svg>
    </div>
  )
}
