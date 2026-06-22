export type Risk = "low" | "medium" | "high"

export type PlanInput = {
  holdings: string
  monthly: number
  riskScore: number // continuous 0-100 risk tolerance
  target: number
  currentAge: number
  targetAge: number
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
  baseGoalMet: boolean // base (most likely) final >= target — drives action framing
  surplus: number // bear final - target (negative = shortfall)
  actions: SuggestedAction[]
  rationale: string // dynamic plain-language explanation of the primary driver
}

export type ScenarioRates = { bear: number; base: number; bull: number }
export type RiskRates = Record<Risk, ScenarioRates>

// Fixed fallback annual return assumptions per risk band: [bear, base, bull].
// Used whenever live historical data is unavailable.
export const DEFAULT_RATES: RiskRates = {
  low: { bear: 0.01, base: 0.04, bull: 0.07 },
  medium: { bear: 0.0, base: 0.07, bull: 0.11 },
  high: { bear: -0.03, base: 0.1, bull: 0.16 },
}

/**
 * Map a continuous 0-100 risk score onto bear/base/bull rates by linearly
 * interpolating across the three underlying bands (low → medium → high).
 * This keeps the active assumptions — fetched market rates or the fixed
 * fallback — fully in play while letting the slider move continuously.
 */
export function ratesForScore(
  score: number,
  riskRates: RiskRates = DEFAULT_RATES,
): ScenarioRates {
  const s = Math.min(100, Math.max(0, score))
  const t = s / 50 // 0 at low, 1 at medium, 2 at high
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f
  const pick = (key: keyof ScenarioRates) =>
    t <= 1
      ? lerp(riskRates.low[key], riskRates.medium[key], t)
      : lerp(riskRates.medium[key], riskRates.high[key], t - 1)
  return { bear: pick("bear"), base: pick("base"), bull: pick("bull") }
}

/** Human-readable label for a 0-100 risk score. */
export function riskLabel(score: number): string {
  if (score < 20) return "Low"
  if (score < 40) return "Low-Medium"
  if (score < 60) return "Medium"
  if (score < 80) return "Medium-High"
  return "High"
}

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

