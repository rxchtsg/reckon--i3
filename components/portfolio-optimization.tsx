import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

// TODO: replace with live dashboard URL
const OPTIMIZATION_URL = "/optimization"

// Placeholder allocation weights — purely illustrative, not real data.
const SEGMENTS = [
  { label: "Equities", weight: 45, color: "var(--chart-1)" },
  { label: "Bonds", weight: 25, color: "var(--chart-2)" },
  { label: "Alternatives", weight: 18, color: "var(--chart-4)" },
  { label: "Cash", weight: 12, color: "var(--chart-3)" },
]

export function PortfolioOptimization() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
        <AllocationRing />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
              Next step
            </span>
          </div>
          <h2 className="mt-2 text-balance text-lg font-semibold tracking-tight text-foreground">
            Portfolio Optimization
          </h2>
          <p className="mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            See the optimal allocation to close your gap, powered by our quantum
            optimization engine.
          </p>

          <Button
            render={<Link href={OPTIMIZATION_URL} />}
            nativeButton={false}
            className="mt-5 font-medium"
          >
            View full optimization
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  )
}

function AllocationRing() {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 120 120"
        className="size-28 -rotate-90"
        role="img"
        aria-label="Illustrative portfolio allocation breakdown"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
        />
        {SEGMENTS.map((segment) => {
          const gap = 3
          const length = (segment.weight / 100) * circumference - gap
          const dashOffset = -offset
          offset += length + gap
          return (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={segment.color}
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
