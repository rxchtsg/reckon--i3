"use client"

import { useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { usePlan } from "@/components/plan-provider"
import { ScenarioCard } from "@/components/scenario-card"
import { GoalCallout } from "@/components/goal-callout"
import { SuggestedActions } from "@/components/suggested-actions"
import { PortfolioOptimization } from "@/components/portfolio-optimization"
import { buildProjection, formatCurrency, riskLabel } from "@/lib/projection"
import { fetchReturnRates } from "@/lib/returns"

// Shared dark navy→black gradient, identical to the landing page.
const GRADIENT_BG = {
  backgroundImage:
    "linear-gradient(180deg, oklch(0.23 0.035 255) 0%, oklch(0.18 0.018 250) 32%, var(--background) 70%)",
}

export default function ResultsPage() {
  const { plan } = usePlan()

  // Live historical-return rates, cached by SWR. Falls back to the fixed
  // defaults inside buildProjection whenever this is undefined/null.
  const { data: liveRates, isLoading: ratesLoading } = useSWR(
    "return-rates",
    fetchReturnRates,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  const projection = useMemo(
    () => (plan ? buildProjection(plan, liveRates ?? undefined) : null),
    [plan, liveRates],
  )

  if (!plan || !projection) {
    return (
      <div className="min-h-screen" style={GRADIENT_BG}>
        <SiteHeader />
        <main className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            No projection yet
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            Fill out your plan details first and we&apos;ll model your Bear,
            Base, and Bull scenarios.
          </p>
          <Button render={<Link href="/" />} size="lg" className="mt-6">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Start your plan
          </Button>
        </main>
      </div>
    )
  }

  const targetAgeLabel = `age ${plan.targetAge}`

  return (
    <div className="min-h-screen" style={GRADIENT_BG}>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Edit plan
          </Link>
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Target {formatCurrency(plan.target)} · by {targetAgeLabel}
          </p>
        </div>

        {/* Eyebrow badge — matches the landing page's "Scenario planning" badge */}
        <div className="mt-8 flex items-center gap-3">
          <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Your results
          </span>
          <span className="h-px w-12 bg-primary/40" aria-hidden="true" />
        </div>

        {/* Callout — the hero message everything else supports */}
        <div className="mt-5">
          <GoalCallout projection={projection} />
        </div>

        {/* Summary strip */}
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <SummaryStat label="Starting" value={formatCurrency(projection.startingPrincipal)} />
          <SummaryStat label="Monthly" value={formatCurrency(plan.monthly)} />
          <SummaryStat label="Risk" value={`${riskLabel(plan.riskScore)} · ${Math.round(plan.riskScore)}`} />
          <SummaryStat label="Target age" value={`Age ${plan.targetAge}`} />
        </dl>

        {/* Scenarios — supporting detail */}
        <div className="mt-12">
          <h2 className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How each scenario plays out
          </h2>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Projected final amount over {projection.years.toFixed(1)} years.
            </p>
            {!ratesLoading && (
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
                {liveRates ? "· Live market data" : "· Fixed estimates"}
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <ScenarioCard scenario={projection.scenarios.bear} target={plan.target} />
            <ScenarioCard scenario={projection.scenarios.base} target={plan.target} highlight />
            <ScenarioCard scenario={projection.scenarios.bull} target={plan.target} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10">
          <SuggestedActions actions={projection.actions} goalMet={projection.baseGoalMet} />
        </div>

        {/* Portfolio optimization upsell */}
        <div className="mt-8">
          <PortfolioOptimization />
        </div>

        <p className="mt-10 text-pretty text-xs leading-relaxed text-muted-foreground">
          Projections are illustrative estimates based on assumed average annual
          returns and do not account for taxes, inflation, or market timing.
          Reckon is not financial advice.
        </p>
      </main>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  )
}
