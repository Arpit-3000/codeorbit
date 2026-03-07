"use client"

import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlatformCardData {
  name: string
  username: string
  solved: number
  rating: number
  rank: string
  change: number
  color: string
  bgGradient: string
}

const platforms: PlatformCardData[] = [
  {
    name: "LeetCode",
    username: "dev_coder42",
    solved: 847,
    rating: 2102,
    rank: "Knight",
    change: 12,
    color: "text-warning",
    bgGradient: "from-warning/10 to-warning/5",
  },
  {
    name: "Codeforces",
    username: "dev_coder42",
    solved: 623,
    rating: 1856,
    rank: "Expert",
    change: -8,
    color: "text-chart-1",
    bgGradient: "from-chart-1/10 to-chart-1/5",
  },
  {
    name: "CodeChef",
    username: "dev_coder42",
    solved: 412,
    rating: 1943,
    rank: "5 Star",
    change: 24,
    color: "text-chart-5",
    bgGradient: "from-chart-5/10 to-chart-5/5",
  },
  {
    name: "GeeksforGeeks",
    username: "dev_coder42",
    solved: 356,
    rating: 1680,
    rank: "4 Star",
    change: 5,
    color: "text-success",
    bgGradient: "from-success/10 to-success/5",
  },
  {
    name: "GitHub",
    username: "dev-coder42",
    solved: 1247,
    rating: 0,
    rank: "Active",
    change: 32,
    color: "text-foreground",
    bgGradient: "from-foreground/5 to-foreground/[0.02]",
  },
]

export function PlatformStatsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              <button className="rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-accent">
                <ExternalLink className="size-3.5" />
              </button>
            </div>

            {/* Stats */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {platform.name === "GitHub" ? `${platform.solved}` : platform.solved}
                </span>
                <div className={cn("flex items-center gap-0.5 text-xs font-medium", platform.change >= 0 ? "text-success" : "text-destructive")}>
                  {platform.change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {Math.abs(platform.change)}
                </div>
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
                  {platform.rating}
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
