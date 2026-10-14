"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUpRight, Download, Github, Globe, Link2, Linkedin, Lock, Pencil, Twitter } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getBadges, getCurrentUserProfile, getHeatmap, type BadgesData, type HeatmapDay } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState, PlatformMark, Section, Stat } from "@/components/ds/primitives"
import { YearHeatmap } from "@/components/dashboard/year-heatmap"
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog"
import { AchievementCardDialog } from "@/components/profile/achievement-card-dialog"
import { pickHeadline, type CardInput } from "@/lib/achievement-card"
import { connectedPlatforms, ratingTier } from "@/lib/platform-data"
import { cn } from "@/lib/utils"

interface ProfileData {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
  provider: string
  username?: string
  bio?: string
  accountType?: string
  socialLinks?: { github?: string; linkedin?: string; portfolio?: string; twitter?: string }
  lastSyncedAt?: string | null
  followers?: any[]
  following?: any[]
  platforms: Record<string, any>
  stats?: { activeDays: number; consistencyScore: number }
}

const SOCIALS = [
  { key: "github", label: "GitHub", icon: Github },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "portfolio", label: "Website", icon: Globe },
  { key: "twitter", label: "Twitter", icon: Twitter },
] as const

const ALL_PLATFORMS = [
  { key: "leetcode", label: "LeetCode" },
  { key: "codeforces", label: "Codeforces" },
  { key: "codechef", label: "CodeChef" },
  { key: "gfg", label: "GeeksforGeeks" },
  { key: "github", label: "GitHub" },
] as const

/** Per-platform detail facts, in the order a reader cares about. */
function facts(key: string, p: any): [string, string | number][] {
  const n = (v: any, d = 0) => (v === undefined || v === null || v === "" ? "—" : Number(v).toFixed(d))
  switch (key) {
    case "leetcode":
      return [["Solved", p.totalSolved ?? 0], ["Contest rating", n(p.contestRating)], ["Contests", p.contestsPlayed ?? 0]]
    case "codeforces":
      return [["Solved", p.solvedProblems ?? 0], ["Rating", n(p.rating)], ["Peak", n(p.maxRating)], ["Contests", p.contestsPlayed ?? 0]]
    case "codechef":
      return [["Solved", p.problemsSolved ?? 0], ["Rating", n(p.rating)], ["Peak", n(p.highestRating)], ["Global rank", p.globalRank || "—"]]
    case "gfg":
      return [["Solved", p.problemsSolved ?? 0], ["Coding score", p.codingScore ?? p.score ?? 0]]
    case "github":
      return [
        ["Contributions", p.totalContributions ?? 0],
        ["Repositories", p.publicRepos ?? 0],
        ["Stars", p.totalStars ?? 0],
        ["Followers", p.followers ?? 0],
        ...(p.pullRequestsTotal !== undefined ? ([["Pull requests", p.pullRequestsTotal]] as [string, number][]) : []),
        ...(p.totalForks !== undefined ? ([["Forks", p.totalForks]] as [string, number][]) : []),
        ...(p.following !== undefined ? ([["Following", p.following]] as [string, number][]) : []),
        ...(p.languages?.[0] ? ([["Top language", p.languages[0].name]] as [string, string][]) : []),
      ]
    default:
      return []
  }
}

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

