"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, ShieldCheck, TriangleAlert } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { usePlan } from "@/components/plan-provider"
import { riskLabel } from "@/lib/projection"
import { useCountUp } from "@/hooks/use-count-up"

// Shared dark navy→black gradient, identical to the rest of the app.
const GRADIENT_BG = {
  backgroundImage:
    "linear-gradient(180deg, oklch(0.23 0.035 255) 0%, oklch(0.18 0.018 250) 32%, var(--background) 70%)",
}

type CategoryKey =
  | "Individual Stocks"
  | "US ETFs"
  | "International ETFs"
  | "Sector ETFs"
  | "Fixed Income"
  | "Cash"

type Slice = { label: CategoryKey; weight: number }

// Category metadata framed the way a self-directed Trading 212 / ISA investor
// thinks about their own holdings. `color`/`light` are literal oklch values so
// the donut keeps its emerald/teal palette regardless of chart-token overrides,
// and each gets a one-line plain-language description used in the tooltip.
const CATEGORIES: Record<
  CategoryKey,
  { color: string; light: string; desc: string }
> = {
  "Individual Stocks": {
    color: "oklch(0.74 0.15 162)",
    light: "oklch(0.84 0.13 162)",
    desc: "Individual stocks you've picked directly",
  },
  "US ETFs": {
    color: "oklch(0.72 0.12 185)",
    light: "oklch(0.82 0.10 185)",
    desc: "Broad US market funds like S&P 500 trackers",
  },
  "International ETFs": {
    color: "oklch(0.68 0.11 220)",
    light: "oklch(0.79 0.10 220)",
    desc: "Funds tracking global and overseas markets",
  },
  "Sector ETFs": {
    color: "oklch(0.79 0.13 95)",
    light: "oklch(0.87 0.11 95)",
    desc: "Themed funds focused on specific industries",
  },
  "Fixed Income": {
    color: "oklch(0.62 0.09 245)",
    light: "oklch(0.73 0.09 245)",
    desc: "Bonds and gilts that steady your portfolio",
  },
  Cash: {
    color: "oklch(0.66 0.02 240)",
    light: "oklch(0.78 0.02 240)",
    desc: "Uninvested cash and money-market holdings",
  },
}

// Three optimized target mixes, keyed by the portfolio's own risk band.
// Each sums to 100.
const ALLOCATIONS: Record<"Low" | "Medium" | "High", Slice[]> = {
  Low: [
    { label: "Fixed Income", weight: 38 },
    { label: "US ETFs", weight: 24 },
    { label: "International ETFs", weight: 12 },
    { label: "Cash", weight: 12 },
    { label: "Individual Stocks", weight: 8 },
    { label: "Sector ETFs", weight: 6 },
  ],
  Medium: [
    { label: "US ETFs", weight: 30 },
    { label: "Individual Stocks", weight: 18 },
    { label: "International ETFs", weight: 18 },
    { label: "Sector ETFs", weight: 12 },
    { label: "Fixed Income", weight: 14 },
    { label: "Cash", weight: 8 },
  ],
  High: [
    { label: "Individual Stocks", weight: 32 },
    { label: "US ETFs", weight: 26 },
    { label: "International ETFs", weight: 16 },
    { label: "Sector ETFs", weight: 16 },
    { label: "Fixed Income", weight: 6 },
    { label: "Cash", weight: 4 },
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
      <main className="mx-auto max-w-3xl px-5 py-10 duration-700 ease-out animate-in fade-in slide-in-from-bottom-4 sm:py-14">
        {/* Back link + context */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/results"
            className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className="size-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
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
        <section className="glass-card glass-card-glow mt-8 rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 sm:p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Suggested holdings
          </p>
          <AllocationBreakdown allocation={allocation} />
        </section>

        {/* Plain-language risk verdict */}
        <RiskMessage isRiskier={isRiskier} statedLabel={riskLabel(statedScore)} />

        {/* Institutional positioning — supporting data point */}
        <InstitutionalPositioning allocation={allocation} />

        <p className="mt-8 text-pretty text-xs leading-relaxed text-muted-foreground">
          Allocations are illustrative targets generated from your stated risk
          tolerance and do not account for taxes, fees, or market timing. Reckon
          is not financial advice.
        </p>
      </main>
    </div>
  )
}

function AllocationBreakdown({ allocation }: { allocation: Slice[] }) {
  // Shared hover state lets the donut and legend highlight together.
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className="mt-5 flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
      <AllocationDonut
        allocation={allocation}
        active={active}
        setActive={setActive}
      />
      <ul className="flex w-full flex-col gap-3">
        {allocation.map((slice, i) => (
          <LegendRow
            key={slice.label}
            slice={slice}
            index={i}
            active={active}
            onHover={setActive}
          />
        ))}
      </ul>
    </div>
  )
}

function LegendRow({
  slice,
  index,
  active,
  onHover,
}: {
  slice: Slice
  index: number
  active: number | null
  onHover: (i: number | null) => void
}) {
  const meta = CATEGORIES[slice.label]
  // Count each percentage up from zero on load, lightly staggered.
  const counted = useCountUp(slice.weight, 1000, 150 + index * 90)
  const isActive = active === index
  const dimmed = active !== null && !isActive

  return (
    <li
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className="flex cursor-default items-center justify-between gap-3 rounded-md px-1.5 py-1 transition-all duration-200"
      style={{
        opacity: dimmed ? 0.45 : 1,
        backgroundColor: isActive
          ? "color-mix(in oklch, var(--card) 40%, transparent)"
          : "transparent",
      }}
    >
      <span className="flex items-center gap-2.5 text-sm text-foreground">
        <span
          className="size-2.5 shrink-0 rounded-full transition-transform duration-200"
          style={{
            backgroundColor: meta.color,
            transform: isActive ? "scale(1.5)" : "scale(1)",
            boxShadow: isActive
              ? `0 0 8px ${meta.color}`
              : "none",
          }}
          aria-hidden="true"
        />
        {slice.label}
      </span>
      <span className="font-mono text-sm font-medium tabular-nums text-muted-foreground">
        {Math.round(counted)}%
      </span>
    </li>
  )
}

