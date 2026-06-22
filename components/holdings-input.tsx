"use client"

import { useEffect, useRef, useState } from "react"
import {
  Plus,
  X,
  Check,
  ChevronsUpDown,
  Upload,
  Camera,
  Sparkles,
} from "lucide-react"
import { ReckonLoader } from "@/components/reckon-loader"

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

// Simulated extraction result — stands in for a screenshot-parsing service.
// Returns a realistic-looking set of holdings the user can review and edit.
function simulateExtraction(): Holding[] {
  const sample: { ticker: string; amount: string }[] = [
    { ticker: "VOO", amount: "8,420" },
    { ticker: "AAPL", amount: "3,150" },
    { ticker: "NVDA", amount: "2,600" },
    { ticker: "QQQ", amount: "1,875" },
  ]
  return sample.map((s) => ({ id: Math.random().toString(36).slice(2), ...s }))
}

type UploadStage = "idle" | "processing" | "review"

export function HoldingsInput({
  holdings,
  onChange,
}: {
  holdings: Holding[]
  onChange: (next: Holding[]) => void
}) {
  const [stage, setStage] = useState<UploadStage>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [extracted, setExtracted] = useState<Holding[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function updateRow(id: string, patch: Partial<Holding>) {
    onChange(holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }

  function addRow() {
    onChange([...holdings, makeEmptyHolding()])
  }

  function removeRow(id: string) {
    onChange(holdings.filter((h) => h.id !== id))
  }

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return
    setFileName(file.name)
    setStage("processing")
    timerRef.current = setTimeout(() => {
      setExtracted(simulateExtraction())
      setStage("review")
    }, 1900)
  }

  function updateExtractedRow(id: string, patch: Partial<Holding>) {
    setExtracted((rows) =>
      rows.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    )
  }

  function removeExtractedRow(id: string) {
    setExtracted((rows) => rows.filter((h) => h.id !== id))
  }

  function resetUpload() {
    setStage("idle")
    setFileName(null)
    setExtracted([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function confirmExtracted() {
    // Merge extracted rows into the existing holdings, dropping any blank
    // placeholder rows the user hasn't filled in yet.
    const valid = extracted.filter((h) => h.ticker.trim() !== "")
    const existing = holdings.filter(
      (h) => h.ticker.trim() !== "" || h.amount.trim() !== "",
    )
    onChange(existing.length > 0 ? [...existing, ...valid] : valid)
    resetUpload()
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

      {/* Divider */}
      <div className="my-1 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Or
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      {/* Screenshot upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {stage === "idle" ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
          className={`group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-5 py-7 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/10"
              : "border-border bg-card/40 hover:border-primary/50 hover:bg-card/70"
          }`}
        >
          <span className="flex size-11 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
            <Camera className="size-5" aria-hidden="true" />
          </span>
          <span className="mt-0.5 text-sm font-medium text-foreground">
            Or upload a screenshot of your portfolio
          </span>
          <span className="text-xs text-muted-foreground">
            We&apos;ll extract your holdings automatically.
          </span>
          <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/80">
            <Upload className="size-3.5" aria-hidden="true" />
            Drag &amp; drop or click to browse
          </span>
        </button>
      ) : null}

      {stage === "processing" ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl px-5 py-9 text-center">
          <ReckonLoader
            label={
              fileName ? `Reading ${fileName}…` : "Reading your screenshot…"
            }
          />
        </div>
      ) : null}

      {stage === "review" ? (
        <ExtractedReview
          rows={extracted}
          fileName={fileName}
          onUpdate={updateExtractedRow}
          onRemove={removeExtractedRow}
          onCancel={resetUpload}
          onConfirm={confirmExtracted}
        />
      ) : null}
    </div>
  )
}

function ExtractedReview({
  rows,
  fileName,
  onUpdate,
  onRemove,
  onCancel,
  onConfirm,
}: {
  rows: Holding[]
  fileName: string | null
  onUpdate: (id: string, patch: Partial<Holding>) => void
  onRemove: (id: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const hasRows = rows.length > 0
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Review extracted holdings
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            We found {rows.length} holding{rows.length === 1 ? "" : "s"}
            {fileName ? ` in ${fileName}` : ""}. Check the tickers and amounts,
            then confirm — edit anything that needs correcting.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {hasRows ? (
          rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <div className="flex-1">
                <TickerCombobox
                  value={row.ticker}
                  onChange={(ticker) => onUpdate(row.id, { ticker })}
                />
              </div>
              <div className="flex w-36 items-center rounded-lg border border-input bg-card transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                <span className="pl-3 font-mono text-sm text-muted-foreground">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) =>
                    onUpdate(row.id, {
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
                onClick={() => onRemove(row.id)}
                aria-label="Remove extracted holding"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
            No holdings left. Cancel to try a different screenshot.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!hasRows}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="size-4" aria-hidden="true" />
          Confirm holdings
        </button>
      </div>
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
