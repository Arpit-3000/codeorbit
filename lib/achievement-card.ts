import type { PlatformRow } from "@/lib/platform-data"
import { ratingTier } from "@/lib/platform-data"

/**
 * The shareable achievement card: data selection + canvas drawing.
 * The preview and the downloaded PNG are the same canvas, so what you see is exactly what you get.
 * Portrait 1080x1350 (4:5, the tallest ratio the LinkedIn feed shows uncropped), drawn at 2x.
 */

export const CARD_W = 1080
export const CARD_H = 1350
export const CARD_SCALE = 2

export type CardTheme = "dark" | "light"

export interface CardInput {
  name: string
  handle: string
  headline: string
  photoURL: string | null
  platforms: PlatformRow[]
  /** raw per-platform fields from the profile (leetcode.difficultyBreakdown, github.contributions, ...) */
  raw: Record<string, any>
  heatmap: { date: string; count: number }[]
  activeDays: number
  badges: string[]
}

export interface Metric {
  label: string
  /** compact label for the small tiles */
  short: string
  value: string
  sub: string
}

/* ------------------------------------------------------------------ */
/* What to highlight                                                    */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => Math.round(n).toLocaleString("en-US")

export function longestStreak(days: { date: string; count: number }[]) {
  const keys = days.filter((d) => d.count > 0).map((d) => Math.floor(Date.parse(`${d.date.slice(0, 10)}T00:00:00Z`) / 86400000))
  const set = [...new Set(keys)].sort((a, b) => a - b)
  let best = 0
  let run = 0
  for (let i = 0; i < set.length; i++) {
    run = i > 0 && set[i] - set[i - 1] === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }
  return best
}

/** Rating relative to each platform's own scale, so a 1700 on one site isn't compared with 1700 on another. */
const SCALE: Record<string, number> = { leetcode: 2200, codeforces: 2400, codechef: 2500 }

/**
 * The strongest few facts for this particular user, in priority order. Anything that isn't there (or isn't
 * impressive enough to state) is skipped, so the card never shows an empty or zero tile.
 */
export function pickMetrics(c: CardInput): Metric[] {
  const out: Metric[] = []
  const dsa = c.platforms.filter((p) => p.key !== "github")
  const gh = c.platforms.find((p) => p.key === "github")
  const ghRaw = c.raw.github ?? {}

  // 1. Problems solved
  const solved = dsa.reduce((s, p) => s + (p.solved || 0), 0)
  if (solved > 0) {
    const diff: { name: string; value: number }[] = c.raw.leetcode?.difficultyBreakdown ?? []
    const hard = diff.find((d) => d.name?.toLowerCase() === "hard")?.value ?? 0
    out.push({
      label: "Problems solved",
      short: "Solved",
      value: fmt(solved),
      sub: hard > 0 ? `${fmt(hard)} Hard on LeetCode` : `across ${dsa.length} platform${dsa.length === 1 ? "" : "s"}`,
    })
  }

  // 2. Strongest contest rating
  const rated = dsa
    .filter((p) => p.rating > 0 && SCALE[p.key])
    .sort((a, b) => b.rating / SCALE[b.key] - a.rating / SCALE[a.key])[0]
  if (rated) {
    const tier = ratingTier(rated.key, rated.rating)
    const contests = rated.key === "leetcode" ? c.raw.leetcode?.contestsPlayed : rated.key === "codeforces" ? c.raw.codeforces?.contestsPlayed : 0
    out.push({
      label: "Top contest rating",
      short: "Top rating",
      value: fmt(rated.rating),
      sub: [rated.label, tier, contests > 0 ? `${contests} contests` : ""].filter(Boolean).join(" · "),
    })
  }

  // 3. Longest streak (only when it says something)
  const streak = longestStreak(c.heatmap)
  if (streak >= 7) out.push({ label: "Longest streak", short: "Streak", value: String(streak), sub: "days in a row" })

  // 4. GitHub
  if (gh && gh.solved > 0) {
    const k = ghRaw.contributions ?? {}
    const bits = [k.commits > 0 ? `${fmt(k.commits)} commits` : "", ghRaw.pullRequestsTotal > 0 ? `${fmt(ghRaw.pullRequestsTotal)} PRs` : ""].filter(Boolean)
    out.push({ label: "GitHub contributions", short: "Contributions", value: fmt(gh.solved), sub: bits.join(" · ") || "past year" })
  }

  // fillers, if fewer than four so far
  const contestsTotal = (c.raw.leetcode?.contestsPlayed || 0) + (c.raw.codeforces?.contestsPlayed || 0)
  if (out.length < 4 && contestsTotal > 0 && !out.some((m) => m.label === "Top contest rating" && /contests/.test(m.sub))) {
    out.push({ label: "Contests entered", short: "Contests", value: fmt(contestsTotal), sub: "rated rounds" })
  }
  if (out.length < 4 && ghRaw.totalStars > 0) out.push({ label: "GitHub stars", short: "Stars", value: fmt(ghRaw.totalStars), sub: `${fmt(ghRaw.publicRepos || 0)} public repositories` })
  if (out.length < 4 && streak < 7 && c.activeDays > 0) out.push({ label: "Active days", short: "Active days", value: fmt(c.activeDays), sub: "in the past year" })

  return out.slice(0, 4)
}

