"use client"

import {
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  Zap,
  CheckCircle2,
  ArrowRight,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const strengths = [
  { topic: "Dynamic Programming", level: 92, color: "bg-primary" },
  { topic: "Graph Theory", level: 88, color: "bg-success" },
  { topic: "Binary Search", level: 85, color: "bg-chart-1" },
  { topic: "Greedy Algorithms", level: 82, color: "bg-warning" },
]

const weaknesses = [
  { topic: "Segment Trees", level: 35, suggestion: "Practice range query problems" },
  { topic: "Number Theory", level: 42, suggestion: "Focus on modular arithmetic" },
  { topic: "String Algorithms", level: 48, suggestion: "Try KMP and suffix array problems" },
]

const weeklyGoals = [
  { task: "Solve 10 medium DP problems", completed: 7, total: 10, icon: Target },
  { task: "Attempt 2 Codeforces contests", completed: 1, total: 2, icon: TrendingUp },
  { task: "Practice segment trees", completed: 3, total: 5, icon: Brain },
  { task: "Solve 5 hard graph problems", completed: 2, total: 5, icon: Zap },
]

const focusSuggestions = [
  {
    title: "Improve Consistency",
    description: "Your weekend activity drops significantly. Try to maintain at least 3 problems on weekends.",
    priority: "High",
    icon: BarChart3,
  },
  {
    title: "Attempt Harder Problems",
    description: "84% of your solved problems are Easy/Medium. Challenge yourself with more Hard problems.",
    priority: "Medium",
    icon: TrendingUp,
  },
  {
    title: "Participate in More Contests",
    description: "Contest participation improves problem-solving speed. Aim for 3 contests per week.",
    priority: "High",
    icon: Target,
  },
]

export function AIInsightsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered performance analysis and personalized recommendations
        </p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Strengths */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="size-4 text-success" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Your Strengths</h3>
            </div>
            <div className="space-y-4">
              {strengths.map((s) => (
                <div key={s.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{s.topic}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.level}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", s.color)}
                      style={{ width: `${s.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weaknesses */}
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-5/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-5/10">
                <Target className="size-4 text-chart-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Areas to Improve</h3>
            </div>
            <div className="space-y-4">
              {weaknesses.map((w) => (
                <div key={w.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{w.topic}</span>
                    <span className="font-mono text-xs text-destructive">{w.level}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-chart-5 transition-all duration-700"
                      style={{ width: `${w.level}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{w.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Focus Suggestions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Focus Suggestions
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {focusSuggestions.map((s, i) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <s.icon className="size-4 text-primary" />
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px] border-0",
                      s.priority === "High" ? "bg-chart-5/10 text-chart-5" : "bg-warning/10 text-warning"
                    )}
                  >
                    {s.priority}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Action Plan */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Zap className="size-4 text-warning" />
          Weekly Action Plan
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {weeklyGoals.map((goal, i) => (
            <div
              key={goal.task}
              className="flex items-center gap-4 border-b border-border/50 p-4 last:border-0 transition-colors hover:bg-secondary/30"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <goal.icon className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{goal.task}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${(goal.completed / goal.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {goal.completed}/{goal.total}
                  </span>
                </div>
              </div>
              {goal.completed === goal.total && (
                <CheckCircle2 className="size-5 text-success" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
