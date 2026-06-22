"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import useSWR from "swr"

export type Currency = {
  code: string
  symbol: string
  name: string
}

// Major world currencies. The first three are surfaced as quick-select
// buttons; the full list powers the searchable dropdown.
export const QUICK_CODES = ["GBP", "EUR", "USD"] as const

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "ARS", symbol: "AR$", name: "Argentine Peso" },
  { code: "CLP", symbol: "CL$", name: "Chilean Peso" },
  { code: "COP", symbol: "CO$", name: "Colombian Peso" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
]

const CURRENCY_MAP: Record<string, Currency> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
)

const STORAGE_KEY = "reckon.currency"
const BASE: Currency = CURRENCY_MAP.USD

type CurrencyContextValue = {
  /** Currently selected currency. */
  currency: Currency
  /** Conversion rate from USD → selected currency (1 when USD). */
  rate: number
  /** Whether the selected currency's live rate has loaded yet. */
  ratesReady: boolean
  /** True while the selected currency is the USD base. */
  isUsd: boolean
  /** Select a new currency by code. Persists across pages. */
  setCurrency: (code: string) => void
  /** Convert a USD value into the selected currency (no formatting). */
  convert: (usdValue: number) => number
  /** Convert + format a USD value with the selected currency's symbol. */
  format: (usdValue: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined,
)

async function fetchRates(): Promise<Record<string, number>> {
  // open.er-api.com is a free, key-less endpoint returning every rate relative
  // to the requested base (USD), so a single fetch covers all currencies.
  const res = await fetch("https://open.er-api.com/v6/latest/USD")
  if (!res.ok) throw new Error("Failed to fetch exchange rates")
  const json = (await res.json()) as {
    result?: string
    rates?: Record<string, number>
  }
  if (json.result !== "success" || !json.rates) {
    throw new Error("Exchange rate response was not successful")
  }
  return json.rates
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Start from USD on both server and first client render to avoid hydration
  // mismatches, then hydrate the persisted choice from localStorage.
  const [code, setCode] = useState<string>("USD")

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && CURRENCY_MAP[stored]) setCode(stored)
    } catch {
      // localStorage unavailable — fall back to USD.
    }
  }, [])

  const setCurrency = useCallback((next: string) => {
    if (!CURRENCY_MAP[next]) return
    setCode(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore write failures (private mode, etc.).
    }
  }, [])

  const { data: rates } = useSWR("exchange-rates-usd", fetchRates, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    dedupingInterval: 1000 * 60 * 60, // 1h
  })

  const currency = CURRENCY_MAP[code] ?? BASE
  const isUsd = currency.code === "USD"
  const rate = isUsd ? 1 : (rates?.[currency.code] ?? 1)
  const ratesReady = isUsd || rates?.[currency.code] != null

  const convert = useCallback(
    (usdValue: number) => usdValue * rate,
    [rate],
  )

  const format = useCallback(
    (usdValue: number) => {
      const converted = usdValue * rate
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.code,
          maximumFractionDigits: 0,
        }).format(Math.round(converted))
      } catch {
        // Fallback if the runtime can't format the currency code.
        return `${currency.symbol}${Math.round(converted).toLocaleString("en-US")}`
      }
    },
    [rate, currency.code, currency.symbol],
  )

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      rate,
      ratesReady,
      isUsd,
      setCurrency,
      convert,
      format,
    }),
    [currency, rate, ratesReady, isUsd, setCurrency, convert, format],
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return ctx
}
