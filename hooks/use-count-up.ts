"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Animates a number from 0 up to `target` over `duration` ms using an
 * ease-out curve and requestAnimationFrame. Re-runs whenever `target` changes.
 * Honors prefers-reduced-motion by snapping straight to the target.
 */
export function useCountUp(target: number, duration = 1100, startDelay = 0) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setValue(target)
      return
    }

    const run = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        // easeOutCubic for a quick start that settles gently.
        const eased = 1 - Math.pow(1 - t, 3)
        setValue(target * eased)
        if (t < 1) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          setValue(target)
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    }

    if (startDelay > 0) {
      timeoutRef.current = setTimeout(run, startDelay)
    } else {
      run()
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [target, duration, startDelay])

  return value
}
