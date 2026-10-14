"use client"

import { useEffect, useState } from "react"
import { MeshGradient } from "@paper-design/shaders-react"

/**
 * A slow, seamless colour gradient behind the sign-in and sign-up forms, drawn with Paper Design's free
 * open-source shaders (@paper-design/shaders-react, Apache-2.0).
 *
 * The colours are built from the active theme: the palette's accent sets the base hue, and the rest are
 * its neighbours and its complement, all at the same brightness so they melt into one another with no dark
 * patches. Switching theme or palette recolours it live. It holds still for people who prefer reduced
 * motion, and quietly draws nothing if WebGL isn't available.
 */

/** Resolve any CSS colour (including oklch) to [r,g,b] 0..255 by letting the browser paint one pixel. */
function toRgb(value: string, fallback: [number, number, number]): [number, number, number] {
  try {
    const c = document.createElement("canvas")
    c.width = c.height = 1
    const ctx = c.getContext("2d", { willReadFrequently: true })!
    ctx.fillStyle = "#000"
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
  } catch {
    return fallback
  }
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h = (h * 60 + 360) % 360
  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return "#" + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("")
}

interface Theme {
  colors: string[]
  light: boolean
}

export function AuthBackdrop({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [reduce, setReduce] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement)
      const bg = toRgb(cs.getPropertyValue("--background").trim() || "#0e1116", [14, 17, 22])
      const accent = rgbToHsl(toRgb(cs.getPropertyValue("--primary").trim() || "#f5ae3d", [245, 174, 61]))
      const info = rgbToHsl(toRgb(cs.getPropertyValue("--info").trim() || "#5b6cff", [91, 108, 255]))
      const light = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255 > 0.5

      // One hue family from the accent, plus its complement and the palette's own "info" hue.
      // Every colour sits at the same brightness, so the blend never goes through a dark or washed-out patch.
      const h = accent[0]
      const sat = Math.min(0.62, Math.max(0.38, accent[1] * 0.75))
      // light themes: airy pastels spread around the colour wheel, which blend into soft rainbows.
      // dark themes: deep tones from a wide arc of neighbouring hues, ordered along the wheel. Neighbouring
      // hues blend cleanly, whereas opposite ones (or an unrelated blue next to amber) turn muddy on a dark page.
      const hues = light ? [h, h + 32, h + 180, info[0], h - 38, h + 150] : [h - 62, h - 36, h - 12, h + 14, h + 40, h + 66]
      const lums = light ? [0.84, 0.88, 0.86, 0.85, 0.89, 0.87] : [0.25, 0.29, 0.32, 0.3, 0.27, 0.24]
      const sats = light ? [0.78, 0.7, 0.62, 0.66, 0.74, 0.58] : [sat, sat, sat, sat, sat * 0.95, sat * 0.9]
      setTheme({ light, colors: hues.map((hue, i) => hslToHex(hue, sats[i], lums[i])) })
    }
    read()
    const fade = requestAnimationFrame(() => setShown(true)) // fade in once drawn, so it never pops
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-palette", "data-theme", "style"] })
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const onMq = () => setReduce(mq.matches)
    mq.addEventListener("change", onMq)
    return () => {
      cancelAnimationFrame(fade)
      mo.disconnect()
      mq.removeEventListener("change", onMq)
    }
  }, [])

  if (!theme) return null

  return (
    <div
      aria-hidden
      className={className}
      style={{ opacity: shown ? 1 : 0, transition: "opacity 1.8s ease-out" }}
    >
      <MeshGradient
        colors={theme.colors}
        distortion={0.55}
        swirl={0.18}
        grainMixer={0}
        grainOverlay={0.02}
        scale={1.5}
        speed={reduce ? 0 : 0.12}
        minPixelRatio={1}
        style={{ width: "100%", height: "100%" }}
      />
      {/* a very soft veil of the page colour in the middle keeps the form legible without any visible edge */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 45% 55% at 50% 50%, color-mix(in oklab, var(--background) 38%, transparent) 0%, transparent 100%)" }}
      />
    </div>
  )
}
