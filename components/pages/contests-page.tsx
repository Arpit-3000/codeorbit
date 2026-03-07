"use client"

import { Calendar, Clock, ExternalLink, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Contest {
  platform: string
  name: string
  date: string
  time: string
  duration: string
  color: string
  status: "upcoming" | "live" | "registered"
}

const contests: Contest[] = [
  {
    platform: "Codeforces",
    name: "Codeforces Round #942 (Div. 2)",
    date: "Mar 8, 2026",
    time: "20:35 IST",
    duration: "2h 15m",
    color: "text-chart-1",
    status: "upcoming",
  },
  {
    platform: "LeetCode",
    name: "Weekly Contest 438",
    date: "Mar 9, 2026",
    time: "08:00 IST",
    duration: "1h 30m",
    color: "text-warning",
    status: "registered",
  },
  {
    platform: "CodeChef",
    name: "Starters 176",
    date: "Mar 12, 2026",
    time: "20:00 IST",
    duration: "2h",
    color: "text-chart-5",
    status: "upcoming",
  },
  {
    platform: "LeetCode",
    name: "Biweekly Contest 152",
    date: "Mar 15, 2026",
    time: "20:00 IST",
    duration: "1h 30m",
    color: "text-warning",
    status: "upcoming",
  },
  {
    platform: "Codeforces",
    name: "Educational Codeforces Round 175",
    date: "Mar 18, 2026",
    time: "20:35 IST",
    duration: "2h",
    color: "text-chart-1",
    status: "upcoming",
  },
  {
    platform: "AtCoder",
    name: "AtCoder Beginner Contest 398",
    date: "Mar 22, 2026",
    time: "17:30 IST",
    duration: "1h 40m",
    color: "text-chart-4",
    status: "upcoming",
  },
]

const pastContests = [
  { platform: "LeetCode", name: "Weekly Contest 437", rank: 1245, rating: "+24", date: "Mar 2, 2026" },
  { platform: "Codeforces", name: "CF Round #941", rank: 892, rating: "+32", date: "Feb 28, 2026" },
  { platform: "CodeChef", name: "Starters 175", rank: 654, rating: "+18", date: "Feb 26, 2026" },
]

export function ContestsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track upcoming and past competitive programming contests
        </p>
      </div>

      {/* Upcoming Contests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Upcoming Contests</h2>
        </div>

        <div className="grid gap-3">
          {contests.map((contest, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("flex size-10 items-center justify-center rounded-lg bg-secondary font-bold text-xs", contest.color)}>
                    {contest.platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{contest.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {contest.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {contest.time}
                      </span>
                      <span>{contest.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {contest.status === "registered" && (
                    <Badge className="bg-success/10 text-success border-0 text-xs">Registered</Badge>
                  )}
                  {contest.status === "live" && (
                    <Badge className="bg-destructive/10 text-destructive border-0 text-xs animate-pulse">Live</Badge>
                  )}
                  <Button
                    size="sm"
                    variant={contest.status === "registered" ? "secondary" : "outline"}
                    className={cn(
                      "h-8 gap-1.5 text-xs",
                      contest.status !== "registered"
                        ? "border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {contest.status === "registered" ? "Registered" : "Register"}
                    <ExternalLink className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Contests */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-warning" />
          <h2 className="text-lg font-semibold text-foreground">Recent Results</h2>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-5 p-4 text-xs font-medium text-muted-foreground border-b border-border">
            <span className="col-span-2">Contest</span>
            <span className="text-right">Rank</span>
            <span className="text-right">Rating Change</span>
            <span className="text-right">Date</span>
          </div>
          {pastContests.map((c, i) => (
            <div key={i} className="grid grid-cols-5 items-center p-4 text-sm border-b border-border/50 last:border-0 transition-colors hover:bg-secondary/30">
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-foreground font-medium">{c.name}</span>
              </div>
              <span className="text-right font-mono text-foreground">#{c.rank}</span>
              <span className="text-right font-mono text-success font-medium">{c.rating}</span>
              <span className="text-right text-muted-foreground text-xs">{c.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
