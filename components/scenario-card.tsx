"use client"

import { TrendingDown, Minus, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Scenario } from "@/lib/projection"
import { useCurrency } from "@/components/currency-provider"

const META: Record<
  Scenario["key"],
  { icon: typeof TrendingUp; accent: string; ring: string }
> = {
  bear: {
    icon: TrendingDown,
    accent: "text-[oklch(0.66_0.18_22)]",
    ring: "border-border",
  },
  base: {
    icon: Minus,
    accent: "text-primary",
    ring: "border-primary/40 bg-primary/[0.04]",
  },
  bull: {
    icon: TrendingUp,
    accent: "text-[oklch(0.7_0.13_200)]",
    ring: "border-border",
  },
}

export function ScenarioCard({
  scenario,
  target,
  highlight,
}: {
  scenario: Scenario
  target: number
  highlight?: boolean
}) {
  const { format } = useCurrency()
  const meta = META[scenario.key]
  const Icon = meta.icon
  const meetsTarget = scenario.finalAmount >= target

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 sm:p-6",
        highlight
          ? "glass-card glass-card-glow border-primary/40 bg-primary/[0.06]"
          : "glass-card",
      )}
    >
      {/* Reserved badge row — keeps the figures below aligned across all cards */}
      <div className="mb-3 flex h-5 items-center">
        {highlight ? (
          <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
            Most likely
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className={cn("size-4 shrink-0", meta.accent)} aria-hidden="true" />
          {scenario.label}
        </span>
        <span className={cn("shrink-0 font-mono text-xs", meta.accent)}>
          {scenario.annualRate >= 0 ? "+" : ""}
          {(scenario.annualRate * 100).toFixed(0)}%/yr
        </span>
      </div>

      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
        {format(scenario.finalAmount)}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        {meetsTarget ? (
          <span className="text-primary">
            {format(scenario.finalAmount - target)} above target
          </span>
        ) : (
          <span className="text-muted-foreground">
            {format(target - scenario.finalAmount)} short of target
          </span>
        )}
      </p>
    </div>
  )
}
