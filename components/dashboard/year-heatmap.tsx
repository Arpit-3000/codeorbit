"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface HeatDay {
  date: string
  count: number
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_MS = 86_400_000

/** Parse a YYYY-MM-DD key as a UTC day number. (Avoids the toISOString() timezone shift.) */
function dayNum(key: string) {
  const [y, m, d] = key.split("-").map(Number)
  return Date.UTC(y, (m || 1) - 1, d || 1) / DAY_MS
}
function keyOf(n: number) {
  const dt = new Date(n * DAY_MS)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`
}
export function formatDayKey(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" }) {
  return new Date(dayNum(key) * DAY_MS).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" })
}

export function level(count: number) {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 8) return 3
  return 4
}

const LEVEL_BG = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"]

interface Cell {
  key: string
  count: number
  col: number
  row: number
}

export function buildYear(data: HeatDay[]) {
  if (!data.length) return { cells: [] as Cell[], cols: 0, monthMarks: [] as { col: number; label: string }[], total: 0, activeDays: 0, best: null as HeatDay | null }
  const map = new Map(data.map((d) => [d.date, d.count]))
  const sorted = data.map((d) => dayNum(d.date)).sort((a, b) => a - b)
  const start = sorted[0]
  const end = sorted[sorted.length - 1]
  const startDow = new Date(start * DAY_MS).getUTCDay() // 0 = Sunday

  const cells: Cell[] = []
  let total = 0
  let activeDays = 0
  let best: HeatDay | null = null
  for (let n = start; n <= end; n++) {
    const key = keyOf(n)
    const count = map.get(key) ?? 0
    const idx = n - start + startDow
    cells.push({ key, count, col: Math.floor(idx / 7), row: idx % 7 })
    total += count
    if (count > 0) activeDays++
    if (!best || count > best.count) best = { date: key, count }
  }
  const cols = cells[cells.length - 1].col + 1

  const monthMarks: { col: number; label: string }[] = []
  let lastMonth = -1
  for (const c of cells) {
    if (c.row !== 0 && c.col !== 0) continue
    const m = Number(c.key.slice(5, 7)) - 1
    if (m !== lastMonth) {
      // skip a label that would collide with the previous one
      if (!monthMarks.length || c.col - monthMarks[monthMarks.length - 1].col >= 3) {
        monthMarks.push({ col: c.col, label: MONTHS[m] })
      }
      lastMonth = m
    }
  }
  return { cells, cols, monthMarks, total, activeDays, best }
}

interface YearHeatmapProps {
  data: HeatDay[]
  unit?: string
  className?: string
  /** Optional: highlight a day (e.g. from a linked list) */
  highlight?: string | null
  onSelect?: (day: HeatDay | null) => void
  /** Click/Enter on a day. Parents typically toggle a filter with it. */
  onPick?: (day: HeatDay) => void
  /** The currently picked day (rendered with a persistent ring). */
  selected?: string | null
}

/**
 * Year ribbon. One readout line instead of 366 tooltips; cells are focusable so the
 * history is reachable by keyboard. Colour comes from --heat-* tokens (works in both themes).
 */
export function YearHeatmap({ data, unit = "contributions", className, highlight, onSelect, onPick, selected }: YearHeatmapProps) {
  const { cells, cols, monthMarks, total, activeDays } = useMemo(() => buildYear(data), [data])
  const [hover, setHover] = useState<Cell | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  // On narrow screens the ribbon scrolls; start at "today".
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [cols])

  const readout = hover ?? ((selected ?? highlight) ? cells.find((c) => c.key === (selected ?? highlight)) ?? null : null)

  return (
    <div className={cn("space-y-3", className)}>
      <div ref={scroller} className="overflow-x-auto pb-1">
        <div className="min-w-[640px]">
          <div className="relative mb-1.5 ml-9 h-3">
            {monthMarks.map((m) => (
              <span
                key={`${m.col}-${m.label}`}
                className="t-eyebrow absolute top-0 text-[10px]"
                style={{ left: `${(m.col / cols) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="grid w-7 shrink-0 grid-rows-7 gap-[3px] text-[10px] text-faint" aria-hidden>
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span key={i} className="flex items-center leading-none">
                  {d}
                </span>
              ))}
            </div>
            <div
              role="grid"
              aria-label={`Activity over the last year: ${total.toLocaleString()} ${unit} on ${activeDays} days`}
              className="grid flex-1 gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: "repeat(7, auto)",
                gridAutoFlow: "column",
              }}
              onMouseLeave={() => {
                setHover(null)
                onSelect?.(null)
              }}
            >
              {/* leading blanks so the first column starts on the right weekday */}
              {Array.from({ length: cells[0]?.row ?? 0 }).map((_, i) => (
                <span key={`pad-${i}`} aria-hidden />
              ))}
              {cells.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="gridcell"
                  aria-label={`${formatDayKey(c.key)}: ${c.count} ${unit}`}
                  onMouseEnter={() => {
                    setHover(c)
                    onSelect?.({ date: c.key, count: c.count })
                  }}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover(null)}
                  onClick={() => onPick?.({ date: c.key, count: c.count })}
                  aria-pressed={onPick ? selected === c.key : undefined}
                  className={cn(
                    "aspect-square w-full rounded-[2px] outline-offset-1 transition-transform duration-100 hover:scale-125 focus-visible:scale-125",
                    LEVEL_BG[level(c.count)],
                    (readout?.key === c.key || selected === c.key) && "ring-1 ring-foreground",
                    onPick && "cursor-pointer"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs">
        <p className="t-num text-muted-foreground" aria-live="polite">
          {readout ? (
            <>
              <span className="text-foreground">
                {readout.count} {readout.count === 1 ? unit.replace(/s$/, "") : unit}
              </span>
              <span className="mx-2 text-faint">·</span>
              {formatDayKey(readout.key)}
            </>
          ) : (
            <>
              <span className="text-foreground">{total.toLocaleString()}</span> {unit} on{" "}
              <span className="text-foreground">{activeDays}</span> days
            </>
          )}
        </p>
        <div className="flex items-center gap-1.5 text-faint" aria-hidden>
          <span>Less</span>
          {LEVEL_BG.map((bg) => (
            <span key={bg} className={cn("size-2.5 rounded-[2px]", bg)} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

/** Last N days of counts, oldest first, padded with zeros. Real data only. */
export function lastDays(data: HeatDay[], n: number): HeatDay[] {
  if (!data.length) return []
  const map = new Map(data.map((d) => [d.date, d.count]))
  const end = Math.max(...data.map((d) => dayNum(d.date)))
  const out: HeatDay[] = []
  for (let i = n - 1; i >= 0; i--) {
    const key = keyOf(end - i)
    out.push({ date: key, count: map.get(key) ?? 0 })
  }
  return out
}
