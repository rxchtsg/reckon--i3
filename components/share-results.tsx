"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Scale, Share2, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReckonSpinner } from "@/components/reckon-loader"
import type { PlanInput, Projection } from "@/lib/projection"

type Verdict = {
  label: string
  line: string
  // Accent color for the gap figure, as a literal so html-to-image captures it.
  accent: string
}

function getVerdict(projection: Projection): Verdict {
  if (projection.goalMet) {
    return {
      label: "On track",
      line: "On track to reach the target — even the cautious case clears it.",
      accent: "oklch(0.74 0.15 162)",
    }
  }
  if (projection.baseGoalMet) {
    return {
      label: "At risk",
      line: "The likely path reaches the goal, but a downturn could derail it.",
      accent: "oklch(0.78 0.13 85)",
    }
  }
  return {
    label: "Shortfall",
    line: "Currently projected to fall short — a few tweaks can close the gap.",
    accent: "oklch(0.66 0.18 22)",
  }
}

type ShareState = "idle" | "working" | "shared" | "copied" | "downloaded" | "error"

export function ShareResults({
  plan,
  projection,
  format,
}: {
  plan: PlanInput
  projection: Projection
  format: (usd: number) => string
}) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<ShareState>("idle")

  const verdict = getVerdict(projection)
  const projected = projection.scenarios.base.finalAmount
  const surplus = projection.surplus
  const gapPositive = surplus >= 0

  async function handleShare() {
    const node = cardRef.current
    if (!node) return
    setState("working")
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        // The card paints its own background; this guards transparent edges.
        backgroundColor: "#10151b",
      })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], "reckon-projection.png", {
        type: "image/png",
      })

      // Prefer a native share sheet (mobile), then clipboard, then download.
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean
      }
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          title: "My Reckon projection",
          text: "Here's how my plan is tracking on Reckon.",
        })
        setState("shared")
      } else if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard?.write
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ])
        setState("copied")
      } else {
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = "reckon-projection.png"
        link.click()
        setState("downloaded")
      }
    } catch (err) {
      // AbortError just means the user dismissed the share sheet.
      if (err instanceof Error && err.name === "AbortError") {
        setState("idle")
        return
      }
      console.log("[v0] share results failed:", err)
      setState("error")
    }
    // Reset the affordance back to idle after a moment.
    setTimeout(() => setState("idle"), 2600)
  }

  const buttonContent = {
    idle: (
      <>
        <Share2 className="size-4" aria-hidden="true" />
        Share your results
      </>
    ),
    working: (
      <>
        <ReckonSpinner />
        Generating image…
      </>
    ),
    shared: (
      <>
        <Check className="size-4" aria-hidden="true" />
        Shared
      </>
    ),
    copied: (
      <>
        <Check className="size-4" aria-hidden="true" />
        Copied to clipboard
      </>
    ),
    downloaded: (
      <>
        <Check className="size-4" aria-hidden="true" />
        Image downloaded
      </>
    ),
    error: (
      <>
        <AlertTriangle className="size-4" aria-hidden="true" />
        Try again
      </>
    ),
  }[state]

  return (
    <div>
      <Button
        onClick={handleShare}
        disabled={state === "working"}
        size="lg"
        className="h-11 w-full font-semibold sm:w-auto"
      >
        {buttonContent}
      </Button>

      {/* Off-screen capture target — a polished, screenshot-ready summary. */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          pointerEvents: "none",
        }}
      >
        <div
          ref={cardRef}
          style={{
            width: 1080,
            padding: 72,
            display: "flex",
            flexDirection: "column",
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            color: "oklch(0.96 0.004 240)",
            background:
              "linear-gradient(155deg, oklch(0.27 0.05 255) 0%, oklch(0.19 0.02 250) 48%, oklch(0.15 0.012 240) 100%)",
            borderRadius: 40,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Soft accent glow in the corner */}
          <div
            style={{
              position: "absolute",
              top: -160,
              right: -120,
              width: 460,
              height: 460,
              borderRadius: "9999px",
              background: `radial-gradient(circle, ${verdict.accent} 0%, transparent 68%)`,
              opacity: 0.22,
            }}
          />

          {/* Brand row */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 1 }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "oklch(0.74 0.15 162)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "oklch(0.18 0.03 162)",
              }}
            >
              <Scale size={30} strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
              Reckon
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 18,
                textTransform: "uppercase",
                letterSpacing: 3,
                color: verdict.accent,
                fontWeight: 600,
              }}
            >
              {verdict.label}
            </span>
          </div>

          {/* Verdict line */}
          <p
            style={{
              marginTop: 56,
              fontSize: 40,
              lineHeight: 1.25,
              fontWeight: 700,
              letterSpacing: -0.8,
              maxWidth: 820,
              zIndex: 1,
            }}
          >
            {verdict.line}
          </p>

          {/* Figures */}
          <div
            style={{
              marginTop: 64,
              display: "flex",
              gap: 28,
              zIndex: 1,
            }}
          >
            <Figure label="Target" value={format(plan.target)} />
            <Figure label="Projected" value={format(projected)} />
            <Figure
              label={gapPositive ? "Surplus" : "Gap"}
              value={`${gapPositive ? "+" : "−"}${format(Math.abs(surplus))}`}
              accent={verdict.accent}
            />
          </div>

          {/* Footer meta */}
          <div
            style={{
              marginTop: 64,
              paddingTop: 28,
              borderTop: "1px solid oklch(1 0 0 / 12%)",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 20,
              color: "oklch(0.66 0.012 240)",
              zIndex: 1,
            }}
          >
            <span>By age {plan.targetAge}</span>
            <span>{projection.years.toFixed(0)}-year projection</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Figure({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: "28px 32px",
        borderRadius: 24,
        background: "oklch(1 0 0 / 5%)",
        border: "1px solid oklch(1 0 0 / 9%)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 17,
          textTransform: "uppercase",
          letterSpacing: 2.5,
          color: "oklch(0.66 0.012 240)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -1,
          color: accent ?? "oklch(0.96 0.004 240)",
        }}
      >
        {value}
      </div>
    </div>
  )
}
