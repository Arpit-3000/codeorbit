"use client"

import { Flame, Calendar, Target, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatWidgetProps {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle: string
  color: string
  bgColor: string
}

function StatWidget({ icon: Icon, label, value, subtitle, color, bgColor }: StatWidgetProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center gap-4">
        <div className={cn("flex size-12 items-center justify-center rounded-xl", bgColor)}>
          <Icon className={cn("size-5", color)} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

export function StatsWidgets() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatWidget
        icon={Flame}
        label="Current Streak"
        value={23}
        subtitle="days in a row"
        color="text-chart-5"
        bgColor="bg-chart-5/10"
      />
      <StatWidget
        icon={Calendar}
        label="Active Days"
        value={248}
        subtitle="out of 365"
        color="text-primary"
        bgColor="bg-primary/10"
      />
      <StatWidget
        icon={Target}
        label="Longest Streak"
        value={47}
        subtitle="personal best"
        color="text-success"
        bgColor="bg-success/10"
      />
      <StatWidget
        icon={Zap}
        label="Consistency"
        value="84%"
        subtitle="last 30 days"
        color="text-warning"
        bgColor="bg-warning/10"
      />
    </div>
  )
}

// Consistency Score with circular progress
export function ConsistencyScore() {
  const score = 84
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Consistency Score</h3>
        <div className="flex items-center justify-center">
          <div className="relative flex size-32 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="oklch(0.22 0.015 260)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="oklch(0.65 0.2 260)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">{score}%</span>
              <span className="text-[10px] text-muted-foreground">30-day avg</span>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active days</span>
            <span className="font-medium text-foreground">25/30</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Avg problems/day</span>
            <span className="font-medium text-foreground">7.2</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Platform Comparison Table
export function PlatformComparison() {
  const platforms = [
    { name: "LeetCode", solved: 847, rating: 2102, activity: 92, color: "bg-warning" },
    { name: "Codeforces", solved: 623, rating: 1856, activity: 78, color: "bg-chart-1" },
    { name: "CodeChef", solved: 412, rating: 1943, activity: 65, color: "bg-chart-5" },
    { name: "GFG", solved: 356, rating: 1680, activity: 54, color: "bg-success" },
  ]

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Platform Comparison</h3>
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground">
            <span>Platform</span>
            <span className="text-right">Solved</span>
            <span className="text-right">Rating</span>
            <span className="text-right">Activity</span>
          </div>
          {/* Rows */}
          {platforms.map((p) => (
            <div key={p.name} className="grid grid-cols-4 items-center text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", p.color)} />
                <span className="text-foreground font-medium">{p.name}</span>
              </div>
              <span className="text-right font-mono text-foreground">{p.solved}</span>
              <span className="text-right font-mono text-foreground">{p.rating}</span>
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full", p.color)}
                    style={{ width: `${p.activity}%` }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-xs text-muted-foreground">
                  {p.activity}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