/** Whole months implied by the gap between current age and target age. */
export function monthsFromAges(currentAge: number, targetAge: number): number {
  const years = Math.max(0, targetAge - currentAge)
  return Math.round(years * 12)
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

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

/** USD formatter retained for callers that always want the base currency. */
export const formatCurrency = formatUSD

// Active money formatter used by the projection's generated prose. Defaults to
// USD, but buildProjection can swap in a currency-aware formatter so the
// rationale and suggested-action copy reflect the user's selected currency.
let activeFormat: (value: number) => string = formatUSD

function fmt(value: number): string {
  return activeFormat(value)
}

function buildRationale(
  input: PlanInput,
  scenarios: Record<ScenarioKey, Scenario>,
  startingPrincipal: number,
  months: number,
  riskRates: RiskRates,
): string {
  const baseRate = scenarios.base.annualRate
  const baseFinal = scenarios.base.finalAmount
  const bearFinal = scenarios.bear.finalAmount
  const years = months / 12
  const goalMet = bearFinal >= input.target
  const baseGoalMet = baseFinal >= input.target

  if (goalMet) {
    const principalCompounded = futureValue(startingPrincipal, 0, baseRate, months)
    const contributionFV = baseFinal - principalCompounded
    const surplus = baseFinal - input.target

    if (startingPrincipal > 0 && principalCompounded >= input.target * 0.75) {
      return `Your ${fmt(startingPrincipal)} starting balance compounds to ${fmt(principalCompounded)} at the Base return rate — contributions add the cushion that puts you ${fmt(surplus)} past your ${fmt(input.target)} goal.`
    }
    if (input.monthly > 0 && contributionFV > principalCompounded * 1.2) {
      return `Your ${fmt(input.monthly)}/month contribution rate is the main growth engine, adding ${fmt(contributionFV)} over ${years.toFixed(1)} years — comfortably clearing your ${fmt(input.target)} target with ${fmt(surplus)} to spare.`
    }
    const parts = [
      startingPrincipal > 0 ? `${fmt(startingPrincipal)} starting balance` : null,
      input.monthly > 0 ? `${fmt(input.monthly)}/month` : null,
    ].filter(Boolean).join(" and ")
    return `Your ${parts} over ${years.toFixed(1)} years reaches ${fmt(baseFinal)} at current return assumptions — clearing your ${fmt(input.target)} target by ${fmt(surplus)}.`
  }

  if (!baseGoalMet) {
    const neededMonthly = requiredMonthly(startingPrincipal, baseRate, months, input.target)
    const monthlyIncrease = neededMonthly - input.monthly
    const extraMonths = extraMonthsToHit(startingPrincipal, input.monthly, baseRate, input.target, months)
    const monthlyRatio = input.monthly > 0 ? neededMonthly / input.monthly : Infinity
    const timeRatio = extraMonths !== null ? extraMonths / Math.max(1, months) : Infinity

    if (Number.isFinite(neededMonthly) && monthlyRatio <= 2.5 && monthlyRatio <= timeRatio + 0.5) {
      return `Your ${fmt(input.monthly)}/month contribution isn't enough to close this gap within ${years.toFixed(1)} years at current return assumptions — increasing it by ${fmt(monthlyIncrease)}/month to ${fmt(neededMonthly)} is your most efficient lever.`
    }
    if (extraMonths !== null && timeRatio <= 0.25) {
      const label = extraMonths < 12 ? `${extraMonths} months` : `${(extraMonths / 12).toFixed(1)} years`
      return `At ${fmt(input.monthly)}/month you're close — extending your timeline by ${label} lets compounding close the gap without raising contributions.`
    }
    if (Number.isFinite(neededMonthly) && monthlyRatio <= 4.0) {
      return `Your ${fmt(input.monthly)}/month contribution isn't enough to close this gap within ${years.toFixed(1)} years at current return assumptions — increasing it is your most efficient lever.`
    }
    if (extraMonths !== null) {
      return `The ${years.toFixed(1)}-year window is the binding constraint — at ${fmt(input.monthly)}/month you'd need roughly ${(extraMonths / 12).toFixed(1)} more years to close the gap at current return assumptions.`
    }
    return `The gap of ${fmt(input.target - baseFinal)} is significant relative to your ${years.toFixed(1)}-year window — closing it will require meaningfully higher contributions, more time, or both.`
  }

  // Base is on track but bear falls short
  return `Your Base and Bull scenarios are on track, but a market downturn leaves a ${fmt(input.target - bearFinal)} shortfall. Adding a small buffer would protect you against a bad stretch of returns.`
}

export function buildProjection(
  input: PlanInput,
  riskRates: RiskRates = DEFAULT_RATES,
  formatMoney: (value: number) => string = formatUSD,
): Projection {
  // The generated prose (rationale + actions) formats money through `fmt`, so
  // point it at the caller's currency-aware formatter for this build.
  activeFormat = formatMoney
  const startingPrincipal = parseHoldings(input.holdings)
  const months = monthsFromAges(input.currentAge, input.targetAge)
  const years = months / 12
  const rates = ratesForScore(input.riskScore, riskRates)

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

  // Headline status reflects the conservative (Bear) case: the goal is only
  // considered "met" if it holds up even in a downturn.
  const bearFinal = scenarios.bear.finalAmount
  const surplus = bearFinal - input.target
  const goalMet = surplus >= 0

  // The suggested actions are framed around the Base (most likely) outcome, so
  // the action heading must use the same measure to stay consistent.
  const baseGoalMet = scenarios.base.finalAmount >= input.target

  const actions = buildActions(input, scenarios, startingPrincipal, months, riskRates)
  const rationale = buildRationale(input, scenarios, startingPrincipal, months, riskRates)

  return {
    startingPrincipal,
    months,
    years,
    scenarios,
    target: input.target,
    goalMet,
    baseGoalMet,
    surplus,
    actions,
    rationale,
  }
}

function buildActions(
  input: PlanInput,
  scenarios: Record<ScenarioKey, Scenario>,
  principal: number,
  months: number,
  riskRates: RiskRates,
): SuggestedAction[] {
  const actions: SuggestedAction[] = []
  const gap = input.target - scenarios.base.finalAmount

  if (gap <= 0) {
    // On track — give optimizing suggestions instead of gap-closers.
    const surplus = scenarios.base.finalAmount - input.target
    actions.push({
      title: "You're on pace — protect the plan",
      detail: `Your Base scenario clears the target by ${fmt(surplus)}. Keep contributions automatic so you don't drift off track.`,
    })
    actions.push({
      title: "Consider reaching the goal sooner",
      detail:
        "You have room to pull the target date forward, or to ease risk slightly while still hitting your number.",
    })
    actions.push({
      title: "Build a cushion for Bear markets",
      detail: `In a downturn you'd land near ${fmt(scenarios.bear.finalAmount)}. A small buffer keeps you covered if returns disappoint.`,
    })
    return actions
  }

  // 1. Increase monthly contribution to close the gap at the base rate.
  const needMonthly = requiredMonthly(principal, scenarios.base.annualRate, months, input.target)
  const extra = Math.max(0, needMonthly - input.monthly)
  if (Number.isFinite(extra) && extra > 0) {
    actions.push({
      title: `Add ${fmt(extra)} to your monthly contribution`,
      detail: `Raising contributions from ${fmt(input.monthly)} to about ${fmt(needMonthly)} per month puts the Base scenario on target.`,
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

  // 3. Move the risk slider higher to close the gap at the new Base rate.
  const targetScore = scoreToHitTarget(
    principal,
    input.monthly,
    months,
    input.target,
    riskRates,
    input.riskScore,
  )
  if (targetScore !== null) {
    const newBase = ratesForScore(targetScore, riskRates).base
    const projected = futureValue(principal, input.monthly, newBase, months)
    actions.push({
      title: `Move the risk slider to approximately ${Math.round(targetScore)}`,
      detail: `Raising your risk setting from about ${Math.round(input.riskScore)} to ${Math.round(targetScore)} (of 100) targets roughly ${(newBase * 100).toFixed(1)}% annual returns, lifting your Base projection to about ${fmt(projected)} — though with wider swings.`,
    })
  } else {
    actions.push({
      title: "Reduce the target or trim fees",
      detail:
        "Even at the maximum risk setting the gap remains. Lowering the goal, cutting investment fees, or adding a lump sum are the remaining levers.",
    })
  }

  return actions.slice(0, 3)
}

/**
 * Smallest risk-slider position (above the current one) whose Base rate would
 * reach the target in the available time, or null if even 100 falls short.
 */
function scoreToHitTarget(
  principal: number,
  monthly: number,
  months: number,
  target: number,
  riskRates: RiskRates,
  currentScore: number,
): number | null {
  for (let s = Math.ceil(currentScore) + 1; s <= 100; s++) {
    const base = ratesForScore(s, riskRates).base
    if (futureValue(principal, monthly, base, months) >= target) return s
  }
  return null
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
