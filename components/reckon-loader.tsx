import { Scale } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Branded full loading state: the Reckon mark pulsing gently above a subtle
 * indeterminate progress track. Used in place of bare spinners on page loads.
 */
export function ReckonLoader({
  label = "Crunching the numbers…",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="animate-reckon-pulse flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Scale className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col items-center gap-2.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="relative h-1 w-32 overflow-hidden rounded-full bg-secondary">
          <span className="animate-loader-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary" />
        </span>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}

/**
 * Compact inline variant — just the pulsing mark. Sized for buttons and rows
 * where a full loader would be too heavy.
 */
export function ReckonSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "animate-reckon-pulse inline-flex size-4.5 items-center justify-center rounded-md bg-primary-foreground/20 text-current",
        className,
      )}
      aria-hidden="true"
    >
      <Scale className="size-3" />
    </span>
  )
}
