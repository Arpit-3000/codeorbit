"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"

// Total Problems Solved Data
const problemBreakdown = [
  { platform: "LC", value: 847, color: "oklch(0.75 0.15 80)" },
  { platform: "CF", value: 623, color: "oklch(0.65 0.2 260)" },
  { platform: "CC", value: 412, color: "oklch(0.7 0.2 30)" },
  { platform: "GFG", value: 356, color: "oklch(0.7 0.18 165)" },
]

// Difficulty Distribution
const difficultyData = [
  { name: "Easy", value: 892, color: "oklch(0.7 0.18 165)" },
  { name: "Medium", value: 987, color: "oklch(0.75 0.15 80)" },
  { name: "Hard", value: 359, color: "oklch(0.6 0.22 330)" },
]

// Contest Ratings Over Time
const contestRatings = [
  { month: "Jul", leetcode: 1850, codeforces: 1600, codechef: 1700 },
  { month: "Aug", leetcode: 1920, codeforces: 1720, codechef: 1750 },
  { month: "Sep", leetcode: 1880, codeforces: 1680, codechef: 1820 },
  { month: "Oct", leetcode: 1950, codeforces: 1780, codechef: 1860 },
  { month: "Nov", leetcode: 2020, codeforces: 1820, codechef: 1900 },
  { month: "Dec", leetcode: 2050, codeforces: 1800, codechef: 1920 },
  { month: "Jan", leetcode: 2102, codeforces: 1856, codechef: 1943 },
]

// Weekly Activity
const weeklyActivity = [
  { day: "Mon", problems: 12 },
  { day: "Tue", problems: 8 },
  { day: "Wed", problems: 15 },
  { day: "Thu", problems: 6 },
  { day: "Fri", problems: 18 },
  { day: "Sat", problems: 22 },
  { day: "Sun", problems: 14 },
]

const CustomTooltipStyle = {
  backgroundColor: "oklch(0.17 0.01 260)",
  border: "1px solid oklch(0.25 0.015 260)",
  borderRadius: "8px",
  padding: "8px 12px",
  color: "oklch(0.95 0.01 260)",
  fontSize: "12px",
}

export function TotalProblemsSolved() {
  const total = problemBreakdown.reduce((a, b) => a + b.value, 0)

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Total Problems Solved</h3>
          <span className="text-xs text-success font-medium">+47 this week</span>
        </div>
        <p className="mb-6 text-4xl font-bold tracking-tight text-foreground animate-count-up">
          {total.toLocaleString()}
        </p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={problemBreakdown} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 260)" vertical={false} />
              <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "oklch(0.2 0.01 260)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {problemBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function DifficultyDistribution() {
  const total = difficultyData.reduce((a, b) => a + b.value, 0)

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Difficulty Distribution</h3>
        <div className="flex items-center gap-6">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {difficultyData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-muted-foreground">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{d.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((d.value / total) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ContestRatingsChart() {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Contest Rating History</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 80)" }} />
              <span className="text-[11px] text-muted-foreground">LeetCode</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full" style={{ backgroundColor: "oklch(0.65 0.2 260)" }} />
              <span className="text-[11px] text-muted-foreground">Codeforces</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full" style={{ backgroundColor: "oklch(0.7 0.2 30)" }} />
              <span className="text-[11px] text-muted-foreground">CodeChef</span>
            </div>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={contestRatings}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 260)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} domain={[1500, 2200]} />
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Line type="monotone" dataKey="leetcode" stroke="oklch(0.75 0.15 80)" strokeWidth={2} dot={{ r: 3, fill: "oklch(0.75 0.15 80)" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="codeforces" stroke="oklch(0.65 0.2 260)" strokeWidth={2} dot={{ r: 3, fill: "oklch(0.65 0.2 260)" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="codechef" stroke="oklch(0.7 0.2 30)" strokeWidth={2} dot={{ r: 3, fill: "oklch(0.7 0.2 30)" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function WeeklyActivityChart() {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Weekly Activity</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyActivity} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.015 260)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.6 0.02 260)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "oklch(0.2 0.01 260)" }} />
              <Bar dataKey="problems" fill="oklch(0.65 0.2 260)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
