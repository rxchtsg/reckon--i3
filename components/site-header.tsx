import Link from "next/link"
import { Scale } from "lucide-react"
import { CurrencySelector } from "@/components/currency-selector"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Reckon</span>
        </Link>
        <CurrencySelector />
      </div>
    </header>
  )
}
