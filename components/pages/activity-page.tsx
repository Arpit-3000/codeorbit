"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpRight, X } from "lucide-react"
import {
  getAllProblems,
  getCodeforcesProblems,
  getDashboardStats,
  getHeatmap,
  getLeetCodeProblems,
  getWeeklyActivity,
  type AllProblemsData,
  type DashboardStats,
  type HeatmapDay,
  type PlatformProblemsData,
  type Problem,
  type WeeklyTrend,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PlatformMark,
  Segmented,
  Section,
  Stat,
} from "@/components/ds/primitives"
import { YearHeatmap, formatDayKey } from "@/components/dashboard/year-heatmap"
import { cn } from "@/lib/utils"

type PlatformFilter = "all" | "leetcode" | "codeforces"
const PAGE = 30

/** UTC calendar day key (YYYY-MM-DD) for a timestamp. The heatmap's days are UTC days, so the log uses the same ones. */
function dayKeyOf(ts: string) {
  return new Date(ts).toISOString().slice(0, 10)
}

function dayHeading(key: string) {
  const today = dayKeyOf(new Date().toISOString())
  const yesterday = dayKeyOf(new Date(Date.now() - 86_400_000).toISOString())
  if (key === today) return "Today"
  if (key === yesterday) return "Yesterday"
  return formatDayKey(key, { weekday: "long", month: "short", day: "numeric" })
}

function ProblemRow({ p }: { p: Problem }) {
  const isCF = p.platform.toLowerCase().includes("codeforces")
  const meta = [
    p.language,
    p.runtime,
    p.memory,
    isCF && p.contestId ? `Contest ${p.contestId}${p.index ? ` · ${p.index}` : ""}` : null,
  ].filter(Boolean)
  const time = new Date(p.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })

  return (
    <li>
      <a
        href={p.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid grid-cols-[4.25rem_1fr_auto] items-start gap-4 border-b border-border py-3.5 outline-offset-[-2px] sm:grid-cols-[4.25rem_2rem_1fr_auto]"
      >
        <span className="t-num pt-0.5 text-xs text-faint">{time}</span>
        <span className="hidden pt-0.5 sm:block">
          <PlatformMark platform={p.platform} />
        </span>
        <span className="min-w-0 space-y-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-sm font-medium group-hover:text-primary">{p.title}</span>
            {p.status && p.status.toLowerCase() !== "accepted" && p.status.toLowerCase() !== "ok" && (
              <span className="text-[11px] text-muted-foreground">{p.status}</span>
            )}
            {isCF && p.rating ? <span className="t-num rounded-sm bg-secondary px-1.5 text-[11px] text-muted-foreground">{p.rating}</span> : null}
          </span>
          <span className="block text-xs text-muted-foreground">{meta.join(" · ")}</span>
          {p.tags && p.tags.length > 0 && (
            <span className="block text-[11px] text-faint">
              {p.tags.slice(0, 4).join(" · ")}
              {p.tags.length > 4 ? ` +${p.tags.length - 4}` : ""}
            </span>
          )}
        </span>
        <ArrowUpRight className="mt-0.5 size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </a>
    </li>
  )
}

