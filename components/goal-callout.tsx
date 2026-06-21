import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, type Projection } from "@/lib/projection"

type Tier = "on-track" | "at-risk" | "shortfall"

function getTier({ goalMet, baseGoalMet }: Projection): Tier {
  if (goalMet) return "on-track"
  if (baseGoalMet) return "at-risk"
  return "shortfall"
}

const TIER_CONFIG = {
  "on-track": {
    section: "border-primary/30 bg-primary/[0.07]",
    iconWrap: "bg-primary/15 text-primary",
    icon: CheckCircle2,
    label: "text-primary",
    labelText: "On track",
    heading: "You're on track to hit your goal",
    amountColor: "text-primary",
    amountPrefix: "+",
    amountSuffix: "past your target",
  },
  "at-risk": {
    section: "border-amber-500/30 bg-amber-500/[0.06]",
    iconWrap: "bg-amber-500/15 text-amber-400",
    icon: AlertCircle,
    label: "text-amber-400",
    labelText: "At risk",
    heading: "Your plan works — but has downside exposure",
    amountColor: "text-amber-400",
    amountPrefix: "−",
    amountSuffix: "exposed in a downturn",
  },
  shortfall: {
    section: "border-destructive/30 bg-destructive/[0.08]",
    iconWrap: "bg-destructive/15 text-destructive",
    icon: AlertTriangle,
    label: "text-destructive",
    labelText: "Shortfall",
    heading: "You're facing a shortfall",
    amountColor: "text-destructive",
    amountPrefix: "−",
    amountSuffix: "below your target",
  },
} as const

export function GoalCallout({ projection }: { projection: Projection }) {
  const { surplus } = projection
  const tier = getTier(projection)
  const cfg = TIER_CONFIG[tier]
  const Icon = cfg.icon
  const amount = Math.abs(surplus)

  return (
    <section
      aria-live="polite"
      className={cn("relative overflow-hidden rounded-xl border p-7 sm:p-9", cfg.section)}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            cfg.iconWrap,
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span
          className={cn(
            "font-mono text-xs font-medium uppercase tracking-[0.2em]",
            cfg.label,
          )}
        >
          {cfg.labelText}
        </span>
      </div>

      <h2 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {cfg.heading}
      </h2>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "font-mono text-4xl font-bold tracking-tight sm:text-5xl",
            cfg.amountColor,
          )}
        >
          {cfg.amountPrefix}
          {formatCurrency(amount)}
        </span>
        <span className="text-base text-muted-foreground">{cfg.amountSuffix}</span>
      </p>

      <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
        {projection.rationale}
      </p>
    </section>
  )
}