/** Short, factual chips for the bottom: open source and languages. */
export function pickChips(c: CardInput): string[] {
  const chips: string[] = []
  const gh = c.raw.github
  if (gh?.pullRequestsTotal >= 10) chips.push(`${fmt(gh.pullRequestsTotal)} pull requests`)
  if (gh?.publicRepos >= 5) chips.push(`${fmt(gh.publicRepos)} public repos`)
  const langs: string[] = (gh?.languages ?? []).map((l: any) => l.name).filter(Boolean).slice(0, 3)
  if (langs.length) chips.push(langs.join(" · "))
  return chips
}

/** The most useful line under the name: the first sentence of the bio, otherwise the strongest platform. */
export function pickHeadline(bio: string | undefined, platforms: PlatformRow[]) {
  const first = (bio ?? "").trim().split(/(?<=[.!?])\s/)[0]
  if (first) return first.length > 78 ? first.slice(0, 75).trimEnd() + "…" : first
  const dsa = platforms.filter((p) => p.key !== "github")
  return dsa.length ? `Competitive programmer · ${dsa.map((p) => p.label).slice(0, 3).join(", ")}` : "Software developer"
}

/* ------------------------------------------------------------------ */
/* Drawing                                                              */
/* ------------------------------------------------------------------ */

const THEMES = {
  dark: { bg: "#0E1116", border: "#262C36", text: "#F3F4F6", muted: "#A0A9B8", faint: "#6B7585", accent: "#F5AE3D", chip: "#161B22", ring: "#F3F1EC" },
  light: { bg: "#FFFFFF", border: "#E3E6EB", text: "#111827", muted: "#4B5565", faint: "#8A93A3", accent: "#C2410C", chip: "#F4F5F7", ring: "#1C1A16" },
} as const

export interface CardFonts {
  heading: string
  ui: string
  data: string
}

export function readFonts(): CardFonts {
  const cs = getComputedStyle(document.documentElement)
  const v = (n: string, fallback: string) => {
    const x = cs.getPropertyValue(n).trim()
    return x ? `${x}, ${fallback}` : fallback
  }
  return {
    heading: v("--font-heading", "system-ui, sans-serif"),
    ui: v("--font-ui", "system-ui, sans-serif"),
    data: v("--font-data", "ui-monospace, monospace"),
  }
}

/** Make sure every face the card uses is actually loaded before measuring or drawing text. */
export async function loadFonts(f: CardFonts) {
  const faces = [`600 40px ${f.heading}`, `500 20px ${f.heading}`, `400 18px ${f.ui}`, `500 18px ${f.ui}`, `600 18px ${f.ui}`, `500 14px ${f.data}`]
  try {
    await Promise.all(faces.map((x) => document.fonts.load(x, "Aa09")))
    await document.fonts.ready
  } catch {
    /* fall back to whatever is available */
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous" // without CORS the canvas could not be exported
    const t = setTimeout(() => resolve(null), 4000)
    img.onload = () => {
      clearTimeout(t)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(t)
      resolve(null)
    }
    img.src = src
  })
}

