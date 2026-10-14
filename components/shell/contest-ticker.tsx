"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getContests, type Contest } from "@/lib/api"
import { PlatformMark, StatusDot, formatCountdown, platformMeta } from "@/components/ds/primitives"
import { cn } from "@/lib/utils"

const HOUR = 3600_000

/**
 * Persistent "what's next" signal in the top bar.
 * Live contest > starting within 24h > next upcoming. Counts down in place.
 */
export function ContestTicker({ className }: { className?: string }) {
  const [contests, setContests] = useState<Contest[] | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const data = await getContests()
        if (alive) setContests(data.contests ?? [])
      } catch {
        if (alive) setContests((prev) => prev ?? [])
      }
    }
    load()
    const refresh = setInterval(load, HOUR)
    return () => {
      alive = false
      clearInterval(refresh)
    }
  }, [])

  const next = contests
    ?.map((c) => {
      const start = new Date(c.startTime).getTime()
      return { c, start, end: start + (c.duration || 0) * HOUR }
    })
    .filter((x) => x.end > now)
    .sort((a, b) => a.start - b.start)[0]

  // Only tick every second when the countdown has seconds worth showing.
  const needsFastTick = !!next && next.start - now < HOUR
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), needsFastTick ? 1000 : 30_000)
    return () => clearInterval(t)
  }, [needsFastTick])

  if (!next) return null

  const live = next.start <= now
  const soon = !live && next.start - now < 24 * HOUR
  const name = next.c.name
  const label = platformMeta(next.c.platform).label

  return (
    <Link
      href="/contests"
      title={`${label}: ${name}`}
      className={cn(
        "group hidden h-8 min-w-0 max-w-[22rem] items-center gap-2.5 rounded-md border border-border px-2.5 text-xs transition-colors hover:border-border-strong hover:bg-accent md:flex",
        live && "border-primary/50",
        className
      )}
    >
      <StatusDot tone={live ? "destructive" : soon ? "primary" : "neutral"} live={live || soon} />
      <PlatformMark platform={next.c.platform} />
      <span className="min-w-0 truncate text-muted-foreground group-hover:text-foreground">{name}</span>
      <span className={cn("t-num shrink-0", live ? "text-destructive" : soon ? "text-primary" : "text-muted-foreground")}>
        {live ? "LIVE" : formatCountdown(next.start - now)}
      </span>
    </Link>
  )
}
