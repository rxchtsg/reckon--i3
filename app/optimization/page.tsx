"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, TriangleAlert } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { usePlan } from "@/components/plan-provider"
import { riskLabel } from "@/lib/projection"

// Shared dark navy→black gradient, identical to the rest of the app.
const GRADIENT_BG = {
  backgroundImage:
    "linear-gradient(180deg, oklch(0.23 0.035 255) 0%, oklch(0.18 0.018 250) 32%, var(--background) 70%)",
}

type Slice = { label: string; weight: number; color: string }

// Restrained emerald/blue/slate palette — literal oklch values so the donut
// stays colorful regardless of the dark scheme's greyscale chart-token
// overrides, matching the rest of the app's allocation visuals.
const C = {
  usLarge: "oklch(0.74 0.15 162)", // emerald (primary)
  intl: "oklch(0.7 0.11 220)", // blue
  bonds: "oklch(0.62 0.09 245)", // deep blue
  realEstate: "oklch(0.68 0.08 195)", // teal
  crypto: "oklch(0.78 0.13 85)", // gold
  cash: "oklch(0.6 0.02 240)", // slate
}

// Three optimized target mixes, keyed by the portfolio's own risk band.
// Each sums to 100.
const ALLOCATIONS: Record<"Low" | "Medium" | "High", Slice[]> = {
  Low: [
    { label: "Bonds", weight: 40, color: C.bonds },
    { label: "US Large Cap", weight: 25, color: C.usLarge },
    { label: "International", weight: 13, color: C.intl },
    { label: "Real Estate", weight: 10, color: C.realEstate },
    { label: "Cash", weight: 12, color: C.cash },
  ],
  Medium: [
    { label: "US Large Cap", weight: 35, color: C.usLarge },
    { label: "International", weight: 20, color: C.intl },
    { label: "Bonds", weight: 22, color: C.bonds },
    { label: "Real Estate", weight: 12, color: C.realEstate },
    { label: "Cash", weight: 11, color: C.cash },
  ],
  High: [
    { label: "US Large Cap", weight: 42, color: C.usLarge },
    { label: "International", weight: 26, color: C.intl },
    { label: "Real Estate", weight: 12, color: C.realEstate },
    { label: "Crypto", weight: 12, color: C.crypto },
    { label: "Bonds", weight: 8, color: C.bonds },
  ],
}

// Map a stated 0-100 tolerance and an optimized portfolio band onto a 0-2
// scale so we can tell whether the suggested mix sits within comfort.
const BAND_RANK: Record<"Low" | "Medium" | "High", number> = {
  Low: 0,
  Medium: 1,
  High: 2,
}

/** Coarse comfort band derived from the continuous 0-100 risk score. */
function comfortBand(score: number): "Low" | "Medium" | "High" {
  if (score < 34) return "Low"
  if (score < 67) return "Medium"
  return "High"
}

export default function OptimizationPage() {
  const { plan } = usePlan()

  // Default view works even without a saved plan: assume a balanced profile.
  const statedScore = plan?.riskScore ?? 50
  const statedBand = comfortBand(statedScore)

  // The optimizer's recommended mix targets one band above a cautious profile
  // to chase growth — that's what makes the safety verdict meaningful.
  const optimizedBand = useMemo<"Low" | "Medium" | "High">(() => {
    if (statedBand === "Low") return "Medium"
    return statedBand
  }, [statedBand])

  const allocation = ALLOCATIONS[optimizedBand]
  const isRiskier = BAND_RANK[optimizedBand] > BAND_RANK[statedBand]

  return (
    <div className="min-h-screen" style={GRADIENT_BG}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        {/* Back link + context */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/results"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to results
          </Link>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Risk tolerance · {riskLabel(statedScore)}
          </p>
        </div>

        {/* Eyebrow badge */}
        <div className="mt-8 flex items-center gap-3">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Optimization results
          </span>
          <span className="h-px w-12 bg-primary/40" aria-hidden="true" />
        </div>

        {/* Headline allocation summary */}
        <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Your optimized <span className="text-primary">allocation.</span>
        </h1>
        <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Reckon balanced growth against resilience to land on this diversified
          target mix — here&apos;s how your suggested holdings break down by
          category.
        </p>

        {/* Donut chart + legend */}
        <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Suggested holdings
          </p>
          <div className="mt-5 flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
            <AllocationDonut allocation={allocation} />
            <ul className="flex w-full flex-col gap-3">
              {allocation.map((slice) => (
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

        {/* Plain-language risk verdict */}
        <RiskMessage isRiskier={isRiskier} statedLabel={riskLabel(statedScore)} />

        <p className="mt-8 text-pretty text-xs leading-relaxed text-muted-foreground">
          Allocations are illustrative targets generated from your stated risk
          tolerance and do not account for taxes, fees, or market timing. Reckon
          is not financial advice.
        </p>
      </main>
    </div>
  )
}

function RiskMessage({
  isRiskier,
  statedLabel,
}: {
  isRiskier: boolean
  statedLabel: string
}) {
  if (isRiskier) {
    return (
      <section className="mt-6 flex gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"
          aria-hidden="true"
        >
          <TriangleAlert className="size-5" />
        </span>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-400">
            Heads up
          </p>
          <h2 className="mt-1.5 text-balance text-base font-semibold text-foreground">
            This allocation is riskier than you said you&apos;re comfortable
            with.
          </h2>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
            You set your tolerance to{" "}
            <span className="font-medium text-foreground">{statedLabel}</span>,
            but reaching your goal in time leans on a growth-tilted mix with
            wider swings. If a bumpy ride would tempt you to sell, a safer option
            is to dial back equities, extend your timeline, or raise
            contributions instead.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 flex gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"
        aria-hidden="true"
      >
        <ShieldCheck className="size-5" />
      </span>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-400">
          You&apos;re in range
        </p>
        <h2 className="mt-1.5 text-balance text-base font-semibold text-foreground">
          This allocation fits your risk tolerance.
        </h2>
        <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          The suggested mix sits comfortably within the{" "}
          <span className="font-medium text-foreground">{statedLabel}</span>{" "}
          profile you set — diversified enough to cushion downturns while still
          working toward your goal.
        </p>
      </div>
    </section>
  )
}

function AllocationDonut({ allocation }: { allocation: Slice[] }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 120 120"
        className="size-44 -rotate-90"
        role="img"
        aria-label="Optimized portfolio allocation breakdown by category"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
        />
        {allocation.map((slice) => {
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
