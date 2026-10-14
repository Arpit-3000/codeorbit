import type { CSSProperties } from "react"
import { Braces, Code2, GitBranch, Snowflake, Terminal, Bug, Binary, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Slow, sparse, low-contrast motifs drifting behind the sign-in form.
 *
 * Placement is random but evenly covering ("best-candidate" blue-noise sampling): each new element is dropped
 * at whichever of many random candidate spots is farthest from everything already placed. That gives an organic,
 * non-gridded scatter with no crowded patches and no empty ones. Each element's drift is capped by the distance to
 * its nearest neighbour, so elements can never touch while they move. The form column and logo are kept clear.
 * Everything is seeded (no Math.random) so server and client render identically.
 */

type Kind = "glyph" | "chip" | "icon" | "snow"

const GLYPHS = ["{ }", "</>", "=>", "[ ]", "&&", "#", "0 1", "::", "//", "!=", "++", "|>"]
const CHIPS = ["O(n)", "O(log n)", "git push", "dp[i][j]", "return;", "200 OK", "i++", "null", "async", "fn()", "0x1F", "main()", "try {", "NaN"]
const ICONS: LucideIcon[] = [Braces, Code2, GitBranch, Terminal, Bug, Binary]

function rng(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

interface Layout {
  /** reference size in px; distances are computed here, and are the smallest screen the layout is shown on */
  w: number
  h: number
  count: number
  /** true if the point (in % of the screen) is off-limits */
  blocked: (xp: number, yp: number) => boolean
}

const LAYOUTS: Record<"phone" | "tablet" | "desktop", Layout> = {
  // phone: the form fills the width, so only thin top and bottom bands are free
  phone: { w: 390, h: 760, count: 6, blocked: (x, y) => (y > 9 && y < 91) || (x < 28 && y < 9) },
  tablet: { w: 768, h: 900, count: 12, blocked: (x, y) => (x > 24 && x < 76 && y < 90) || (x < 20 && y < 8) },
  desktop: { w: 1280, h: 720, count: 24, blocked: (x, y) => (x > 33 && x < 67 && y < 90) || (x < 14 && y < 11) },
}

const R = 50 // px radius reserved around each element (covers the widest chip)

function build(layout: Layout, seed: number) {
  const r = rng(seed)
  const pts: { x: number; y: number }[] = []
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot((a.x - b.x) * layout.w / 100, (a.y - b.y) * layout.h / 100)

  for (let i = 0; i < layout.count; i++) {
    let best: { x: number; y: number } | null = null
    let bestD = -1
    for (let k = 0; k < 60; k++) {
      let c = { x: 2 + r() * 96, y: 2 + r() * 96 }
      let guard = 0
      while (layout.blocked(c.x, c.y) && guard++ < 50) c = { x: 2 + r() * 96, y: 2 + r() * 96 }
      if (layout.blocked(c.x, c.y)) continue
      // distance to the nearest existing point (or to a screen edge for the first ones)
      const edge = Math.min(c.x * layout.w / 100, (100 - c.x) * layout.w / 100, c.y * layout.h / 100, (100 - c.y) * layout.h / 100) * 2
      const d = pts.length ? Math.min(edge, ...pts.map((p) => dist(c, p))) : edge
      if (d > bestD) {
        bestD = d
        best = c
      }
    }
    if (best) pts.push(best)
  }

  // shuffle kinds so neighbouring elements differ, with snowflakes about a third of the mix
  const kinds: Kind[] = pts.map((_, i) => (i % 3 === 0 ? "snow" : i % 3 === 1 ? (i % 2 ? "chip" : "glyph") : i % 2 ? "icon" : "glyph"))
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[kinds[i], kinds[j]] = [kinds[j], kinds[i]]
  }

  let g = 0
  let ch = 0
  let ic = 0
  return pts.map((p, i) => {
    const nn = Math.min(...pts.filter((q) => q !== p).map((q) => dist(p, q)), 400)
    // max travel for this element, in reference px: both neighbours together stay inside the free gap
    const amp = Math.max(0, (nn - 2 * R) * 0.42)
    const ang = r() * Math.PI * 2
    const kind = kinds[i]
    const base = {
      kind,
      x: p.x,
      y: p.y,
      // convert reference px to vw / vh so the drift scales with the screen
      dx: ((Math.cos(ang) * amp) / layout.w) * 100,
      dy: ((Math.sin(ang) * amp) / layout.h) * 100,
      rot: (r() - 0.5) * 16,
      dur: 24 + r() * 26,
      delay: -r() * 30,
      appear: 0.5 + r() * 1.8,
      scale: 0.85 + r() * 0.25,
      accent: r() > 0.78,
      opacity: 0.38 + r() * 0.3,
      spin: (r() > 0.5 ? 1 : -1) * (40 + r() * 50),
      text: undefined as string | undefined,
      Icon: undefined as LucideIcon | undefined,
    }
    if (kind === "glyph") base.text = GLYPHS[g++ % GLYPHS.length]
    else if (kind === "chip") base.text = CHIPS[ch++ % CHIPS.length]
    else if (kind === "icon") base.Icon = ICONS[ic++ % ICONS.length]
    else {
      base.scale = 0.7 + r() * 0.8
      base.opacity = 0.28 + r() * 0.25
    }
    return base
  })
}

const SETS = {
  phone: build(LAYOUTS.phone, 5),
  tablet: build(LAYOUTS.tablet, 17),
  desktop: build(LAYOUTS.desktop, 31),
}

function Group({ items, className }: { items: ReturnType<typeof build>; className: string }) {
  return (
    <div className={className}>
      {items.map((p, i) => {
        const style = {
          left: `${p.x}%`,
          top: `${p.y}%`,
          opacity: p.opacity,
          ["--dx" as string]: `${p.dx}vw`,
          ["--dy" as string]: `${p.dy}vh`,
          ["--rot" as string]: `${p.rot}deg`,
          animation: `float-in ${p.appear}s var(--ease-out) both, float-drift ${p.dur}s ease-in-out ${p.delay}s infinite alternate`,
        } as CSSProperties
        const tone = p.accent ? "text-primary" : "text-muted-foreground"

        return (
          // outer box centres the element on its cell so drift is measured from the cell centre
          <span key={i} className={cn("absolute -translate-x-1/2 -translate-y-1/2 select-none font-mono leading-none", tone)} style={{ left: style.left, top: style.top }}>
            <span className="block will-change-transform" style={{ ...style, position: "static", left: undefined, top: undefined }}>
              <span style={{ display: "block", transform: `scale(${p.scale})` }}>
                {p.kind === "glyph" && <span className="text-xl font-medium tracking-tight">{p.text}</span>}
                {p.kind === "chip" && (
                  <span className="block whitespace-nowrap rounded-md border border-current/25 bg-background/40 px-2.5 py-1.5 text-[11px] tracking-tight">{p.text}</span>
                )}
                {p.kind === "icon" && p.Icon && (
                  <span className="flex size-9 items-center justify-center rounded-lg border border-current/25 bg-background/40">
                    <p.Icon className="size-4" strokeWidth={1.5} />
                  </span>
                )}
                {p.kind === "snow" && (
                  <Snowflake className="size-5" strokeWidth={1.25} style={{ animation: `spin-slow ${Math.abs(p.spin)}s linear infinite ${p.spin < 0 ? "reverse" : "normal"}` }} />
                )}
              </span>
            </span>
          </span>
        )
      })}
    </div>
  )
}

export function FloatingCode({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <Group items={SETS.phone} className="absolute inset-0 md:hidden" />
      <Group items={SETS.tablet} className="absolute inset-0 hidden md:block xl:hidden" />
      <Group items={SETS.desktop} className="absolute inset-0 hidden xl:block" />
    </div>
  )
}
