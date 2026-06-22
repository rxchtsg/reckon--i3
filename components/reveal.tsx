"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Fades + slides its children up as they scroll into view. Adjacent reveals
 * can be staggered via `delay` (ms) so cards cascade in rather than appearing
 * all at once. Respects prefers-reduced-motion by showing content immediately.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: "div" | "section" | "li" | "aside"
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-6 opacity-0 blur-[2px]",
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  )
}