export function ActivityPage() {
  const [heat, setHeat] = useState<HeatmapDay[] | null>(null)
  const [heatError, setHeatError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [weekly, setWeekly] = useState<WeeklyTrend[]>([])
  const [all, setAll] = useState<AllProblemsData | null>(null)
  const [allError, setAllError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [platform, setPlatform] = useState<PlatformFilter>("all")
  const [perPlatform, setPerPlatform] = useState<Partial<Record<"leetcode" | "codeforces", PlatformProblemsData | "loading" | "error">>>({})
  const [day, setDay] = useState<string | null>(null)
  const [visible, setVisible] = useState(PAGE)

  const load = useCallback(async () => {
    setLoading(true)
    setHeatError(null)
    setAllError(null)
    const [h, s, w, a] = await Promise.allSettled([getHeatmap(), getDashboardStats(), getWeeklyActivity(), getAllProblems()])
    if (h.status === "fulfilled") setHeat(h.value.heatmap)
    else setHeatError(h.reason?.response?.data?.message || "Couldn't load your activity history")
    if (s.status === "fulfilled") setStats(s.value)
    if (w.status === "fulfilled") setWeekly(w.value.weeklyTrend)
    if (a.status === "fulfilled") setAll(a.value)
    else setAllError(a.reason?.response?.data?.message || "Couldn't load your solved problems")
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Platform-specific lists are fetched only when asked for (they re-query the platform).
  useEffect(() => {
    if (platform === "all" || perPlatform[platform]) return
    setPerPlatform((p) => ({ ...p, [platform]: "loading" }))
    const fn = platform === "leetcode" ? getLeetCodeProblems : getCodeforcesProblems
    fn()
      .then((d) => setPerPlatform((p) => ({ ...p, [platform]: d })))
      .catch(() => setPerPlatform((p) => ({ ...p, [platform]: "error" })))
  }, [platform, perPlatform])

  useEffect(() => setVisible(PAGE), [platform, day])

  const source: Problem[] | "loading" | "error" = useMemo(() => {
    if (platform === "all") return all?.problems ?? []
    const entry = perPlatform[platform]
    if (!entry || entry === "loading") return "loading"
    if (entry === "error") return "error"
    return entry.problems
  }, [platform, all, perPlatform])

  const filtered = useMemo(() => {
    if (typeof source === "string") return []
    const list = [...source].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return day ? list.filter((p) => dayKeyOf(p.timestamp) === day) : list
  }, [source, day])

  const groups = useMemo(() => {
    const out: { key: string; items: Problem[] }[] = []
    for (const p of filtered.slice(0, visible)) {
      const k = dayKeyOf(p.timestamp)
      const last = out[out.length - 1]
      if (last && last.key === k) last.items.push(p)
      else out.push({ key: k, items: [p] })
    }
    return out
  }, [filtered, visible])

  const connectedLC = all?.platformStats.leetcode.connected
  const connectedCF = all?.platformStats.codeforces.connected
  const filterOptions = [
    { value: "all" as const, label: `All${all ? ` · ${all.totalProblems}` : ""}` },
    ...(connectedLC ? [{ value: "leetcode" as const, label: `LeetCode · ${all?.platformStats.leetcode.total ?? 0}` }] : []),
    ...(connectedCF ? [{ value: "codeforces" as const, label: `Codeforces · ${all?.platformStats.codeforces.total ?? 0}` }] : []),
  ]

  const weekPeak = Math.max(...weekly.map((w) => w.problems), 1)
  const weekTotal = weekly.reduce((a, b) => a + b.problems, 0)
  const pickedCount = day ? heat?.find((h) => h.date === day)?.count : undefined

  return (
    <div className="space-y-14">
      <PageHeader
        eyebrow="Activity"
        title="Your history"
        description="A running record of what you've solved: the year at a glance, then every submission in order."
      />

      {/* Rhythm: streak figures beside this week */}
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:[&>*+*]:border-l sm:[&>*+*]:pl-6 lg:col-span-8">
          <Stat label="Current streak" size="lg" value={stats?.currentStreak ?? "—"} unit={stats ? "days" : undefined} tone={stats && stats.currentStreak > 0 ? "primary" : "default"} />
          <Stat label="Longest" size="lg" value={stats?.longestStreak ?? "—"} unit={stats ? "days" : undefined} />
          <Stat label="Active days" size="lg" value={stats?.activeDays ?? "—"} hint="past year" />
          <Stat label="Consistency" size="lg" value={stats?.consistency ?? "—"} unit={stats ? "%" : undefined} hint="past 30 days" />
        </div>
        <div className="lg:col-span-4">
          <p className="t-eyebrow mb-3">Last 7 days · {weekTotal} contributions</p>
          {weekly.length ? (
            <div className="flex h-20 items-end gap-2">
              {weekly.map((w) => (
                <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5" title={`${w.day}: ${w.problems}`}>
                  <span
                    className={cn("w-full rounded-[2px]", w.problems ? "bg-primary" : "bg-heat-0")}
                    style={{ height: `${Math.max(5, (w.problems / weekPeak) * 56)}px` }}
                  />
                  <span className="text-[10px] text-faint">{w.day.slice(0, 1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{loading ? "Loading…" : "No weekly data yet."}</p>
          )}
        </div>
      </div>

      <Section title="The year" aside={day ? undefined : "select a day to filter the log"}>
        {heatError && !heat ? (
          <ErrorState compact title={heatError} onRetry={load} />
        ) : !heat ? (
          <Skeleton className="h-40 w-full" />
        ) : heat.every((h) => h.count === 0) ? (
          <EmptyState compact title="No activity recorded yet" description="Connect a platform and sync to backfill your year." />
        ) : (
          <YearHeatmap data={heat} selected={day} onPick={(d) => setDay((cur) => (cur === d.date ? null : d.date))} />
        )}
      </Section>

      <Section
        variant="bare"
        title="Log"
        eyebrow={platform === "all" ? "all platforms" : platform}
        aside={
          filterOptions.length > 1 ? (
            <Segmented label="Platform" size="sm" value={platform} onChange={setPlatform} options={filterOptions} />
          ) : undefined
        }
      >
        {day && (
          <div className="mb-4 flex items-center justify-between rounded-md border border-border-strong bg-surface-sunken/60 px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{formatDayKey(day, { weekday: "long", month: "long", day: "numeric" })}</span>
              <span className="ml-2 text-muted-foreground">
                · {pickedCount ?? 0} contribution{pickedCount === 1 ? "" : "s"}, {filtered.length} problem{filtered.length === 1 ? "" : "s"} in the log
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setDay(null)}>
              <X /> Clear
            </Button>
          </div>
        )}

        {loading && !all ? (
          <LoadingState title="Fetching your submissions" description="We read recent accepted solutions straight from LeetCode and Codeforces, so this can take a few seconds." />
        ) : allError && !all ? (
          <ErrorState title={allError} description="Your connected platforms may be rate-limiting us. Nothing was changed." onRetry={load} />
        ) : source === "loading" ? (
          <LoadingState compact title={`Fetching ${platform} submissions`} />
        ) : source === "error" ? (
          <ErrorState compact title={`Couldn't load ${platform} submissions`} onRetry={() => setPerPlatform((p) => ({ ...p, [platform]: undefined }))} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={day ? "No solves logged on this day" : "No submissions yet"}
            description={
              day
                ? "The heatmap counts every kind of contribution (including GitHub), while the log lists solved problems from LeetCode and Codeforces."
                : "Connect LeetCode or Codeforces to see your solved problems here."
            }
            action={
              day ? (
                <Button variant="outline" size="sm" onClick={() => setDay(null)}>
                  Show all days
                </Button>
              ) : (
                <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("open-connect-platforms"))}>
                  Connect a platform
                </Button>
              )
            }
          />
        ) : (
          <div>
            {groups.map((g) => (
              <div key={g.key}>
                <div className="sticky top-0 z-10 -mx-1 flex items-baseline justify-between bg-background/95 px-1 py-2 backdrop-blur">
                  <h3 className="t-eyebrow text-foreground">{dayHeading(g.key)}</h3>
                  <span className="t-num text-xs text-faint">{g.items.length}</span>
                </div>
                <ul className="border-t border-border">
                  {g.items.map((p) => (
                    <ProblemRow key={`${p.platform}-${p.id}`} p={p} />
                  ))}
                </ul>
              </div>
            ))}
            {visible < filtered.length && (
              <div className="pt-6 text-center">
                <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PAGE)}>
                  Show {Math.min(PAGE, filtered.length - visible)} more
                  <span className="t-num text-muted-foreground">({filtered.length - visible} left)</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}
