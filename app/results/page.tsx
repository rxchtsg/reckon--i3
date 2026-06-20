"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { usePlan } from "@/components/plan-provider"
import { ScenarioCard } from "@/components/scenario-card"
import { GoalCallout } from "@/components/goal-callout"
import { SuggestedActions } from "@/components/suggested-actions"
import { buildProjection, formatCurrency } from "@/lib/projection"

export default function ResultsPage() {
  const { plan } = usePlan()

  const projection = useMemo(
    () => (plan ? buildProjection(plan) : null),
    [plan],
  )

  if (!plan || !projection) {
    return (
      <div className="min-h-screen">
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

  const targetDate = new Date(plan.targetDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen">
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
            Target {formatCurrency(plan.target)} · {targetDate}
          </p>
        </div>

        {/* Callout — the hero message everything else supports */}
        <div className="mt-6">
          <GoalCallout projection={projection} />
        </div>

        {/* Summary strip */}
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          <SummaryStat label="Starting" value={formatCurrency(projection.startingPrincipal)} />
          <SummaryStat label="Monthly" value={formatCurrency(plan.monthly)} />
          <SummaryStat label="Risk" value={cap(plan.risk)} />
          <SummaryStat label="Target date" value={targetDate} />
        </dl>

        {/* Scenarios — supporting detail */}
        <div className="mt-12">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            How each scenario plays out
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Projected final amount over {projection.years.toFixed(1)} years.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <ScenarioCard scenario={projection.scenarios.bear} target={plan.target} />
            <ScenarioCard scenario={projection.scenarios.base} target={plan.target} highlight />
            <ScenarioCard scenario={projection.scenarios.bull} target={plan.target} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10">
          <SuggestedActions actions={projection.actions} goalMet={projection.goalMet} />
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
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  )
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
