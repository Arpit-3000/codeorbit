"use client"

import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

interface PlatformCardData {
  name: string
  username: string
  solved: number
  rating: number
  rank: string
  change: number
  color: string
  bgGradient: string
  url: string
}

export function PlatformStatsGrid() {
  const { user } = useAuth()
  const [platforms, setPlatforms] = useState<PlatformCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const connectedPlatforms: PlatformCardData[] = []

    // LeetCode
    if (user.platforms?.leetcode?.username && user.platforms?.leetcode?.verified) {
      connectedPlatforms.push({
        name: "LeetCode",
        username: user.platforms.leetcode.username,
        solved: user.platforms.leetcode.totalSolved || 0,
        rating: user.platforms.leetcode.contestRating || 0,
        rank: user.platforms.leetcode.contestRating > 2000 ? "Knight" : "Guardian",
        change: 0,
        color: "text-warning",
        bgGradient: "from-warning/10 to-warning/5",
        url: `https://leetcode.com/${user.platforms.leetcode.username}`
      })
    }

    // Codeforces
    if (user.platforms?.codeforces?.handle) {
      connectedPlatforms.push({
        name: "Codeforces",
        username: user.platforms.codeforces.handle,
        solved: user.platforms.codeforces.solvedProblems || 0,
        rating: user.platforms.codeforces.rating || 0,
        rank: user.platforms.codeforces.rank || "Newbie",
        change: 0,
        color: "text-chart-1",
        bgGradient: "from-chart-1/10 to-chart-1/5",
        url: `https://codeforces.com/profile/${user.platforms.codeforces.handle}`
      })
    }

    // GitHub
    if (user.platforms?.github?.username) {
      connectedPlatforms.push({
        name: "GitHub",
        username: user.platforms.github.username,
        solved: user.platforms.github.totalContributions || 0,
        rating: 0,
        rank: "Active",
        change: 0,
        color: "text-foreground",
        bgGradient: "from-foreground/5 to-foreground/[0.02]",
        url: `https://github.com/${user.platforms.github.username}`
      })
    }

    // CodeChef
    if (user.platforms?.codechef && (user.platforms.codechef.username || user.platforms.codechef.rating)) {
      connectedPlatforms.push({
        name: "CodeChef",
        username: user.platforms.codechef.username || "Unknown",
        solved: user.platforms.codechef.problemsSolved || 0,
        rating: user.platforms.codechef.rating || 0,
        rank: user.platforms.codechef.stars || "Unrated",
        change: 0,
        color: "text-chart-2",
        bgGradient: "from-chart-2/10 to-chart-2/5",
        url: `https://www.codechef.com/users/${user.platforms.codechef.username || ""}`
      })
    }

    // GeeksforGeeks
    if (user.platforms?.gfg?.username) {
      connectedPlatforms.push({
        name: "GeeksforGeeks",
        username: user.platforms.gfg.username,
        solved: user.platforms.gfg.problemsSolved || 0,
        rating: user.platforms.gfg.codingScore || user.platforms.gfg.score || 0,
        rank: (user.platforms.gfg.score || 0) > 1000 ? "Expert" : "Active",
        change: 0,
        color: "text-chart-3",
        bgGradient: "from-chart-3/10 to-chart-3/5",
        url: `https://auth.geeksforgeeks.org/user/${user.platforms.gfg.username}`
      })
    }

    setPlatforms(connectedPlatforms)
    setLoading(false)
  }, [user])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  if (platforms.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No platforms connected yet. Click "Connect Platforms" to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {platforms.map((platform, i) => (
        <div
          key={platform.name}
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", platform.bgGradient)} />

          <div className="relative space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("flex size-8 items-center justify-center rounded-lg bg-secondary", platform.color)}>
                  <span className="text-xs font-bold">{platform.name.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{platform.name}</h4>
                  <p className="text-[11px] text-muted-foreground">@{platform.username}</p>
                </div>
              </div>
              <a 
                href={platform.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-accent"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {platform.solved}
                </span>
                {platform.change !== 0 && (
                  <div className={cn("flex items-center gap-0.5 text-xs font-medium", platform.change >= 0 ? "text-success" : "text-destructive")}>
                    {platform.change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {Math.abs(platform.change)}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {platform.name === "GitHub" ? "Contributions" : "Problems Solved"}
              </p>
            </div>

            {/* Footer */}
            {platform.rating > 0 && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Rating</span>
                <span className={cn("text-sm font-semibold", platform.color)}>
                  {Number(platform.rating).toFixed(2)}
                </span>
              </div>
            )}
            {platform.rating === 0 && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="text-sm font-semibold text-success">{platform.rank}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
