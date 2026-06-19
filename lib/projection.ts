export type Risk = "low" | "medium" | "high"

export type PlanInput = {
  holdings: string
  monthly: number
  risk: Risk
  target: number
  targetDate: string // ISO yyyy-mm-dd
}

export type ScenarioKey = "bear" | "base" | "bull"

export type Scenario = {
  key: ScenarioKey
  label: string
  annualRate: number
  finalAmount: number
}

export type SuggestedAction = {
  title: string
  detail: string
}

export type Projection = {
  startingPrincipal: number
  months: number
  years: number
  scenarios: Record<ScenarioKey, Scenario>
  target: number
  goalMet: boolean
  surplus: number // base final - target (negative = shortfall)
  actions: SuggestedAction[]
}

// Annual return assumptions per risk band: [bear, base, bull]
const RATES: Record<Risk, { bear: number; base: number; bull: number }> = {
  low: { bear: 0.01, base: 0.04, bull: 0.07 },
  medium: { bear: 0.0, base: 0.07, bull: 0.11 },
  high: { bear: -0.03, base: 0.1, bull: 0.16 },
}

const RISK_ORDER: Risk[] = ["low", "medium", "high"]

/** Sum every number found in the free-text holdings list. */
export function parseHoldings(holdings: string): number {
  if (!holdings) return 0
  const matches = holdings.match(/[\d,]+(\.\d+)?/g)
  if (!matches) return 0
  return matches.reduce((sum, raw) => {
    const n = Number.parseFloat(raw.replace(/,/g, ""))
    return Number.isFinite(n) ? sum + n : sum
  }, 0)
}

/** Months from today (inclusive of partial) until the target date. */
export function monthsUntil(targetDate: string): number {
  const now = new Date()
  const end = new Date(targetDate)
  if (Number.isNaN(end.getTime())) return 0
  const months =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth())
  return Math.max(0, months)
}

/** Future value of a principal plus recurring monthly contributions. */
export function futureValue(
  principal: number,
  monthly: number,
  annualRate: number,
  months: number,
): number {
  if (months <= 0) return principal
  const r = annualRate / 12
  if (Math.abs(r) < 1e-9) {
    return principal + monthly * months
  }
  const growth = Math.pow(1 + r, months)
  return principal * growth + monthly * ((growth - 1) / r)
}

/** Monthly contribution required to reach a target under a given rate. */
function requiredMonthly(
  principal: number,
  annualRate: number,
  months: number,
  target: number,
): number {
  if (months <= 0) return Number.POSITIVE_INFINITY
  const r = annualRate / 12
  if (Math.abs(r) < 1e-9) {
    return Math.max(0, (target - principal) / months)
  }
  const growth = Math.pow(1 + r, months)
  const needed = (target - principal * growth) / ((growth - 1) / r)
  return Math.max(0, needed)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function buildProjection(input: PlanInput): Projection {
  const startingPrincipal = parseHoldings(input.holdings)
  const months = monthsUntil(input.targetDate)
  const years = months / 12
  const rates = RATES[input.risk]

  const scenarios: Record<ScenarioKey, Scenario> = {
    bear: {
      key: "bear",
      label: "Bear",
      annualRate: rates.bear,
      finalAmount: futureValue(startingPrincipal, input.monthly, rates.bear, months),
    },
    base: {
      key: "base",
      label: "Base",
      annualRate: rates.base,
      finalAmount: futureValue(startingPrincipal, input.monthly, rates.base, months),
    },
    bull: {
      key: "bull",
      label: "Bull",
      annualRate: rates.bull,
      finalAmount: futureValue(startingPrincipal, input.monthly, rates.bull, months),
    },
  }

  const baseFinal = scenarios.base.finalAmount
  const surplus = baseFinal - input.target
  const goalMet = surplus >= 0

  const actions = buildActions(input, scenarios, startingPrincipal, months)

  return {
    startingPrincipal,
    months,
    years,
    scenarios,
    target: input.target,
    goalMet,
    surplus,
    actions,
  }
}

function buildActions(
  input: PlanInput,
  scenarios: Record<ScenarioKey, Scenario>,
  principal: number,
  months: number,
): SuggestedAction[] {
  const actions: SuggestedAction[] = []
  const gap = input.target - scenarios.base.finalAmount

  if (gap <= 0) {
    // On track — give optimizing suggestions instead of gap-closers.
    const surplus = scenarios.base.finalAmount - input.target
    actions.push({
      title: "You're on pace — protect the plan",
      detail: `Your Base scenario clears the target by ${formatCurrency(surplus)}. Keep contributions automatic so you don't drift off track.`,
    })
    actions.push({
      title: "Consider reaching the goal sooner",
      detail:
        "You have room to pull the target date forward, or to ease risk slightly while still hitting your number.",
    })
    actions.push({
      title: "Build a cushion for Bear markets",
      detail: `In a downturn you'd land near ${formatCurrency(scenarios.bear.finalAmount)}. A small buffer keeps you covered if returns disappoint.`,
    })
    return actions
  }

  // 1. Increase monthly contribution to close the gap at the base rate.
  const needMonthly = requiredMonthly(principal, scenarios.base.annualRate, months, input.target)
  const extra = Math.max(0, needMonthly - input.monthly)
  if (Number.isFinite(extra) && extra > 0) {
    actions.push({
      title: `Add ${formatCurrency(extra)} to your monthly contribution`,
      detail: `Raising contributions from ${formatCurrency(input.monthly)} to about ${formatCurrency(needMonthly)} per month puts the Base scenario on target.`,
    })
  }

  // 2. Extend the timeline.
  const extraMonths = extraMonthsToHit(principal, input.monthly, scenarios.base.annualRate, input.target, months)
  if (extraMonths !== null && extraMonths > 0) {
    const extraYears = (extraMonths / 12)
    actions.push({
      title: `Extend your timeline by about ${formatTimespan(extraMonths)}`,
      detail: `Giving the plan ${extraYears < 1 ? "a few more months" : `roughly ${extraYears.toFixed(1)} more years`} of compounding reaches the target at the Base rate.`,
    })
  }

  // 3. Step up risk band if not already aggressive.
  const idx = RISK_ORDER.indexOf(input.risk)
  if (idx < RISK_ORDER.length - 1) {
    const nextRisk = RISK_ORDER[idx + 1]
    const nextBase = RATES[nextRisk].base
    const projected = futureValue(principal, input.monthly, nextBase, months)
    actions.push({
      title: `Shift toward a ${nextRisk}-risk allocation`,
      detail: `A ${nextRisk}-risk mix targets ~${(nextBase * 100).toFixed(0)}% annual returns, lifting your Base projection to about ${formatCurrency(projected)} — though with wider swings.`,
    })
  } else {
    actions.push({
      title: "Reduce the target or trim fees",
      detail:
        "You're already at the highest risk band. Lowering the goal, cutting investment fees, or adding a lump sum are the remaining levers.",
    })
  }

  return actions.slice(0, 3)
}

function extraMonthsToHit(
  principal: number,
  monthly: number,
  annualRate: number,
  target: number,
  currentMonths: number,
): number | null {
  if (monthly <= 0 && principal <= 0) return null
  for (let m = currentMonths + 1; m <= currentMonths + 600; m++) {
    if (futureValue(principal, monthly, annualRate, m) >= target) {
      return m - currentMonths
    }
  }
  return null
}

function formatTimespan(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`
  const years = Math.round((months / 12) * 10) / 10
  return `${years} year${years === 1 ? "" : "s"}`
}
