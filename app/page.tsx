"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { usePlan } from "@/components/plan-provider"
import type { Risk } from "@/lib/projection"

const RISK_LEVELS: { value: Risk; label: string; blurb: string }[] = [
  { value: "low", label: "Low", blurb: "Capital preservation, steadier returns" },
  { value: "medium", label: "Medium", blurb: "Balanced growth and volatility" },
  { value: "high", label: "High", blurb: "Maximum growth, wider swings" },
]

function defaultTargetDate() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 10)
  return d.toISOString().slice(0, 10)
}

export default function FormPage() {
  const router = useRouter()
  const { setPlan } = usePlan()

  const [holdings, setHoldings] = useState(
    "VTSAX — 42,000\nApple (AAPL) — 8,500\nCash — 5,000",
  )
  const [monthly, setMonthly] = useState("1,000")
  const [riskIndex, setRiskIndex] = useState(1)
  const [target, setTarget] = useState("250,000")
  const [targetDate, setTargetDate] = useState(defaultTargetDate())
  const [calculating, setCalculating] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCalculating(true)
    setPlan({
      holdings,
      monthly: parseMoney(monthly),
      risk: RISK_LEVELS[riskIndex].value,
      target: parseMoney(target),
      targetDate,
    })
    // Brief delay so the calculating state is perceptible before navigating.
    setTimeout(() => router.push("/results"), 650)
  }

  const risk = RISK_LEVELS[riskIndex]

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground">
            <TrendingUp className="size-3.5 text-primary" aria-hidden="true" />
            Scenario planning
          </span>
          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Will you reach your number?
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Tell Reckon what you hold and where you want to be. We&apos;ll show
            you exactly how close you are, and how to close any gap.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Holdings */}
          <Field
            label="Current investment holdings"
            hint="List each position on its own line — we'll total the dollar amounts."
            htmlFor="holdings"
          >
            <textarea
              id="holdings"
              value={holdings}
              onChange={(e) => setHoldings(e.target.value)}
              rows={4}
              placeholder={"Index fund — 30,000\nBrokerage — 12,500"}
              className="w-full resize-y rounded-lg border border-input bg-card px-3.5 py-3 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Monthly contribution */}
            <Field label="Monthly contribution" htmlFor="monthly">
              <MoneyInput
                id="monthly"
                value={monthly}
                onChange={setMonthly}
                placeholder="1,000"
              />
            </Field>

            {/* Target amount */}
            <Field label="Target amount" htmlFor="target">
              <MoneyInput
                id="target"
                value={target}
                onChange={setTarget}
                placeholder="250,000"
              />
            </Field>
          </div>

          {/* Risk tolerance */}
          <Field label="Risk tolerance" htmlFor="risk">
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
          </Field>

          {/* Target date */}
          <Field label="Target date" htmlFor="targetDate">
            <input
              id="targetDate"
              type="date"
              value={targetDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors [color-scheme:dark] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={calculating}
            aria-busy={calculating}
            className="mt-2 h-12 w-full text-base font-semibold"
          >
            {calculating ? (
              <>
                <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
                Calculating projection…
              </>
            ) : (
              <>
                Run my projection
                <ArrowRight className="size-4.5" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Strip formatting and parse a money string into a number. */
function parseMoney(value: string): number {
  return Number.parseFloat(value.replace(/,/g, "")) || 0
}

/** Add thousands separators while preserving an in-progress decimal. */
function formatWithCommas(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "")
  if (cleaned === "") return ""
  const [intPart, ...rest] = cleaned.split(".")
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return rest.length > 0 ? `${grouped}.${rest.join("")}` : grouped
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex items-center rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
      <span className="pl-3.5 font-mono text-sm text-muted-foreground">$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(formatWithCommas(e.target.value))}
        placeholder={placeholder}
        className="w-full rounded-lg bg-transparent py-2.5 pl-1.5 pr-3.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  )
}
