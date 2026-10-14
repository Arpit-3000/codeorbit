"use client"

import { useMemo } from "react"
import { ArrowUpRight, CalendarCheck, CheckCircle2, Flame, Link2, Trophy } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useStatsMode } from "@/contexts/stats-mode-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  EmptyState,
  ErrorState,
  PageHeader,
  PlatformMark,
  Section,
  Segmented,
} from "@/components/ds/primitives"
import { GithubStatus } from "@/components/github-status"
import { connectedPlatforms, dsaPlatforms, ratingTier, type PlatformRow } from "@/lib/platform-data"
import { cn } from "@/lib/utils"
import { useDashboardData } from "./use-dashboard-data"
import { YearHeatmap, lastDays } from "./year-heatmap"

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

const DIFF_VAR: Record<string, string> = {
  easy: "var(--diff-easy)",
  medium: "var(--diff-medium)",
  hard: "var(--diff-hard)",
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function PlatformLedger({ rows }: { rows: PlatformRow[] }) {
  const max = Math.max(...rows.map((r) => r.solved), 1)
  return (
    <div>
      <div className="t-eyebrow grid grid-cols-[1fr_4.5rem_4.5rem_1.25rem] gap-3 border-b border-border pb-2">
        <span>Platform</span>
        <span className="text-right">Solved</span>
        <span className="text-right">Rating</span>
        <span />
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.key} className="group relative border-b border-border last:border-b-0">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[1fr_4.5rem_4.5rem_1.25rem] items-center gap-3 py-3 outline-offset-[-2px]"
              aria-label={`${r.label} profile for ${r.username} (opens in a new tab)`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <PlatformMark platform={r.key} />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-medium">{r.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    @{r.username}{r.rank ? ` · ${r.rank}` : ""}
                  </span>
                </span>
              </span>
              <span className="t-num text-right text-sm">{r.solved.toLocaleString()}</span>
              <span className="t-num text-right text-sm text-muted-foreground">{r.rating ? Math.round(r.rating) : "—"}</span>
              <ArrowUpRight className="size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />
            </a>
            {/* relative share of total solved: a quiet 1px rule */}
            <span
              className="animate-draw-bar absolute bottom-[-1px] left-0 h-px bg-primary"
              style={{ width: `${(r.solved / max) * 100}%`, animationDelay: "150ms" }}
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Distribution + ratings                                               */
/* ------------------------------------------------------------------ */

function DifficultyMix({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  if (total === 0) {
    return <EmptyState compact title="No LeetCode solves yet" description="Your Easy / Medium / Hard split appears once you've solved a problem." />
  }
  return (
    <div className="space-y-5">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-sm" role="img" aria-label={data.map((d) => `${d.name} ${d.value}`).join(", ")}>
        {data.map((d) => (
          <span
            key={d.name}
            className="animate-draw-bar h-full"
            style={{ width: `${(d.value / total) * 100}%`, background: DIFF_VAR[d.name.toLowerCase()] ?? d.color }}
            title={`${d.name}: ${d.value}`}
          />
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-4">
        {data.map((d) => (
          <div key={d.name}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-[2px]" style={{ background: DIFF_VAR[d.name.toLowerCase()] ?? d.color }} />
              {d.name}
            </dt>
            <dd className="t-num mt-1 text-2xl">{d.value}</dd>
            <dd className="t-num text-xs text-faint">{Math.round((d.value / total) * 100)}%</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const LADDER_MIN = 800
const LADDER_MAX = 2800
const LADDER_TICKS = [1200, 1600, 2000, 2400]

function RatingLadder({ ratings }: { ratings: { key: PlatformRow["key"]; value: number }[] }) {
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - LADDER_MIN) / (LADDER_MAX - LADDER_MIN)) * 100))}%`
  return (
    <div className="space-y-6">
      {ratings.map((r) => (
        <div key={r.key} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <PlatformMark platform={r.key} withLabel />
            <p className="text-right">
              <span className="t-num text-xl">{Math.round(r.value)}</span>
              <span className="ml-2 text-xs text-muted-foreground">{ratingTier(r.key, r.value)}</span>
            </p>
          </div>
          <div className="relative h-5">
            <div className="absolute inset-x-0 top-2.5 h-px bg-border-strong" />
            {LADDER_TICKS.map((t) => (
              <span key={t} className="absolute top-1.5 h-2 w-px bg-border-strong" style={{ left: pos(t) }} aria-hidden />
            ))}
            <span
              className="animate-draw-bar absolute left-0 top-[9px] h-[3px] rounded-full bg-primary"
              style={{ width: pos(r.value) }}
              aria-hidden
            />
            <span
              className="absolute top-1 size-3 -translate-x-1/2 rounded-full border-2 border-background bg-primary"
              style={{ left: pos(r.value) }}
              aria-hidden
            />
          </div>
        </div>
      ))}
      <div className="relative -mt-2 h-3" aria-hidden>
        {LADDER_TICKS.map((t) => (
          <span key={t} className="t-num absolute -translate-x-1/2 text-[10px] text-faint" style={{ left: pos(t) }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

function HubSkeleton() {
  return (
    <div className="space-y-12" aria-busy="true" aria-label="Loading your dashboard">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-28 w-72" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-3 lg:col-span-5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
        </div>
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, unit, hint, tone = "default" }: { icon: React.ElementType; label: string; value: React.ReactNode; unit?: string; hint: string; tone?: "default" | "primary" }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={cn("size-4", tone === "primary" ? "text-primary" : "text-faint")} />
        {label}
      </p>
      <p className={cn("t-num mt-3 text-4xl font-medium leading-none tracking-tight", tone === "primary" && "text-primary")}>
        {value}
        {unit && <span className="ml-1.5 text-base font-normal text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-2 text-xs leading-snug text-muted-foreground">{hint}</p>
    </div>
  )
}

export function OrbitHub() {
  const { user } = useAuth()
  const { mode, setMode } = useStatsMode()
  const d = useDashboardData()

  const dsa = useMemo(() => dsaPlatforms(user), [user])
  const all = useMemo(() => connectedPlatforms(user), [user])
  const heat = d.heatmap.data?.heatmap ?? []
  const stats = d.stats.data
  const week = d.weekly.data?.weeklyTrend ?? []

  const firstName = (user?.displayName || user?.username || user?.email?.split("@")[0] || "there").split(" ")[0]

  // same source as the platform list and the profile page, so the totals always agree
  const solvedTotal = dsa.reduce((s, r) => s + r.solved, 0)

  const ratingRows = useMemo(() => {
    const r = d.ratings.data?.currentRatings
    if (!r) return []
    return (
      [
        ["leetcode", r.leetcode],
        ["codeforces", r.codeforces],
        ["codechef", r.codechef],
      ] as const
    )
      .filter(([, v]) => !!v)
      .map(([key, value]) => ({ key, value: value as number }))
  }, [d.ratings.data])

  const noPlatforms = all.length === 0
  const initialLoading = d.stats.loading && !d.stats.data && d.problems.loading && !d.problems.data

  // what matters right now: did you do something today, and what keeps the streak alive?
  const todayKey = new Date().toISOString().slice(0, 10)
  const todayCount = heat.find((h) => h.date === todayKey)?.count ?? 0
  const activeLast30 = useMemo(() => lastDays(heat, 30).filter((x) => x.count > 0).length, [heat])
  const streak = stats?.currentStreak ?? 0

  const status = !stats
    ? "Loading your numbers…"
    : todayCount > 0
      ? streak > 1
        ? `You're active today. That's ${streak} days in a row.`
        : "You're active today. Nice start."
      : streak > 0
        ? `Nothing logged yet today. Solve one problem to keep your ${streak}-day streak.`
        : "No streak running. Solving one problem today starts one."

  return (
    <div className="space-y-10">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={status}
        actions={
          <>
            <Segmented
              label="What to show"
              value={mode}
              onChange={setMode}
              options={[
                { value: "dsa", label: "Practice" },
                { value: "dev", label: "GitHub" },
              ]}
            />
          </>
        }
      />

      {noPlatforms ? (
        <EmptyState
          title="Nothing to show yet"
          description="Connect LeetCode, Codeforces, CodeChef, GeeksforGeeks or GitHub and your streaks, ratings and history will appear here."
          action={
            <Button onClick={() => window.dispatchEvent(new CustomEvent("open-connect-platforms"))}>
              <Link2 /> Connect a platform
            </Button>
          }
        />
      ) : initialLoading ? (
        <HubSkeleton />
      ) : mode === "dev" ? (
        <GithubStatus />
      ) : (
        <>
          {/* 1. The four numbers that matter, in plain words */}
          {d.stats.error && !stats ? (
            <ErrorState compact title={d.stats.error} onRetry={d.reload} />
          ) : (
            <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={CheckCircle2} label="Problems solved" value={solvedTotal.toLocaleString()} hint={`Across ${dsa.length} ${dsa.length === 1 ? "platform" : "platforms"}`} />
              <StatCard icon={Flame} label="Current streak" value={stats?.currentStreak ?? "—"} unit={stats ? (streak === 1 ? "day" : "days") : undefined} tone={streak > 0 ? "primary" : "default"} hint="Days in a row with activity" />
              <StatCard icon={Trophy} label="Best streak" value={stats?.longestStreak ?? "—"} unit={stats ? "days" : undefined} hint="Your longest run so far" />
              <StatCard icon={CalendarCheck} label="Last 30 days" value={heat.length ? activeLast30 : stats ? Math.round((stats.consistency / 100) * 30) : "—"} unit="of 30" hint="Days you were active" />
            </section>
          )}

          {/* 2. Where it all comes from */}
          <div className="grid gap-6 lg:grid-cols-12">
            <Section title="Your platforms" className="lg:col-span-7">
              <PlatformLedger rows={dsa.length ? dsa : all} />
            </Section>
            <Section title="This week" aside="contributions per day" className="flex flex-col lg:col-span-5" bodyClassName="flex flex-1 flex-col justify-end">
              {week.length ? (
                <div className="flex h-52 items-end gap-2.5">
                  {week.map((w) => {
                    const peak = Math.max(...week.map((x) => x.problems), 1)
                    return (
                      <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5" title={`${w.day}: ${w.problems}`}>
                        <span className="t-num text-[11px] text-muted-foreground">{w.problems || ""}</span>
                        <span
                          className={cn("w-full rounded-[2px]", w.problems ? "bg-primary" : "bg-heat-0")}
                          style={{ height: `${Math.max(6, (w.problems / peak) * 150)}px` }}
                        />
                        <span className="text-[11px] text-faint">{w.day.slice(0, 3)}</span>
                      </div>
                    )
                  })}
                </div>
              ) : d.weekly.error ? (
                <ErrorState compact title={d.weekly.error} onRetry={d.reload} />
              ) : (
                <EmptyState compact title="No activity this week" />
              )}
            </Section>
          </div>

          {/* 3. The detail */}
          {/* 4. The detail, one click away */}
          <div className="space-y-8">
            <div className="space-y-8">
              <Section title="The past year" aside={`${heat.reduce((a, b) => a + b.count, 0).toLocaleString()} contributions`}>
                {d.heatmap.error && !heat.length ? (
                  <ErrorState compact title={d.heatmap.error} onRetry={d.reload} />
                ) : d.heatmap.loading && !heat.length ? (
                  <Skeleton className="h-36 w-full" />
                ) : heat.length === 0 || heat.every((h) => h.count === 0) ? (
                  <EmptyState compact title="No activity recorded yet" description="Press Sync to pull in your history." />
                ) : (
                  <YearHeatmap data={heat} />
                )}
              </Section>
            </div>

            <div className="space-y-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <Section title="Difficulty of what you've solved" aside="LeetCode">
                  {d.problems.error && !d.problems.data ? (
                    <ErrorState compact title={d.problems.error} onRetry={d.reload} />
                  ) : d.problems.loading && !d.problems.data ? (
                    <Skeleton className="h-28" />
                  ) : (
                    <DifficultyMix data={d.problems.data?.difficultyData ?? []} />
                  )}
                </Section>
                <Section title="Contest ratings" aside="each platform has its own scale">
                  {d.ratings.error && !d.ratings.data ? (
                    <ErrorState compact title={d.ratings.error} onRetry={d.reload} />
                  ) : d.ratings.loading && !d.ratings.data ? (
                    <Skeleton className="h-28" />
                  ) : ratingRows.length === 0 ? (
                    <EmptyState compact title="No contest rating yet" description="Take part in a rated contest on LeetCode, Codeforces or CodeChef and it will show up here." />
                  ) : (
                    <RatingLadder ratings={ratingRows} />
                  )}
                </Section>
              </div>

              {(d.badges.data?.badges?.length ?? 0) > 0 && (
                <Section title="Achievements" aside={`${d.badges.data?.badges?.length} earned`}>
                  <ul className="flex flex-wrap gap-x-6 gap-y-5">
                    {(d.badges.data?.badges ?? []).slice(0, 12).map((b, i) => (
                      <li key={`${b.name}-${i}`} className="flex w-16 flex-col items-center gap-2 text-center" title={b.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.icon} alt="" className="size-11 object-contain" />
                        <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{b.name}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
