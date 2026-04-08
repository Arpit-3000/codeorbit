"use client"

import { useMemo, useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getHeatmap } from "@/lib/api"

function getColor(count: number) {
  if (count === 0) return "bg-secondary/30 hover:bg-secondary/50"
  if (count <= 2) return "bg-chart-1/30 hover:bg-chart-1/50"
  if (count <= 5) return "bg-chart-1/50 hover:bg-chart-1/70"
  if (count <= 8) return "bg-chart-1/70 hover:bg-chart-1/90"
  return "bg-chart-1 hover:bg-chart-1/90"
}

function getIntensityLabel(count: number) {
  if (count === 0) return "No activity"
  if (count <= 2) return "Low activity"
  if (count <= 5) return "Moderate activity"
  if (count <= 8) return "High activity"
  return "Very high activity"
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

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex flex-col gap-3">
            {/* Month containers */}
            <div className="flex gap-4">
              {(() => {
                const monthGroups: { [key: string]: Array<{ week: Array<{ date: string; count: number }>, weekIndex: number }> } = {}
                
                // Group weeks by month
                weeks.forEach((week, wi) => {
                  if (week[0]?.date) {
                    const monthKey = `${new Date(week[0].date).getFullYear()}-${new Date(week[0].date).getMonth()}`
                    if (!monthGroups[monthKey]) {
                      monthGroups[monthKey] = []
                    }
                    monthGroups[monthKey].push({ week, weekIndex: wi })
                  }
                })

                return Object.entries(monthGroups).map(([monthKey, monthWeeks]) => {
                  const [year, month] = monthKey.split('-')
                  const monthName = months[parseInt(month)]
                  
                  return (
                    <div key={monthKey} className="flex flex-col gap-2">
                      {/* Month label */}
                      <div className="text-xs text-muted-foreground font-semibold text-center">
                        {monthName}
                      </div>
                      
                      {/* Month container with border */}
                      <div className="rounded-lg border border-border/30 bg-secondary/10 p-2">
                        <div className="flex gap-1.5">
                          {monthWeeks.map(({ week, weekIndex }) => (
                            <div key={weekIndex} className="flex flex-col gap-1.5">
                              {week.map((day, di) => {
                                if (day.count === -1) {
                                  return <div key={di} className="size-3.5" />
                                }
                                return (
                                  <Tooltip key={di}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`size-3.5 rounded-sm transition-all cursor-pointer ring-1 ring-transparent hover:ring-primary/50 hover:scale-125 ${getColor(day.count)}`}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-popover border-border">
                                      <div className="text-xs">
                                        <p className="font-semibold">{day.count} {day.count === 1 ? 'contribution' : 'contributions'}</p>
                                        <p className="text-muted-foreground">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{getIntensityLabel(day.count)}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Less</span>
                <div className="size-3.5 rounded-sm bg-secondary/30 border border-border/50" />
                <div className="size-3.5 rounded-sm bg-chart-1/30 border border-border/50" />
                <div className="size-3.5 rounded-sm bg-chart-1/50 border border-border/50" />
                <div className="size-3.5 rounded-sm bg-chart-1/70 border border-border/50" />
                <div className="size-3.5 rounded-sm bg-chart-1 border border-border/50" />
                <span className="text-xs text-muted-foreground">More</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last 12 months
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
