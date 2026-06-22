import { Lightbulb } from "lucide-react"
import type { SuggestedAction } from "@/lib/projection"

export function SuggestedActions({
  actions,
  goalMet,
}: {
  actions: SuggestedAction[]
  goalMet: boolean
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {goalMet ? "Ways to strengthen your plan" : "Ways to close the gap"}
        </h2>
      </div>

      <ol className="flex flex-col gap-3">
        {actions.map((action, i) => (
          <li
            key={action.title}
            className="glass-card flex gap-4 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25 sm:p-5"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-sm font-medium text-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 pr-1">
              <h3 className="text-sm font-medium leading-snug text-foreground">
                {action.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                {action.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
