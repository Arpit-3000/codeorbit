"use client"

import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function generateHeatmapData() {
  const data: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Generate realistic activity patterns
    let count = 0
    const rand = Math.random()
    if (rand > 0.3) {
      count = isWeekend
        ? Math.floor(Math.random() * 8) + 1
        : Math.floor(Math.random() * 12) + 1
    }
    data.push({
      date: date.toISOString().split("T")[0],
      count,
    })
  }
  return data
}

function getColor(count: number) {
  if (count === 0) return "bg-secondary/50"
  if (count <= 2) return "bg-primary/20"
  if (count <= 5) return "bg-primary/40"
  if (count <= 8) return "bg-primary/60"
  return "bg-primary/90"
}

export function ActivityHeatmap() {
  const data = useMemo(() => generateHeatmapData(), [])
  const totalContributions = data.reduce((a, b) => a + b.count, 0)

  // Group by week
  const weeks: { date: string; count: number }[][] = []
  let currentWeek: { date: string; count: number }[] = []

  // Pad the first week
  const firstDay = new Date(data[0].date).getDay()
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: "", count: -1 })
  }

  for (const day of data) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

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