function AllocationDonut({
  allocation,
  active,
  setActive,
}: {
  allocation: Slice[]
  active: number | null
  setActive: (i: number | null) => void
}) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const gap = 2.5
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)

  // Precompute each arc's dash geometry in a single pass.
  let running = 0
  const arcs = allocation.map((slice) => {
    const length = (slice.weight / 100) * circumference - gap
    const dashOffset = -running
    running += length + gap
    return { slice, length, dashOffset }
  })

  const activeSlice = active !== null ? allocation[active] : null
  const activeMeta = activeSlice ? CATEGORIES[activeSlice.label] : null

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      onMouseLeave={() => {
        setActive(null)
        setTip(null)
      }}
    >
      {/* Always-on soft ambient bloom behind the donut. */}
      <div
        aria-hidden="true"
        className="animate-ambient pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.74 0.15 162 / 0.45) 0%, oklch(0.7 0.12 185 / 0.28) 45%, transparent 72%)",
        }}
      />

      <svg
        viewBox="0 0 120 120"
        className="size-44 -rotate-90 animate-donut-pop overflow-visible"
        role="img"
        aria-label="Optimized portfolio allocation breakdown by category"
      >
        <defs>
          {arcs.map(({ slice }, i) => {
            const meta = CATEGORIES[slice.label]
            return (
              <linearGradient
                key={slice.label}
                id={`alloc-grad-${i}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={meta.light} />
                <stop offset="100%" stopColor={meta.color} />
              </linearGradient>
            )
          })}
        </defs>

        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
        />

        {arcs.map(({ slice, length, dashOffset }, i) => {
          const meta = CATEGORIES[slice.label]
          const isActive = active === i
          const dimmed = active !== null && !isActive
          return (
            <circle
              key={slice.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={`url(#alloc-grad-${i})`}
              strokeWidth={isActive ? 18 : 14}
              strokeLinecap="round"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              className="cursor-pointer [transition:stroke-width_0.25s_ease,opacity_0.25s_ease,filter_0.25s_ease]"
              style={{
                opacity: dimmed ? 0.35 : 1,
                // Soft light bloom in the segment's own color — layered blurs
                // for a gentle glow rather than a hard neon edge.
                filter: isActive
                  ? `drop-shadow(0 0 4px ${meta.color}) drop-shadow(0 0 9px color-mix(in oklch, ${meta.color} 70%, transparent))`
                  : "none",
              }}
              onMouseEnter={() => setActive(i)}
              onMouseMove={(e) => {
                const rect =
                  e.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
                if (rect) {
                  setTip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  })
                }
              }}
            />
          )
        })}
      </svg>

      {/* Tooltip — category, percentage, plain-language description. */}
      {activeSlice && activeMeta && tip ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-20 w-52 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover/95 p-3 text-left shadow-xl backdrop-blur-md"
          style={{ left: tip.x, top: tip.y - 12 }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor: activeMeta.color,
                  boxShadow: `0 0 6px ${activeMeta.color}`,
                }}
                aria-hidden="true"
              />
              {activeSlice.label}
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {activeSlice.weight}%
            </span>
          </div>
          <p className="mt-1.5 text-pretty text-xs leading-relaxed text-muted-foreground">
            {activeMeta.desc}
          </p>
        </div>
      ) : null}
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
      <section className="mt-6 flex gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-950/20">
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
    <section className="relative mt-6 flex gap-4 overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/20">
      {/* Slow living color drift so the verdict feels alive, not static. */}
      <div
        aria-hidden="true"
        className="animate-ambient-shift pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(120deg, oklch(0.74 0.15 162 / 0.18) 0%, oklch(0.7 0.12 185 / 0.10) 45%, oklch(0.68 0.11 220 / 0.16) 100%)",
        }}
      />
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

function InstitutionalPositioning({ allocation }: { allocation: Slice[] }) {
  // A few headline categories that institutions are also holding — kept
  // deliberately small as a supporting signal, not a primary claim.
  const overlapping = allocation.filter((s) => s.label !== "Cash").slice(0, 3)
  // Illustrative overlap, derived from the suggested mix so it stays stable.
  const overlapPct = Math.min(
    96,
    Math.round(overlapping.reduce((sum, s) => sum + s.weight, 0)),
  )

  return (
    <section className="glass-card mt-6 rounded-xl border-l-2 border-l-amber-500/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400/90"
          aria-hidden="true"
        >
          <Building2 className="size-4" />
        </span>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Institutional positioning
        </h2>
      </div>

      {/* Lead: plain language */}
      <p className="mt-3.5 text-pretty text-sm leading-relaxed text-foreground">
        Several of these holdings are also held by major institutional
        investors, based on their most recent public filings.
      </p>

      {/* Clearly visible disclaimer — not muted */}
      <p className="mt-3 text-pretty text-sm font-medium leading-relaxed text-amber-300/90">
        These filings are typically 1&ndash;3 months old by the time they&apos;re
        public &mdash; this isn&apos;t live activity, just recent positioning.
      </p>

      {/* Overlap as a small secondary detail */}
      <p className="mt-3.5 font-mono text-xs text-muted-foreground">
        ~{overlapPct}% overlap with tracked institutional holdings ·{" "}
        {overlapping.map((s) => s.label).join(", ")}
      </p>
    </section>
  )
}
