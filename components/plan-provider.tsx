"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { PlanInput } from "@/lib/projection"

type PlanContextValue = {
  plan: PlanInput | null
  setPlan: (plan: PlanInput) => void
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanInput | null>(null)
  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) {
    throw new Error("usePlan must be used within a PlanProvider")
  }
  return ctx
}
