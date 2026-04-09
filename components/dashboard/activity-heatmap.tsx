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

  const { weeks, totalContributions, dateRange } = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) {
      return { weeks: [], totalContributions: 0, dateRange: { start: null, end: null } }
    }

    const total = heatmapData.reduce((a, b) => a + b.count, 0)

    // Create a map for quick lookup
    const dataMap = new Map(heatmapData.map(item => [item.date, item.count]))

    // Find the date range
    const dates = heatmapData.map(item => new Date(item.date)).sort((a, b) => a.getTime() - b.getTime())
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]

    // Generate all dates from start to end
    const allDates: Array<{ date: string; count: number }> = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const count = dataMap.get(dateStr) || 0
      allDates.push({ date: dateStr, count })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Group by week
    const weeksArray: Array<{ date: string; count: number }>[] = []
    let currentWeek: Array<{ date: string; count: number }> = []

    // Pad the first week to start on Sunday
    const firstDay = new Date(allDates[0].date).getDay()
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: "", count: -1 })
    }

    for (const day of allDates) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek)
        currentWeek = []
      }
    }
    
    // Pad the last week to complete 7 days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: "", count: -1 })
      }
      weeksArray.push(currentWeek)
    }

    return { 
      weeks: weeksArray, 
      totalContributions: total,
      dateRange: { start: startDate, end: endDate }
    }
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
            {/* Day labels */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-transparent font-semibold text-center">
                  Day
                </div>
                <div className="rounded-lg border border-transparent bg-transparent p-2">
                  <div className="flex gap-1.5">
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="size-3.5 flex items-center justify-center text-[10px]">S</div>
                      <div className="size-3.5 flex items-center justify-center text-[10px]">M</div>
                      <div className="size-3.5 flex items-center justify-center text-[10px]">T</div>
                      <div className="size-3.5 flex items-center justify-center text-[10px]">W</div>
                      <div className="size-3.5 flex items-center justify-center text-[10px]">T</div>
                      <div className="size-3.5 flex items-center justify-center text-[10px]">F</div>
                      <div className="size-3.5 flex items-center justify-center text-[10px]">S</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Month containers */}
              {(() => {
                const monthGroups: { [key: string]: Array<{ week: Array<{ date: string; count: number }>, weekIndex: number }> } = {}
                
                // Group weeks by the month that contains the majority of days
                weeks.forEach((week, wi) => {
                  // Count days per month in this week
                  const monthCounts: { [key: string]: number } = {}
                  
                  week.forEach(day => {
                    if (day.date && day.count !== -1) {
                      const date = new Date(day.date)
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
                      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
                    }
                  })
                  
                  // Find the month with the most days in this week
                  let dominantMonth = ''
                  let maxCount = 0
                  Object.entries(monthCounts).forEach(([monthKey, count]) => {
                    if (count > maxCount) {
                      maxCount = count
                      dominantMonth = monthKey
                    }
                  })
                  
                  // If we found a dominant month, assign this week to it
                  if (dominantMonth) {
                    if (!monthGroups[dominantMonth]) {
                      monthGroups[dominantMonth] = []
                    }
                    monthGroups[dominantMonth].push({ week, weekIndex: wi })
                  }
                })

                // Sort months chronologically and filter out empty months
                return Object.entries(monthGroups)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .filter(([_, monthWeeks]) => monthWeeks.length > 0)
                  .map(([monthKey, monthWeeks]) => {
                    const [year, month] = monthKey.split('-')
                    const monthName = months[parseInt(month)]
                    const yearStr = year
                    
                    return (
                      <div key={monthKey} className="flex flex-col gap-2">
                        {/* Month label */}
                        <div className="text-xs text-muted-foreground font-semibold text-center">
                          {monthName} {yearStr}
                        </div>
                        
                        {/* Month container with border */}
                        <div className="rounded-lg border border-border/30 bg-secondary/10 p-2">
                          <div className="flex gap-1.5">
                            {monthWeeks
                              .sort((a, b) => a.weekIndex - b.weekIndex) // Sort weeks within month
                              .map(({ week, weekIndex }) => (
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
                {dateRange.start && dateRange.end ? (
                  `${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                ) : (
                  'Activity timeline'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
