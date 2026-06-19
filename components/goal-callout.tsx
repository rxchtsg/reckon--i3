import { CheckCircle2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, type Projection } from "@/lib/projection"

export function GoalCallout({ projection }: { projection: Projection }) {
  const { goalMet, surplus, target, scenarios } = projection
  const amount = Math.abs(surplus)

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-6 sm:flex-row sm:items-center",
        goalMet
          ? "border-primary/40 bg-primary/[0.07]"
          : "border-destructive/40 bg-destructive/[0.08]",
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
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

      <div className="flex-1">
        <h2 className="text-lg font-semibold tracking-tight">
          {goalMet ? "You're on track to hit your goal" : "You're facing a shortfall"}
        </h2>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
          In the Base scenario your portfolio reaches{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(scenarios.base.finalAmount)}
          </span>
          {goalMet ? (
            <>
              {" "}
              — about{" "}
              <span className="font-medium text-primary">
                {formatCurrency(amount)}
              </span>{" "}
              past your {formatCurrency(target)} target.
            </>
          ) : (
            <>
              {" "}
              — roughly{" "}
              <span className="font-medium text-destructive">
                {formatCurrency(amount)}
              </span>{" "}
              short of your {formatCurrency(target)} target.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
