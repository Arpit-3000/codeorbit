"use client"

import { Calendar, Clock, ExternalLink, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getContests } from "@/lib/api"

interface Contest {
  _id: string
  platform: string
  name: string
  startTime: string
  duration: number
  url: string
}

export function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getContests()
        setContests(data.contests)
      } catch (err: any) {
        console.error("Failed to fetch contests", err)
        setError(err.response?.data?.message || "Failed to load contests")
      } finally {
        setLoading(false)
      }
    }

    fetchContests()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getPlatformColor = (platform: string) => {
    const lower = platform.toLowerCase()
    if (lower.includes('leetcode')) return 'text-warning'
    if (lower.includes('codeforces')) return 'text-chart-1'
    if (lower.includes('codechef')) return 'text-chart-5'
    if (lower.includes('atcoder')) return 'text-chart-4'
    return 'text-primary'
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track upcoming and past competitive programming contests
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track upcoming and past competitive programming contests
          </p>
        </div>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

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

        {contests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No upcoming contests found</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {contests.map((contest, i) => (
              <div
                key={contest._id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex size-10 items-center justify-center rounded-lg bg-secondary font-bold text-xs", getPlatformColor(contest.platform))}>
                      {contest.platform.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{contest.name}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(contest.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTime(contest.startTime)}
                        </span>
                        <span>{formatDuration(contest.duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                      asChild
                    >
                      <a href={contest.url} target="_blank" rel="noopener noreferrer">
                        View Contest
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
