"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { usePlan } from "@/components/plan-provider"
import {
  HoldingsInput,
  makeEmptyHolding,
  type Holding,
} from "@/components/holdings-input"
import { riskLabel } from "@/lib/projection"

// Short descriptor shown next to the continuous risk-tolerance label.
const RISK_BLURBS: Record<string, string> = {
  Low: "Capital preservation, steadier returns",
  "Low-Medium": "Mostly defensive with some growth",
  Medium: "Balanced growth and volatility",
  "Medium-High": "Growth-tilted, bigger swings",
  High: "Maximum growth, wider swings",
}

const HOW_IT_WORKS: { title: string; description: string }[] = [
  {
    title: "List what you hold",
    description: "Add your positions and current balances.",
  },
  {
    title: "Set your number",
    description: "Choose a target amount and age.",
  },
  {
    title: "See your odds",
    description: "We model Bear, Base, and Bull outcomes.",
  },
]

/** Parse an age input into a whole, non-negative number. */
function parseAge(value: string): number {
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export default function FormPage() {
  const router = useRouter()
  const { setPlan } = usePlan()

  const [holdings, setHoldings] = useState<Holding[]>(() => [
    { id: "h1", ticker: "SPY", amount: "1,500" },
    { id: "h2", ticker: "NVDA", amount: "1,000" },
    makeEmptyHolding(),
  ])
  const [monthly, setMonthly] = useState("150")
  const [riskScore, setRiskScore] = useState(50)
  const [target, setTarget] = useState("50,000")
  const [currentAge, setCurrentAge] = useState("25")
  const [targetAge, setTargetAge] = useState("35")
  const [calculating, setCalculating] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setCalculating(true)
    // Serialize structured rows into the "TICKER — amount" lines the
    // projection's holdings parser already understands.
    const serialized = holdings
      .filter((h) => h.amount.trim() !== "")
      .map((h) => `${h.ticker || "Holding"} — ${h.amount}`)
      .join("\n")
    setPlan({
      holdings: serialized,
      monthly: parseMoney(monthly),
      riskScore,
      target: parseMoney(target),
      currentAge: parseAge(currentAge),
      targetAge: parseAge(targetAge),
    })
    // Brief delay so the calculating state is perceptible before navigating.
    setTimeout(() => router.push("/results"), 650)
  }

  const riskName = riskLabel(riskScore)
  const yearsToGoal = Math.max(0, parseAge(targetAge) - parseAge(currentAge))

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(180deg, oklch(0.23 0.035 255) 0%, oklch(0.18 0.018 250) 32%, var(--background) 70%)",
      }}
    >
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        {/* Hero */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
              Scenario planning
            </span>
            <span className="h-px w-12 bg-primary/40" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Will you reach <span className="text-primary">your number?</span>
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Tell Reckon what you hold and where you want to be. We&apos;ll show
            you exactly how close you are across market conditions, and how to
            close any gap.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.65fr_1fr]">
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Holdings */}
            <Field
              label="Current investment holdings"
              hint="Add each position with its ticker and current dollar balance."
              htmlFor="holdings"
            >
              <HoldingsInput holdings={holdings} onChange={setHoldings} />
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
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <span className="text-base font-semibold text-primary">
                    {riskName}
                  </span>
                  <span className="text-right text-xs text-muted-foreground">
                    {RISK_BLURBS[riskName]}
                  </span>
                </div>
                <input
                  id="risk"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={riskScore}
                  onChange={(e) => setRiskScore(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
                  aria-valuetext={`${riskName} (${riskScore} of 100)`}
                />
                <div className="mt-2 flex justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </Field>

            {/* Ages */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Your current age"
                htmlFor="currentAge"
                hint={
                  yearsToGoal > 0
                    ? `${yearsToGoal} year${yearsToGoal === 1 ? "" : "s"} to your goal.`
                    : "Target age should be greater than your current age."
                }
              >
                <AgeInput
                  id="currentAge"
                  value={currentAge}
                  onChange={setCurrentAge}
                  placeholder="30"
                />
              </Field>

              <Field label="Age you want to reach this by" htmlFor="targetAge">
                <AgeInput
                  id="targetAge"
                  value={targetAge}
                  onChange={setTargetAge}
                  placeholder="40"
                />
              </Field>
            </div>

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

            {/* Reassurance badge */}
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
              <span
                className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
                aria-hidden="true"
              />
              Local computation — your data never leaves your machine.
            </span>
          </form>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            {/* Your target */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Your target
              </p>
              <p className="mt-3 font-mono text-4xl font-bold tracking-tight text-foreground">
                ${target || "0"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                by age {parseAge(targetAge) || "—"}
                {yearsToGoal > 0
                  ? ` · ${yearsToGoal} year${yearsToGoal === 1 ? "" : "s"} away`
                  : ""}
              </p>
            </div>

            {/* How this works */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                How this works
              </p>
              <ol className="mt-4 flex flex-col gap-4">
                {HOW_IT_WORKS.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
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

function AgeInput({
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
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 3))}
      placeholder={placeholder}
      className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
    />
  )
}
