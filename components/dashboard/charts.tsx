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
import { AnimatedNumber } from "@/components/ui/animated-number"
import { useStatsMode } from "@/contexts/stats-mode-context"

const CustomTooltipStyle = {
  backgroundColor: "oklch(0.17 0.01 260)",
  border: "1px solid oklch(0.25 0.015 260)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "oklch(0.95 0.01 260)",
  fontSize: "12px",
}

export function TotalProblemsSolved() {
  const { mode } = useStatsMode()
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

  // Filter out GitHub if in DSA mode
  const platformBreakdown = data.platformBreakdown
    .filter((p: any) => mode === "dev" || p.platform !== "GitHub")
    .map((p: any) => ({
      platform: p.platform === "LeetCode" ? "LC" : 
                p.platform === "Codeforces" ? "CF" : 
                p.platform === "GitHub" ? "GH" : 
                p.platform === "CodeChef" ? "CC" : 
                p.platform === "GFG" ? "GFG" : 
                p.platform,
      value: p.value,
      color: p.color
    }))

  // Calculate total based on mode
  const total = platformBreakdown.reduce((sum: number, p: any) => sum + p.value, 0)

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Problems Solved {mode === "dsa" ? "(DSA)" : "(Dev + DSA)"}
          </h3>
        </div>
        <p className="mb-6 text-4xl font-bold tracking-tight text-foreground">
          <AnimatedNumber value={total} duration={2000} formatNumber={true} />
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

  // Rating to star conversion (CodeChef style with proper ranges)
  const getRatingInfo = (rating: number) => {
    if (rating >= 2500) return { stars: 7, color: "#FF0000", bgGradient: "from-red-500/20 to-red-600/10", label: "Red Coder", tier: "Legendary" }
    if (rating >= 2200) return { stars: 6, color: "#FF6600", bgGradient: "from-orange-500/20 to-orange-600/10", label: "Orange Coder", tier: "Grandmaster" }
    if (rating >= 2000) return { stars: 5, color: "#FFCC00", bgGradient: "from-yellow-500/20 to-yellow-600/10", label: "Yellow Coder", tier: "Master" }
    if (rating >= 1800) return { stars: 4, color: "#6666FF", bgGradient: "from-blue-500/20 to-blue-600/10", label: "Blue Coder", tier: "Expert" }
    if (rating >= 1600) return { stars: 3, color: "#00CC66", bgGradient: "from-green-500/20 to-green-600/10", label: "Green Coder", tier: "Specialist" }
    if (rating >= 1400) return { stars: 2, color: "#77DDFF", bgGradient: "from-cyan-400/20 to-cyan-500/10", label: "Cyan Coder", tier: "Pupil" }
    if (rating >= 1200) return { stars: 1, color: "#77FF77", bgGradient: "from-lime-400/20 to-lime-500/10", label: "Light Green", tier: "Apprentice" }
    return { stars: 0, color: "#999999", bgGradient: "from-gray-400/20 to-gray-500/10", label: "Unrated", tier: "Beginner" }
  }

  // Generate sample rating progression data
  const generateRatingProgression = (currentRating: number) => {
    const progression = []
    const startRating = Math.max(1000, currentRating - 500)
    const contests = 20

    for (let i = 0; i <= contests; i++) {
      const progress = i / contests
      const variation = Math.sin(i * 0.7) * 40 + Math.cos(i * 0.3) * 20
      const rating = startRating + (currentRating - startRating) * progress + variation
      progression.push({
        contest: i + 1,
        rating: Math.round(Math.max(1000, Math.min(rating, currentRating + 50))),
        stars: getRatingInfo(rating).stars
      })
    }
    return progression
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Contest Ratings & Progress</h3>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (!data || !data.hasData) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Contest Ratings & Progress</h3>
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
      color: "#FFA116",
      progression: generateRatingProgression(currentRatings.leetcode)
    })
  }

  if (currentRatings.codeforces) {
    connectedPlatforms.push({
      name: "Codeforces",
      rating: currentRatings.codeforces,
      color: "#1F8ACB",
      progression: generateRatingProgression(currentRatings.codeforces)
    })
  }

  if (currentRatings.codechef) {
    connectedPlatforms.push({
      name: "CodeChef",
      rating: currentRatings.codechef,
      color: "#5B4638",
      progression: generateRatingProgression(currentRatings.codechef)
    })
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Contest Ratings & Progress
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Track your competitive programming journey</p>
          </div>
        </div>

        {/* Current Ratings Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {connectedPlatforms.map((platform, index) => {
            const ratingInfo = getRatingInfo(platform.rating)
            return (
              <div
                key={platform.name}
                className={`relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${ratingInfo.bgGradient} p-4 animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2 rounded-full animate-pulse"
                        style={{ backgroundColor: platform.color }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">{platform.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: ratingInfo.stars }, (_, i) => (
                        <span
                          key={i}
                          className="text-lg animate-pulse"
                          style={{
                            color: ratingInfo.color,
                            animationDelay: `${i * 100}ms`
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-3xl font-bold text-foreground">
                      <AnimatedNumber value={platform.rating} decimals={0} duration={2000} />
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color: ratingInfo.color }}>
                      {ratingInfo.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{ratingInfo.tier}</span>
                    <span className="font-medium text-foreground">{ratingInfo.stars}★</span>
                  </div>
                </div>

                <div
                  className="absolute -right-8 -bottom-8 size-32 rounded-full opacity-20 blur-2xl"
                  style={{ backgroundColor: ratingInfo.color }}
                />
              </div>
            )
          })}
        </div>

        {/* Rating Progression Chart */}
        {connectedPlatforms.length > 0 && (
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <span>📈</span>
              Rating Progression
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 260)" opacity={0.3} />

                  <XAxis
                    dataKey="contest"
                    tick={{ fontSize: 10, fill: "oklch(0.6 0.02 260)" }}
                    axisLine={{ stroke: "oklch(0.3 0.015 260)" }}
                    tickLine={false}
                    label={{
                      value: 'Contest Number',
                      position: 'insideBottom',
                      offset: -15,
                      style: { fontSize: '11px', fill: 'oklch(0.6 0.02 260)', fontWeight: 500 }
                    }}
                  />

                  <YAxis
                    domain={[900, 2700]}
                    ticks={[1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500]}
                    tick={{ fontSize: 10, fill: "oklch(0.6 0.02 260)" }}
                    axisLine={{ stroke: "oklch(0.3 0.015 260)" }}
                    tickLine={false}
                    label={{
                      value: 'Rating',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: '11px', fill: 'oklch(0.6 0.02 260)', fontWeight: 500 }
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      ...CustomTooltipStyle,
                      borderRadius: '8px',
                      border: '1px solid oklch(0.25 0.015 260)',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value: any, name: string) => {
                      const info = getRatingInfo(value)
                      return [
                        <span style={{ color: info.color, fontWeight: 'bold' }}>
                          {value} ({info.stars}★ {info.label})
                        </span>,
                        name
                      ]
                    }}
                  />

                  {connectedPlatforms.map((platform) => (
                    <Line
                      key={platform.name}
                      data={platform.progression}
                      dataKey="rating"
                      name={platform.name}
                      stroke={platform.color}
                      strokeWidth={3}
                      dot={{
                        fill: platform.color,
                        strokeWidth: 2,
                        r: 3,
                        stroke: '#fff'
                      }}
                      activeDot={{
                        r: 6,
                        stroke: platform.color,
                        strokeWidth: 3,
                        fill: '#fff'
                      }}
                      type="monotone"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Star Rating Legend - CodeChef Style */}
        <div className="mt-6 rounded-xl border border-border bg-secondary/20 p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <span>⭐</span>
            Rating Tiers (CodeChef Style)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { rating: "0-1199", stars: 0, color: "#999999", label: "Unrated", gradient: "from-gray-400/10 to-gray-500/5" },
              { rating: "1200-1399", stars: 1, color: "#77FF77", label: "1★ Apprentice", gradient: "from-lime-400/10 to-lime-500/5" },
              { rating: "1400-1599", stars: 2, color: "#77DDFF", label: "2★ Pupil", gradient: "from-cyan-400/10 to-cyan-500/5" },
              { rating: "1600-1799", stars: 3, color: "#00CC66", label: "3★ Specialist", gradient: "from-green-500/10 to-green-600/5" },
              { rating: "1800-1999", stars: 4, color: "#6666FF", label: "4★ Expert", gradient: "from-blue-500/10 to-blue-600/5" },
              { rating: "2000-2199", stars: 5, color: "#FFCC00", label: "5★ Master", gradient: "from-yellow-500/10 to-yellow-600/5" },
              { rating: "2200-2499", stars: 6, color: "#FF6600", label: "6★ Grandmaster", gradient: "from-orange-500/10 to-orange-600/5" },
              { rating: "2500+", stars: 7, color: "#FF0000", label: "7★ Legendary", gradient: "from-red-500/10 to-red-600/5" }
            ].map((tier) => (
              <div
                key={tier.rating}
                className={`flex items-center gap-2 p-3 rounded-lg bg-gradient-to-br ${tier.gradient} border border-border/50`}
              >
                <div className="flex items-center gap-0.5">
                  {tier.stars > 0 ? (
                    Array.from({ length: tier.stars }, (_, i) => (
                      <span key={i} className="text-base leading-none" style={{ color: tier.color }}>★</span>
                    ))
                  ) : (
                    <span className="text-base leading-none" style={{ color: tier.color }}>○</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate" style={{ color: tier.color }}>
                    {tier.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">{tier.rating}</div>
                </div>
              </div>
            ))}
          </div>
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
