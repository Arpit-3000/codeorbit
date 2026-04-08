"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { useEffect, useState } from "react"
import { getProblemStats, getWeeklyActivity, getContestRatings } from "@/lib/api"

const CustomTooltipStyle = {
  backgroundColor: "oklch(0.17 0.01 260)",
  border: "1px solid oklch(0.25 0.015 260)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "oklch(0.95 0.01 260)",
  fontSize: "12px",
}

export function TotalProblemsSolved() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const stats = await getProblemStats()
        console.log("Total Problems Solved - Fetched stats:", stats)
        setData(stats)
      } catch (err: any) {
        console.error("Failed to fetch problem stats", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-56 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Total Problems Solved</h3>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (!data || !data.platformBreakdown || data.platformBreakdown.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Total Problems Solved</h3>
        <div className="text-sm text-muted-foreground">No data available. Connect your platforms to see stats.</div>
      </div>
    )
  }

  const platformBreakdown = data.platformBreakdown.map((p: any) => ({
    platform: p.platform === "LeetCode" ? "LC" : 
              p.platform === "Codeforces" ? "CF" : 
              p.platform === "GitHub" ? "GH" : 
              p.platform === "CodeChef" ? "CC" : 
              p.platform === "GFG" ? "GFG" : 
              p.platform,
    value: p.value,
    color: p.color
  }))

  const total = data.totalSolved

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Total Problems Solved</h3>
        </div>
        <p className="mb-6 text-4xl font-bold tracking-tight text-foreground animate-count-up">
          {total.toLocaleString()}
        </p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformBreakdown} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 260)" vertical={false} />
              <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "oklch(0.2 0.01 260)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {platformBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function DifficultyDistribution() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const stats = await getProblemStats()
        console.log("Difficulty Distribution - Fetched stats:", stats)
        setData(stats)
      } catch (err: any) {
        console.error("Failed to fetch problem stats", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-56 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Difficulty Distribution</h3>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (!data || !data.difficultyData || data.difficultyData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Difficulty Distribution</h3>
        <div className="text-sm text-muted-foreground">No data available. Connect LeetCode to see difficulty breakdown.</div>
      </div>
    )
  }

  const difficultyData = data.difficultyData
  const total = difficultyData.reduce((a: number, b: any) => a + b.value, 0)

  // Show message if all values are 0
  if (total === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Difficulty Distribution</h3>
        <div className="text-sm text-muted-foreground">No problems solved yet. Start solving on LeetCode to see your difficulty breakdown.</div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Difficulty Distribution</h3>
        <div className="flex items-center gap-6">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {difficultyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {difficultyData.map((d: any) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-muted-foreground">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{d.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ContestRatingsChart() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const ratings = await getContestRatings()
        console.log("Contest Ratings - Fetched data:", ratings)
        setData(ratings)
      } catch (err: any) {
        console.error("Failed to fetch contest ratings", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Contest Ratings</h3>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (!data || !data.hasData) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Contest Ratings</h3>
        <div className="text-sm text-muted-foreground">No contest ratings available. Connect LeetCode, Codeforces, or CodeChef to see your ratings.</div>
      </div>
    )
  }

  const { currentRatings } = data
  const connectedPlatforms = []

  if (currentRatings.leetcode) {
    connectedPlatforms.push({
      name: "LeetCode",
      rating: currentRatings.leetcode,
      color: "oklch(0.75 0.15 80)"
    })
  }

  if (currentRatings.codeforces) {
    connectedPlatforms.push({
      name: "Codeforces",
      rating: currentRatings.codeforces,
      color: "oklch(0.65 0.2 260)"
    })
  }

  if (currentRatings.codechef) {
    connectedPlatforms.push({
      name: "CodeChef",
      rating: currentRatings.codechef,
      color: "oklch(0.7 0.2 30)"
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Current Contest Ratings</h3>
        </div>
        <div className="space-y-4">
          {connectedPlatforms.map((platform) => (
            <div key={platform.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full" style={{ backgroundColor: platform.color }} />
                <span className="text-sm font-medium text-foreground">{platform.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{Number(platform.rating).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Rating history tracking coming soon. Currently showing your latest ratings.
          </p>
        </div>
      </div>
    </div>
  )
}

export function WeeklyActivityChart() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const weeklyData = await getWeeklyActivity()
        console.log("Weekly Activity - Fetched data:", weeklyData)
        setData(weeklyData)
      } catch (err: any) {
        console.error("Failed to fetch weekly activity", err)
        setError(err.message || "Failed to load data")
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Weekly Activity</h3>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (!data || !data.weeklyTrend || data.weeklyTrend.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Weekly Activity</h3>
        <div className="text-sm text-muted-foreground">No activity data available for the past week.</div>
      </div>
    )
  }

  const weeklyActivity = data.weeklyTrend

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Weekly Activity</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyActivity} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 260)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "oklch(0.2 0.01 260)" }} />
              <Bar dataKey="problems" fill="oklch(0.65 0.2 260)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
