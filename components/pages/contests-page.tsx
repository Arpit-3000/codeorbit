"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpRight, CalendarPlus } from "lucide-react"
import { getContests, type Contest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  EmptyState,
  ErrorState,
  PageHeader,
  PlatformMark,
  Segmented,
  StatusDot,
  formatCountdown,
  platformKey,
  platformMeta,
} from "@/components/ds/primitives"
import { cn } from "@/lib/utils"

const HOUR = 3600_000
const DAY = 24 * HOUR

interface Item {
  c: Contest
  key: string
  start: number
  end: number
  platform: string
}

function formatDuration(hours: number) {
  const mins = Math.round(hours * 60)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function localDayKey(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(ms: number, now: number) {
  const start = new Date(now).setHours(0, 0, 0, 0)
  const diff = Math.round((new Date(ms).setHours(0, 0, 0, 0) - start) / DAY)
  const date = new Date(ms).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
  if (diff === 0) return { head: "Today", sub: date }
  if (diff === 1) return { head: "Tomorrow", sub: date }
  return { head: date, sub: `in ${diff} days` }
}

/** Minimal .ics so a contest can be dropped into any calendar app. */
function downloadIcs(i: Item) {
  const f = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CodeOrbit//Contests//EN",
    "BEGIN:VEVENT",
    `UID:${i.key}@codeorbit`,
    `DTSTAMP:${f(Date.now())}`,
    `DTSTART:${f(i.start)}`,
    `DTEND:${f(i.end)}`,
    `SUMMARY:${i.c.name.replace(/[,;\n]/g, " ")}`,
    `URL:${i.c.link}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${i.c.name.replace(/[^\w]+/g, "-").toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function Hero({ item, now }: { item: Item; now: number }) {
  const live = item.start <= now
  const remaining = live ? item.end - now : item.start - now
  const total = live ? item.end - item.start : item.start - now
  const meta = platformMeta(item.c.platform)

  return (
    <section aria-label={live ? "Contest in progress" : "Next contest"} className="grid gap-x-12 gap-y-8 border-y border-border py-10 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-7">
        <p className="t-eyebrow flex items-center gap-2">
          <StatusDot tone={live ? "destructive" : "primary"} live />
          {live ? "Happening now" : "Starts next"}
        </p>
        <h2 className="t-display text-4xl sm:text-5xl">{item.c.name}</h2>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <PlatformMark platform={item.c.platform} withLabel />
          <span>
            {new Date(item.start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </span>
          <span className="t-num">{formatDuration(item.c.duration)}</span>
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild>
            <a href={item.c.link} target="_blank" rel="noopener noreferrer">
              {live ? `Join on ${meta.label}` : `Open on ${meta.label}`} <ArrowUpRight />
            </a>
          </Button>
          {!live && (
            <Button variant="outline" onClick={() => downloadIcs(item)}>
              <CalendarPlus /> Add to calendar
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-end gap-3 lg:col-span-5" role="timer" aria-label={live ? "Time remaining" : "Time until start"}>
        <p className="t-eyebrow">{live ? "Time remaining" : "Starts in"}</p>
        <p className={cn("t-num text-6xl font-medium leading-none sm:text-7xl", live ? "text-destructive" : "text-foreground")}>
          {formatCountdown(remaining)}
        </p>
        {live ? (
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full bg-destructive transition-[width]" style={{ width: `${Math.min(100, Math.max(0, 100 - (remaining / total) * 100))}%` }} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function ContestsPage() {
  const [contests, setContests] = useState<Contest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [platform, setPlatform] = useState<string>("all")

  const load = useCallback(() => {
    setError(null)
    getContests()
      .then((d) => setContests(d.contests ?? []))
      .catch((e) => setError(e?.response?.data?.message || "The contest feed didn't respond"))
  }, [])
  useEffect(load, [load])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const items: Item[] = useMemo(
    () =>
      (contests ?? [])
        .map((c) => {
          const start = new Date(c.startTime).getTime()
          return { c, key: c._id ?? `${c.platform}-${c.name}-${c.startTime}`, start, end: start + (c.duration || 0) * HOUR, platform: platformKey(c.platform) }
        })
        .sort((a, b) => a.start - b.start),
    [contests]
  )

  const platforms = useMemo(() => [...new Set(items.map((i) => i.platform))], [items])
  const upcoming = items.filter((i) => i.end > now && (platform === "all" || i.platform === platform))
  const hero = upcoming[0]
  const rest = hero ? upcoming.slice(1) : []

  const groups = useMemo(() => {
    const out: { key: string; ms: number; items: Item[] }[] = []
    for (const i of rest) {
      const k = localDayKey(Math.max(i.start, now))
      const last = out[out.length - 1]
      if (last && last.key === k) last.items.push(i)
      else out.push({ key: k, ms: Math.max(i.start, now), items: [i] })
    }
    return out
  }, [rest, now])

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Contest Tracker"
        title="What's on the clock"
        description="Every upcoming round across your platforms, ordered by when it starts."
        actions={
          platforms.length > 1 ? (
            <Segmented
              label="Platform"
              size="sm"
              value={platform}
              onChange={setPlatform}
              options={[{ value: "all", label: "All" }, ...platforms.map((p) => ({ value: p, label: platformMeta(p).label }))]}
            />
          ) : undefined
        }
      />

      {error && !contests ? (
        <ErrorState title="Couldn't load contests" description={error} onRetry={load} />
      ) : !contests ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading contests">
          <Skeleton className="h-56 w-full" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : upcoming.length === 0 ? (
        <EmptyState
          title={platform === "all" ? "No upcoming contests" : `No upcoming ${platformMeta(platform).label} contests`}
          description="The feed is empty right now. New rounds are announced a week or two ahead, so check back soon."
          action={platform !== "all" ? <Button variant="outline" size="sm" onClick={() => setPlatform("all")}>Show all platforms</Button> : undefined}
        />
      ) : (
        <>
          <Hero item={hero} now={now} />

          {rest.length > 0 && (
            <div className="space-y-8">
              {groups.map((g) => {
                const lbl = dayLabel(g.ms, now)
                return (
                  <section key={g.key} className="grid gap-x-12 gap-y-2 lg:grid-cols-12">
                    <div className="lg:col-span-3">
                      <h3 className="t-title text-sm">{lbl.head}</h3>
                      <p className="text-xs text-muted-foreground">{lbl.sub}</p>
                    </div>
                    <ul className="divide-y divide-border border-y border-border lg:col-span-9">
                      {g.items.map((i) => {
                        const live = i.start <= now
                        const soon = !live && i.start - now < DAY
                        return (
                          <li key={i.key} className="group flex items-center gap-4 py-3.5">
                            <span className="t-num w-16 shrink-0 text-xs text-muted-foreground">
                              {new Date(i.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            </span>
                            <PlatformMark platform={i.c.platform} />
                            <a href={i.c.link} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium group-hover:text-primary">{i.c.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {platformMeta(i.c.platform).label} · {formatDuration(i.c.duration)}
                              </span>
                            </a>
                            <span className={cn("t-num hidden shrink-0 text-xs sm:block", live ? "text-destructive" : soon ? "text-primary" : "text-muted-foreground")}>
                              {live ? "LIVE" : `in ${formatCountdown(i.start - now)}`}
                            </span>
                            <Button variant="ghost" size="icon-sm" onClick={() => downloadIcs(i)} aria-label={`Add ${i.c.name} to calendar`} className="shrink-0 opacity-60 hover:opacity-100">
                              <CalendarPlus />
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
