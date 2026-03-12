"use client"

import { useMemo, useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getHeatmap } from "@/lib/api"

function getColor(count: number) {
  if (count === 0) return "bg-secondary/50"
  if (count <= 2) return "bg-primary/20"
  if (count <= 5) return "bg-primary/40"
  if (count <= 8) return "bg-primary/60"
  return "bg-primary/90"
}

export function ActivityHeatmap() {
  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getHeatmap()
        setHeatmapData(data.heatmap)
      } catch (err: any) {
        console.error("Failed to fetch heatmap", err)
        setError(err.response?.data?.message || "Failed to load heatmap")
      } finally {
        setLoading(false)
      }
    }

    fetchHeatmap()
  }, [])

  const { weeks, totalContributions } = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) {
      return { weeks: [], totalContributions: 0 }
    }

    const total = heatmapData.reduce((a, b) => a + b.count, 0)

    // Group by week
    const weeksArray: Array<{ date: string; count: number }>[] = []
    let currentWeek: Array<{ date: string; count: number }> = []

    // Pad the first week
    const firstDay = new Date(heatmapData[0].date).getDay()
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: "", count: -1 })
    }

    for (const day of heatmapData) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek)
    }

    return { weeks: weeksArray, totalContributions: total }
  }, [heatmapData])

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Unified Activity Heatmap</h3>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (heatmapData.length === 0 || totalContributions === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Unified Activity Heatmap</h3>
        <p className="text-sm text-muted-foreground">
          No activity data yet. Connect your platforms to see your contribution history.
        </p>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Unified Activity Heatmap</h3>
          <span className="text-sm font-semibold text-foreground">
            {totalContributions.toLocaleString()} contributions
          </span>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1">
            {/* Month labels */}
            <div className="flex gap-[3px] pl-8">
              {weeks.map((week, wi) => {
                if (wi % 4 === 0 && week[0]?.date) {
                  const monthIdx = new Date(week[0].date).getMonth()
                  return (
                    <span
                      key={wi}
                      className="text-[10px] text-muted-foreground"
                      style={{ width: `${4 * 13}px` }}
                    >
                      {months[monthIdx]}
                    </span>
                  )
                }
                return null
              })}
            </div>

            <div className="flex gap-0.5">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] pr-2">
                {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                  <span key={i} className="flex h-[10px] items-center text-[9px] text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day, di) => {
                      if (day.count === -1) {
                        return <div key={di} className="size-[10px]" />
                      }
                      return (
                        <Tooltip key={di}>
                          <TooltipTrigger asChild>
                            <div
                              className={`size-[10px] rounded-[2px] transition-colors ${getColor(day.count)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {day.count} submissions on {day.date}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-muted-foreground">Less</span>
              <div className="size-[10px] rounded-[2px] bg-secondary/50" />
              <div className="size-[10px] rounded-[2px] bg-primary/20" />
              <div className="size-[10px] rounded-[2px] bg-primary/40" />
              <div className="size-[10px] rounded-[2px] bg-primary/60" />
              <div className="size-[10px] rounded-[2px] bg-primary/90" />
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
