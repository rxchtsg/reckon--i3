"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CURRENCIES,
  QUICK_CODES,
  useCurrency,
} from "@/components/currency-provider"

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Focus the search field when the menu opens.
  useEffect(() => {
    if (open) {
      setQuery("")
      const id = window.setTimeout(() => searchRef.current?.focus(), 10)
      return () => window.clearTimeout(id)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CURRENCIES
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      {/* Quick-select buttons for the most popular currencies */}
      <div
        className="flex items-center rounded-lg border border-border bg-card p-0.5"
        role="group"
        aria-label="Quick currency select"
      >
        {QUICK_CODES.map((code) => {
          const c = CURRENCIES.find((x) => x.code === code)!
          const active = currency.code === code
          return (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              aria-pressed={active}
              title={`${c.name} (${code})`}
              className={cn(
                "flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-mono">{c.symbol}</span>
            </button>
          )
        })}
      </div>

      {/* Searchable dropdown for every other currency */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40"
        >
          {currency.code}
          <ChevronsUpDown
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        </button>

        {open ? (
          <div
            className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/40 duration-150 animate-in fade-in slide-in-from-top-1"
            role="listbox"
            aria-label="Select a currency"
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
              <Search
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search currencies…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                aria-label="Search currencies"
              />
            </div>

            {/* Results */}
            <ul className="max-h-72 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No currencies found.
                </li>
              ) : (
                filtered.map((c) => {
                  const active = currency.code === c.code
                  return (
                    <li key={c.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setCurrency(c.code)
                          setOpen(false)
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary",
                          active && "bg-secondary/60",
                        )}
                      >
                        <span className="flex w-7 shrink-0 justify-center font-mono text-sm text-muted-foreground">
                          {c.symbol}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="font-mono text-xs font-medium text-foreground">
                            {c.code}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {c.name}
                          </span>
                        </span>
                        {active ? (
                          <Check
                            className="size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
