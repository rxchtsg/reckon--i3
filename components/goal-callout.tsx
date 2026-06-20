import { CheckCircle2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, type Projection } from "@/lib/projection"

export function GoalCallout({ projection }: { projection: Projection }) {
  const { goalMet, surplus } = projection
  const amount = Math.abs(surplus)

  return (
    <section
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-xl border p-7 sm:p-9",
        goalMet
          ? "border-primary/30 bg-primary/[0.07]"
          : "border-destructive/30 bg-destructive/[0.08]",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            goalMet
              ? "bg-primary/15 text-primary"
              : "bg-destructive/15 text-destructive",
          )}
        >
          {goalMet ? (
            <CheckCircle2 className="size-6" aria-hidden="true" />
          ) : (
            <AlertTriangle className="size-6" aria-hidden="true" />
          )}
        </span>
        <span
          className={cn(
            "font-mono text-xs font-medium uppercase tracking-[0.2em]",
            goalMet ? "text-primary" : "text-destructive",
          )}
        >
          {goalMet ? "On track" : "Shortfall"}
        </span>
      </div>

      <h2 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {goalMet
          ? "You're on track to hit your goal"
          : "You're facing a shortfall"}
      </h2>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            "font-mono text-4xl font-bold tracking-tight sm:text-5xl",
            goalMet ? "text-primary" : "text-destructive",
          )}
        >
          {goalMet ? "+" : "−"}
          {formatCurrency(amount)}
        </span>
        <span className="text-base text-muted-foreground">
          {goalMet ? "past your target" : "below your target"}
        </span>
      </p>

      <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
        {projection.rationale}
      </p>
    </section>
  )
}
