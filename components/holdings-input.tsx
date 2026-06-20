"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, X, Check, ChevronsUpDown } from "lucide-react"

export type Holding = {
  id: string
  ticker: string
  amount: string
}

// Common stocks and ETFs for the searchable ticker field.
const TICKERS: { symbol: string; name: string }[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF" },
  { symbol: "VTSAX", name: "Vanguard Total Stock Market Index" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
]

// Restrained palette drawn from the app's chart tokens for the letter badges.
const BADGE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function badgeColor(ticker: string): string {
  let sum = 0
  for (let i = 0; i < ticker.length; i++) sum += ticker.charCodeAt(i)
  return BADGE_COLORS[sum % BADGE_COLORS.length]
}

export function makeEmptyHolding(): Holding {
  return {
    id: Math.random().toString(36).slice(2),
    ticker: "",
    amount: "",
  }
}

/** Add thousands separators while preserving an in-progress decimal. */
function formatWithCommas(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "")
  if (cleaned === "") return ""
  const [intPart, ...rest] = cleaned.split(".")
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return rest.length > 0 ? `${grouped}.${rest.join("")}` : grouped
}

export function HoldingsInput({
  holdings,
  onChange,
}: {
  holdings: Holding[]
  onChange: (next: Holding[]) => void
}) {
  function updateRow(id: string, patch: Partial<Holding>) {
    onChange(holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }

  function addRow() {
    onChange([...holdings, makeEmptyHolding()])
  }

  function removeRow(id: string) {
    onChange(holdings.filter((h) => h.id !== id))
  }

  return (
    <div className="flex flex-col gap-2.5">
      {holdings.map((holding) => (
        <div key={holding.id} className="flex items-center gap-2">
          <div className="flex-1">
            <TickerCombobox
              value={holding.ticker}
              onChange={(ticker) => updateRow(holding.id, { ticker })}
            />
          </div>
          <div className="flex w-36 items-center rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
            <span className="pl-3 font-mono text-sm text-muted-foreground">
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={holding.amount}
              onChange={(e) =>
                updateRow(holding.id, {
                  amount: formatWithCommas(e.target.value),
                })
              }
              placeholder="0"
              aria-label="Dollar amount"
              className="w-full rounded-lg bg-transparent py-2.5 pl-1 pr-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(holding.id)}
            disabled={holdings.length === 1}
            aria-label="Remove holding"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add holding
      </button>
    </div>
  )
}

function TickerCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (ticker: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? TICKERS.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q),
      )
    : TICKERS

  function select(symbol: string) {
    onChange(symbol)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm transition-colors hover:border-ring/60 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {value ? (
          <>
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold text-background"
              style={{ backgroundColor: badgeColor(value) }}
              aria-hidden="true"
            >
              {value.charAt(0)}
            </span>
            <span className="font-mono font-medium text-foreground">
              {value}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground/70">Select ticker…</span>
        )}
        <ChevronsUpDown
          className="ml-auto size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticker or name…"
              className="w-full rounded-md bg-secondary px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                No match. Press a symbol above to type your own.
              </li>
            ) : (
              filtered.map((t) => (
                <li key={t.symbol} role="option" aria-selected={value === t.symbol}>
                  <button
                    type="button"
                    onClick={() => select(t.symbol)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold text-background"
                      style={{ backgroundColor: badgeColor(t.symbol) }}
                      aria-hidden="true"
                    >
                      {t.symbol.charAt(0)}
                    </span>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {t.symbol}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {t.name}
                    </span>
                    {value === t.symbol ? (
                      <Check
                        className="ml-auto size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
