"use client"

import { useState, useEffect } from "react"
import { Activity, Calendar, TrendingUp, BarChart3 } from "lucide-react"
import { getWeeklyActivity } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface WeeklyTrend {
  day: string
  problems: number
}

interface WeeklyActivityData {
  weeklyTrend: WeeklyTrend[]
}

export function ActivityPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeeklyActivity = async () => {
      try {
        setLoading(true)
        setError(null)
        const data: WeeklyActivityData = await getWeeklyActivity()
        setWeeklyData(data.weeklyTrend)
      } catch (err: any) {
        console.error("Failed to fetch weekly activity:", err)
        setError(err.response?.data?.message || "Failed to load activity data")
      } finally {
        setLoading(false)
      }
    }

    fetchWeeklyActivity()
  }, [])

  const getTotalProblems = () => {
    return weeklyData.reduce((total, day) => total + day.problems, 0)
  }

  const getAverageProblems = () => {
    if (weeklyData.length === 0) return 0
    return Math.round((getTotalProblems() / weeklyData.length) * 10) / 10
  }

  const getMostActiveDay = () => {
    if (weeklyData.length === 0) return "N/A"
    const maxDay = weeklyData.reduce((max, day) => 
      day.problems > max.problems ? day : max
    )
    return `${maxDay.day} (${maxDay.problems} problems)`
  }

  const getActivityLevel = (problems: number) => {
    if (problems === 0) return "bg-gray-100 dark:bg-gray-800"
    if (problems <= 1) return "bg-blue-200 dark:bg-blue-900"
    if (problems <= 2) return "bg-blue-400 dark:bg-blue-700"
    if (problems <= 3) return "bg-blue-600 dark:bg-blue-500"
    return "bg-blue-800 dark:bg-blue-300"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed activity log across all platforms
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed activity log across all platforms
          </p>
        </div>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed activity log across all platforms
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalProblems()}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageProblems()}</div>
            <p className="text-xs text-muted-foreground">Problems per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMostActiveDay()}</div>
            <p className="text-xs text-muted-foreground">Best day this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly Activity Chart
          </CardTitle>
          <CardDescription>
            Problems solved each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value) => [`${value} problems`, 'Problems Solved']}
                />
                <Bar 
                  dataKey="problems" 
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Activity Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Activity Grid
          </CardTitle>
          <CardDescription>
            Visual representation of your daily problem-solving activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Days in a straight horizontal line */}
            <div className="flex justify-between items-center gap-4">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {day.day}
                  </div>
                  <div 
                    className={`w-16 h-16 rounded-lg flex items-center justify-center text-lg font-bold ${getActivityLevel(day.problems)} transition-all hover:scale-105`}
                    title={`${day.day}: ${day.problems} problems`}
                  >
                    {day.problems}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    problem{day.problems !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800"></div>
                <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900"></div>
                <div className="w-3 h-3 rounded bg-blue-400 dark:bg-blue-700"></div>
                <div className="w-3 h-3 rounded bg-blue-600 dark:bg-blue-500"></div>
                <div className="w-3 h-3 rounded bg-blue-800 dark:bg-blue-300"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>
            Detailed view of problems solved each day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${getActivityLevel(day.problems)}`}></div>
                  <span className="font-medium">{day.day}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{day.problems}</span>
                  <span className="text-sm text-muted-foreground">
                    problem{day.problems !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}