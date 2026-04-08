"use client"

import { Flame, Calendar, Target, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getDashboardStats, getPlatformComparison } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface StatWidgetProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle: string
  color: string
  bgColor: string
}

function StatWidget({ icon: Icon, label, value, subtitle, color, bgColor }: StatWidgetProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center gap-4">
        <div className={cn("flex size-12 items-center justify-center rounded-xl", bgColor)}>
          <Icon className={cn("size-5", color)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export function StatsWidgets() {

  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {

    const fetchStats = async () => {

      try {
        setLoading(true)
        setError(null)
        const data = await getDashboardStats()
        setStats(data)

      } catch (err: any) {
        console.error("Failed to fetch stats", err)
        setError(err.response?.data?.message || "Failed to load stats")
      } finally {
        setLoading(false)
      }

    }

    fetchStats()

  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">Error: {error}</div>
  }

  if (!stats) {
    return <div className="text-sm text-muted-foreground">No stats available</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

      <StatWidget
        icon={Flame}
        label="Current Streak"
        value={stats.currentStreak}
        subtitle="days in a row"
        color="text-chart-5"
        bgColor="bg-chart-5/10"
      />

      <StatWidget
        icon={Calendar}
        label="Active Days"
        value={stats.activeDays}
        subtitle="last year"
        color="text-primary"
        bgColor="bg-primary/10"
      />

      <StatWidget
        icon={Target}
        label="Longest Streak"
        value={stats.longestStreak}
        subtitle="personal best"
        color="text-success"
        bgColor="bg-success/10"
      />

      <StatWidget
        icon={Zap}
        label="Consistency"
        value={`${stats.consistency}%`}
        subtitle="last 30 days"
        color="text-warning"
        bgColor="bg-warning/10"
      />

    </div>
  )
}
// Consistency Score with circular progress
export function ConsistencyScore() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const stats = await getDashboardStats()
        setData(stats)
      } catch (err) {
        console.error("Failed to fetch consistency data", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const score = data?.consistency || 0
  const activeDays = data?.activeDays || 0
  const avgProblemsPerDay = activeDays > 0 ? Math.round((data?.activeDays || 0) / 30 * 10) / 10 : 0
  
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Consistency Score</h3>
        <div className="flex items-center justify-center">
          <div className="relative flex size-32 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="oklch(0.22 0.015 260)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="oklch(0.65 0.2 260)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">{score}%</span>
              <span className="text-[10px] text-muted-foreground">30-day avg</span>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active days</span>
            <span className="font-medium text-foreground">{Math.min(activeDays, 30)}/30</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Current streak</span>
            <span className="font-medium text-foreground">{data?.currentStreak || 0} days</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Platform Comparison Table
export function PlatformComparison() {
  const { user } = useAuth()
  const [platforms, setPlatforms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const connectedPlatforms: any[] = []

    // LeetCode
    if (user.platforms?.leetcode?.username && user.platforms?.leetcode?.verified) {
      connectedPlatforms.push({
        name: "LeetCode",
        solved: user.platforms.leetcode.totalSolved || 0,
        rating: user.platforms.leetcode.contestRating || 0,
        activity: user.platforms.leetcode.totalSolved || 0,
        color: "bg-warning"
      })
    }

    // Codeforces
    if (user.platforms?.codeforces?.handle) {
      connectedPlatforms.push({
        name: "Codeforces",
        solved: user.platforms.codeforces.solvedProblems || 0,
        rating: user.platforms.codeforces.rating || 0,
        activity: user.platforms.codeforces.solvedProblems || 0,
        color: "bg-chart-1"
      })
    }

    // GitHub
    if (user.platforms?.github?.username) {
      connectedPlatforms.push({
        name: "GitHub",
        solved: user.platforms.github.totalContributions || 0,
        rating: 0,
        activity: user.platforms.github.totalContributions || 0,
        color: "bg-success"
      })
    }

    // CodeChef
    if (user.platforms?.codechef && (user.platforms.codechef.username || user.platforms.codechef.rating)) {
      connectedPlatforms.push({
        name: "CodeChef",
        solved: user.platforms.codechef.problemsSolved || 0,
        rating: user.platforms.codechef.rating || 0,
        activity: user.platforms.codechef.problemsSolved || 0,
        color: "bg-chart-2"
      })
    }

    // GeeksforGeeks
    if (user.platforms?.gfg?.username) {
      connectedPlatforms.push({
        name: "GFG",
        solved: user.platforms.gfg.problemsSolved || 0,
        rating: user.platforms.gfg.codingScore || user.platforms.gfg.score || 0,
        activity: user.platforms.gfg.problemsSolved || 0,
        color: "bg-chart-3"
      })
    }

    // Calculate activity percentages
    const maxActivity = Math.max(...connectedPlatforms.map(p => p.activity), 1)
    const platformsWithActivity = connectedPlatforms.map(p => ({
      ...p,
      activity: Math.round((p.activity / maxActivity) * 100)
    }))

    setPlatforms(platformsWithActivity)
    setLoading(false)
  }, [user])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (platforms.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Platform Comparison</h3>
        <div className="text-sm text-muted-foreground">No platform data available</div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Platform Comparison</h3>
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground">
            <span>Platform</span>
            <span className="text-right">Solved</span>
            <span className="text-right">Rating</span>
            <span className="text-right">Activity</span>
          </div>
          {/* Rows */}
          {platforms.map((p) => (
            <div key={p.name} className="grid grid-cols-4 gap-4 items-center text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", p.color)} />
                <span className="text-foreground font-medium">{p.name}</span>
              </div>
              <span className="text-right font-mono text-foreground">{p.solved}</span>
              <span className="text-right font-mono text-foreground">
                {p.rating ? Number(p.rating).toFixed(2) : '-'}
              </span>
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full", p.color)}
                    style={{ width: `${p.activity}%` }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-xs text-muted-foreground">
                  {p.activity}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