function ProfileContent() {
  const { refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [heat, setHeat] = useState<HeatmapDay[] | null>(null)
  const [badges, setBadges] = useState<BadgesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // Returning from the GitHub OAuth flow: give the backend a moment to persist, then refresh the session user.
        if (searchParams.get("refresh") === "true" || searchParams.get("github") === "connected") {
          await new Promise((r) => setTimeout(r, 1000))
          await refreshUser()
        }

        const data = await getCurrentUserProfile()
        if (alive) setProfile(data as unknown as ProfileData)
      } catch (err: any) {
        console.error("[PROFILE] Failed to fetch profile", err)
        if (alive) setError(err.response?.data?.message || "Failed to load profile")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    // Secondary data never blocks the identity block.
    getHeatmap().then((d) => alive && setHeat(d.heatmap)).catch(() => alive && setHeat([]))
    getBadges().then((d) => alive && setBadges(d)).catch(() => {})
    return () => {
      alive = false
    }
  }, [searchParams, refreshUser, nonce])

  const handleProfileUpdated = (updated: any) => {
    setProfile((p) => ({ ...(p as ProfileData), ...updated }))
    setEditOpen(false)
    refreshUser().catch(() => {}) // so the sidebar and other screens pick up the new photo
  }

  // Reuse the dashboard's normalisation so both screens agree on what's "connected".
  const rows = useMemo(() => (profile ? connectedPlatforms(profile as any) : []), [profile])
  const connectedKeys = new Set(rows.map((r) => r.key))
  const dsa = rows.filter((r) => r.key !== "github")
  const totalSolved = dsa.reduce((s, r) => s + r.solved, 0)
  const cardInput: CardInput | null = useMemo(() => {
    if (!profile) return null
    return {
      name: profile.displayName || profile.username || profile.email.split("@")[0],
      handle: profile.username ? `@${profile.username}` : "",
      headline: pickHeadline(profile.bio, rows),
      photoURL: profile.photoURL,
      platforms: rows,
      raw: profile.platforms ?? {},
      heatmap: heat ?? [],
      activeDays: profile.stats?.activeDays ?? 0,
      badges: (badges?.badges ?? []).map((b) => b.name),
    }
  }, [profile, rows, heat, badges])

  const best = [...dsa].filter((r) => r.rating > 0 && r.key !== "gfg").sort((a, b) => b.rating - a.rating)[0]

  if (loading && !profile) {
    return (
      <div className="space-y-12" aria-busy="true" aria-label="Loading portfolio">
        <div className="flex gap-6">
          <Skeleton className="size-28" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-12 w-72" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error && !profile) {
    return <ErrorState title="Couldn't load your portfolio" description={error} onRetry={() => setNonce((n) => n + 1)} />
  }
  if (!profile) return <EmptyState title="No profile found" />

  const links = SOCIALS.filter((s) => profile.socialLinks?.[s.key])
  const name = profile.displayName || profile.username || profile.email.split("@")[0]

  return (
    <div className="space-y-16">
      {/* Identity */}
      <header className="grid gap-x-10 gap-y-6 sm:grid-cols-[auto_1fr_auto]">
        <Avatar className="size-24 rounded-md after:rounded-md sm:size-32">
          <AvatarImage src={profile.photoURL || ""} alt="" className="rounded-md" />
          <AvatarFallback className="rounded-md bg-primary-soft text-2xl font-semibold text-primary">
            {initials(profile.displayName, profile.email)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-4">
          <div className="space-y-1.5">
            <p className="t-eyebrow flex items-center gap-2">
              Portfolio
              {profile.accountType === "private" && (
                <span className="inline-flex items-center gap-1 normal-case tracking-normal text-faint">
                  <Lock className="size-3" /> Private account
                </span>
              )}
            </p>
            <h1 className="t-display text-5xl sm:text-6xl">{name}</h1>
            <p className="t-num text-sm text-muted-foreground">
              {profile.username ? `@${profile.username}` : profile.email}
              <span className="mx-2 text-faint">·</span>
              {(profile.followers?.length ?? 0).toLocaleString()} followers
              <span className="mx-2 text-faint">·</span>
              {(profile.following?.length ?? 0).toLocaleString()} following
            </p>
          </div>
          {profile.bio ? (
            <p className="max-w-2xl text-[15px] leading-relaxed">{profile.bio}</p>
          ) : (
            <button onClick={() => setEditOpen(true)} className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Add a short bio, it's the first thing a recruiter reads
            </button>
          )}
          {links.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {links.map(({ key, label, icon: Icon }) => (
                <li key={key}>
                  <a
                    href={profile.socialLinks![key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="size-3.5" /> {label}
                    <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:self-start">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit profile
          </Button>
          <Button onClick={() => setCardOpen(true)} disabled={rows.length === 0} title={rows.length === 0 ? "Connect a platform first" : undefined}>
            <Download /> Download Achievement Card
          </Button>
        </div>
      </header>

      {/* Signal */}
      <div className="grid grid-cols-2 gap-y-6 border-y border-border py-6 sm:grid-cols-4 sm:[&>*+*]:border-l sm:[&>*+*]:pl-6">
        <Stat label="Problems solved" size="lg" value={totalSolved.toLocaleString()} hint={`${dsa.length} platform${dsa.length === 1 ? "" : "s"}`} />
        <Stat
          label="Highest rating"
          size="lg"
          value={best ? Math.round(best.rating) : "—"}
          hint={best ? [best.label, ratingTier(best.key, best.rating)].filter(Boolean).join(" · ") : "No rated contests yet"}
          tone={best ? "primary" : "default"}
        />
        <Stat label="Active days" size="lg" value={profile.stats?.activeDays ?? 0} hint="past year" />
        <Stat label="Consistency" size="lg" value={profile.stats?.consistencyScore ?? 0} unit="%" hint="past 30 days" />
      </div>

      {/* Platforms: one tile each. The two headline numbers are large, everything else is secondary. */}
      <Section variant="bare" title="Platforms" aside={`${rows.length} of ${ALL_PLATFORMS.length} connected`}>
        <ul className="grid gap-4 md:grid-cols-2">
          {ALL_PLATFORMS.map(({ key, label }) => {
            const row = rows.find((r) => r.key === key)
            if (!row) {
              return (
                <li key={key} className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border-strong/70 px-5 py-4">
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <PlatformMark platform={key} className="opacity-60" />
                    <span className="text-sm">{label}</span>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent("open-connect-platforms"))}>
                    <Link2 /> Connect
                  </Button>
                </li>
              )
            }
            const all = facts(key, profile.platforms[key])
            const primary = all.slice(0, 2)
            const secondary = all.slice(2)
            return (
              <li key={key} className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
                  <PlatformMark platform={key} size="lg" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <a href={row.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-[15px] font-medium hover:text-primary">
                      {row.label}
                      <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                    <p className="t-num mt-0.5 truncate text-xs text-muted-foreground">@{row.username}</p>
                  </div>
                  {(key === "github" ? row.rank : ratingTier(key, row.rating) || row.rank) && (
                    <span className="shrink-0 rounded-sm bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                      {key === "github" ? row.rank : ratingTier(key, row.rating) || row.rank}
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-6 px-5 pt-5">
                  {primary.map(([k, v]) => (
                    <div key={k}>
                      <dt className="t-eyebrow">{k}</dt>
                      <dd className="t-num mt-2 text-3xl font-medium leading-none">{typeof v === "number" ? v.toLocaleString() : v}</dd>
                    </div>
                  ))}
                </dl>
                {secondary.length > 0 && (
                  <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border bg-surface-sunken/50 px-5 py-4 sm:grid-cols-3">
                    {secondary.map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-2 sm:block">
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="t-num text-sm sm:mt-0.5">{typeof v === "number" ? v.toLocaleString() : v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {secondary.length === 0 && <div className="h-5" />}
              </li>
            )
          })}
        </ul>
      </Section>

      {/* Presence */}
      <Section title="Activity" aside="last 12 months, all platforms">
        {heat === null ? (
          <Skeleton className="h-36" />
        ) : heat.length === 0 || heat.every((h) => h.count === 0) ? (
          <EmptyState compact title="No activity yet" description="Sync a platform and your year of work will be drawn here." />
        ) : (
          <YearHeatmap data={heat} />
        )}
      </Section>

      {badges && badges.badges.length > 0 && (
        <Section title="Achievements" aside={`${badges.badges.length} earned`}>
          <ul className="flex flex-wrap gap-x-6 gap-y-5">
            {badges.badges.map((b, i) => (
              <li key={`${b.name}-${i}`} className="flex w-20 flex-col items-center gap-2 text-center" title={b.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.icon} alt="" className="size-12 object-contain" />
                <span className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{b.name}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Account facts: quiet, last */}
      <Section title="Account">
        <dl className={cn("grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4")}>
          {[
            ["Email", profile.email],
            ["Sign-in", profile.provider === "google" ? "Google" : "Email and password"],
            ["Visibility", profile.accountType === "private" ? "Private: follows need approval" : "Public: anyone can add you"],
            ["Last synced", profile.lastSyncedAt ? new Date(profile.lastSyncedAt).toLocaleString() : "Never"],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="t-eyebrow">{k}</dt>
              <dd className="mt-1.5 truncate text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} profile={profile} onProfileUpdated={handleProfileUpdated} />
      {cardInput && <AchievementCardDialog open={cardOpen} onOpenChange={setCardOpen} input={cardInput} />}
    </div>
  )
}

export function ProfilePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <ProfileContent />
    </Suspense>
  )
}