/** Text with manual tracking (canvas letterSpacing isn't supported everywhere). */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  let cx = x
  for (const ch of text) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + tracking
  }
  return cx - x
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1)
  return t.trimEnd() + "…"
}

function rings(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, ink: string, signal: string) {
  // the logo mark: two interlocking rounded squares, drawn from the same geometry as the SVG
  const s = h / 104
  ctx.save()
  ctx.translate(x - 20 * s, y - 48 * s)
  ctx.scale(s, s)
  ctx.lineWidth = 16
  ctx.translate(100, 100)
  for (const [dx, color] of [[-28, ink], [28, signal]] as const) {
    ctx.save()
    ctx.translate(dx, 0)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.roundRect(-35, -35, 70, 70, 18)
    ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

export async function drawCard(canvas: HTMLCanvasElement, input: CardInput, theme: CardTheme, fonts: CardFonts) {
  const T = THEMES[theme]
  canvas.width = CARD_W * CARD_SCALE
  canvas.height = CARD_H * CARD_SCALE
  const ctx = canvas.getContext("2d")!
  ctx.setTransform(CARD_SCALE, 0, 0, CARD_SCALE, 0, 0)
  ctx.textBaseline = "alphabetic"

  const PAD = 72
  const INNER = CARD_W - PAD * 2
  const metrics = pickMetrics(input)
  const hero = metrics[0]
  const tiles = metrics.slice(1, 4)
  const chips = pickChips(input)

  const panel = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.fillStyle = T.chip
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
    ctx.strokeStyle = T.border
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x + 1, y + 1, w - 2, h - 2, r - 1)
    ctx.stroke()
  }

  // surface and frame
  ctx.fillStyle = T.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.strokeStyle = T.border
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, CARD_W - 2, CARD_H - 2)

  /* ---- masthead: the brand, large, with the date opposite ---- */
  const markH = 62
  rings(ctx, PAD, 68, markH, T.ring, T.accent)
  const markW = markH * (160 / 104)
  ctx.font = `600 48px ${fonts.heading}`
  const codeW = ctx.measureText("Code").width
  ctx.fillStyle = T.text
  ctx.fillText("Code", PAD + markW + 18, 118)
  ctx.font = `500 48px ${fonts.heading}`
  ctx.fillStyle = T.faint
  ctx.fillText("Orbit", PAD + markW + 18 + codeW, 118)

  const stamp = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
  ctx.fillStyle = T.faint
  ctx.font = `600 19px ${fonts.ui}`
  const sw = stamp.length * 2 + ctx.measureText(stamp).width
  spaced(ctx, stamp, CARD_W - PAD - sw, 112, 2)
  ctx.fillStyle = T.accent
  ctx.fillRect(CARD_W - PAD - sw, 126, 36, 3)

  ctx.strokeStyle = T.border
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(PAD, 170)
  ctx.lineTo(CARD_W - PAD, 170)
  ctx.stroke()

  /* ---- identity: photo beside the name, so the top reads as a person ---- */
  const aR = 78
  const ax = PAD + aR
  const ay = 300
  const photo = input.photoURL ? await loadImage(input.photoURL) : null
  ctx.save()
  ctx.beginPath()
  ctx.arc(ax, ay, aR, 0, Math.PI * 2)
  ctx.clip()
  if (photo) {
    const k = Math.max((aR * 2) / photo.width, (aR * 2) / photo.height)
    ctx.drawImage(photo, ax - (photo.width * k) / 2, ay - (photo.height * k) / 2, photo.width * k, photo.height * k)
  } else {
    ctx.fillStyle = T.chip
    ctx.fillRect(ax - aR, ay - aR, aR * 2, aR * 2)
    ctx.fillStyle = T.accent
    ctx.font = `600 58px ${fonts.heading}`
    ctx.textAlign = "center"
    const initials = input.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    ctx.fillText(initials, ax, ay + 21)
    ctx.textAlign = "left"
  }
  ctx.restore()
  ctx.strokeStyle = T.accent
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(ax, ay, aR + 7, 0, Math.PI * 2)
  ctx.stroke()

  const tx = PAD + aR * 2 + 40
  const tw = CARD_W - PAD - tx
  ctx.fillStyle = T.text
  ctx.font = `600 56px ${fonts.heading}`
  ctx.fillText(fit(ctx, input.name, tw), tx, 286)

  ctx.fillStyle = T.muted
  ctx.font = `400 25px ${fonts.ui}`
  const words = input.headline.split(/\s+/)
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (ctx.measureText(next).width > tw && cur) {
      lines.push(cur)
      cur = w
    } else cur = next
  }
  if (cur) lines.push(cur)
  const shown = lines.slice(0, 2)
  if (lines.length > 2) shown[1] = fit(ctx, shown[1] + "…", tw)
  shown.forEach((l, i) => ctx.fillText(l, tx, 330 + i * 34))
  if (input.handle) {
    ctx.fillStyle = T.accent
    ctx.font = `500 22px ${fonts.data}`
    ctx.fillText(input.handle, tx, 330 + shown.length * 34 + 16)
  }

  /* ---- the hero: one panel, one number ---- */
  const hy = 438
  const hh = 420
  panel(PAD, hy, INNER, hh, 32)
  ctx.fillStyle = T.accent
  ctx.beginPath()
  ctx.roundRect(PAD + 44, hy + 44, 56, 6, 3)
  ctx.fill()
  if (hero) {
    ctx.fillStyle = T.faint
    ctx.font = `600 21px ${fonts.ui}`
    spaced(ctx, hero.label.toUpperCase(), PAD + 44, hy + 94, 2.4)
    const size = hero.value.length <= 4 ? 250 : hero.value.length <= 6 ? 210 : 150
    ctx.fillStyle = T.accent
    ctx.font = `600 ${size}px ${fonts.heading}`
    const by = hy + 120 + size * 0.74
    ctx.fillText(hero.value, PAD + 38, by)
    ctx.fillStyle = T.muted
    ctx.font = `400 28px ${fonts.ui}`
    ctx.fillText(fit(ctx, hero.sub, INNER - 88), PAD + 44, Math.min(by + 56, hy + hh - 40))
  } else {
    ctx.fillStyle = T.muted
    ctx.font = `400 30px ${fonts.ui}`
    ctx.fillText("Connect a platform to see your numbers here.", PAD + 44, hy + 220)
  }

  /* ---- supporting numbers: tiles ---- */
  let nextY = hy + hh + 28
  if (tiles.length) {
    const gap = 20
    const w = (INNER - gap * (tiles.length - 1)) / tiles.length
    const h = 230
    tiles.forEach((m, i) => {
      const x = PAD + i * (w + gap)
      panel(x, nextY, w, h, 26)
      ctx.fillStyle = T.faint
      ctx.font = `600 17px ${fonts.ui}`
      spaced(ctx, m.short.toUpperCase(), x + 30, nextY + 52, 1.8)
      ctx.fillStyle = T.text
      ctx.font = `600 ${m.value.length > 5 ? 64 : 80}px ${fonts.heading}`
      ctx.fillText(m.value, x + 28, nextY + 142)
      ctx.fillStyle = T.muted
      ctx.font = `400 21px ${fonts.ui}`
      ctx.fillText(fit(ctx, m.sub, w - 60), x + 30, nextY + 190)
    })
    nextY += h + 30
  }

  /* ---- open source and languages ---- */
  let cx = PAD
  let cy = nextY
  ctx.font = `500 23px ${fonts.ui}`
  for (const text of chips) {
    const w = ctx.measureText(text).width + 44
    if (cx + w > CARD_W - PAD) {
      cx = PAD
      cy += 62
    }
    if (cy > CARD_H - 120) break
    panel(cx, cy, w, 48, 24)
    ctx.fillStyle = T.text
    ctx.fillText(text, cx + 22, cy + 32)
    cx += w + 12
  }

  ctx.fillStyle = T.faint
  ctx.font = `500 20px ${fonts.ui}`
  ctx.fillText("Generated with CodeOrbit", PAD, CARD_H - 52)
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Couldn't render the image"))
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve()
    }, "image/png")
  })
}
