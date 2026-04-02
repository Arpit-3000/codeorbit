"use client"

import { useState, useEffect } from "react"
import { Activity, Calendar, TrendingUp, BarChart3, Code, Trophy, Clock, ExternalLink, Filter } from "lucide-react"
import { getWeeklyActivity, getAllProblems, getLeetCodeProblems, getCodeforcesProblems } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface WeeklyTrend {
  day: string
  problems: number
}

interface WeeklyActivityData {
  weeklyTrend: WeeklyTrend[]
}

interface Problem {
  id: string
  title: string
  titleSlug?: string
  timestamp: string
  status?: string
  language: string
  runtime?: string
  memory?: string
  link: string
  platform: string
  contestId?: number
  index?: string
  rating?: number
  tags?: string[]
}

interface AllProblemsData {
  problems: Problem[]
  totalProblems: number
  platformStats: {
    leetcode: {
      total: number
      connected: boolean
    }
    codeforces: {
      total: number
      connected: boolean
    }
  }
  message: string
}

interface PlatformProblemsData {
  problems: Problem[]
  total: number
  platform: string
}

export function ActivityPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklyTrend[]>([])
  const [allProblems, setAllProblems] = useState<AllProblemsData | null>(null)
  const [leetcodeProblems, setLeetcodeProblems] = useState<PlatformProblemsData | null>(null)
  const [codeforcesProblems, setCodeforcesProblems] = useState<PlatformProblemsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch all data in parallel
        const [weeklyResponse, allProblemsResponse, leetcodeResponse, codeforcesResponse] = await Promise.allSettled([
          getWeeklyActivity(),
          getAllProblems(),
          getLeetCodeProblems(),
          getCodeforcesProblems()
        ])

        // Handle weekly activity data
        if (weeklyResponse.status === 'fulfilled') {
          setWeeklyData(weeklyResponse.value.weeklyTrend)
        }

        // Handle all problems data
        if (allProblemsResponse.status === 'fulfilled') {
          setAllProblems(allProblemsResponse.value)
        }

        // Handle LeetCode problems data
        if (leetcodeResponse.status === 'fulfilled') {
          setLeetcodeProblems(leetcodeResponse.value)
        }

        // Handle Codeforces problems data
        if (codeforcesResponse.status === 'fulfilled') {
          setCodeforcesProblems(codeforcesResponse.value)
        }

      } catch (err: any) {
        console.error("Failed to fetch activity data:", err)
        setError(err.response?.data?.message || "Failed to load activity data")
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  // Auto-switch to overview if current tab becomes unavailable
  useEffect(() => {
    if (!loading && allProblems) {
      const availableTabs = ['overview']
      
      if (allProblems.totalProblems > 0) {
        availableTabs.push('all-problems')
      }
      
      if (allProblems.platformStats.leetcode.connected) {
        availableTabs.push('leetcode')
      }
      
      if (allProblems.platformStats.codeforces.connected) {
        availableTabs.push('codeforces')
      }
      
      if (!availableTabs.includes(activeTab)) {
        setActiveTab('overview')
      }
    }
  }, [allProblems, loading, activeTab])

  const getTotalProblems = () => {
    return allProblems?.totalProblems || weeklyData.reduce((total, day) => total + day.problems, 0)
  }

  const getAverageProblems = () => {
    if (weeklyData.length === 0) return 0
    return Math.round((weeklyData.reduce((total, day) => total + day.problems, 0) / weeklyData.length) * 10) / 10
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPlatformColor = (platform: string) => {
    const lower = platform.toLowerCase()
    if (lower.includes('leetcode')) return 'bg-yellow-500'
    if (lower.includes('codeforces')) return 'bg-blue-500'
    if (lower.includes('codechef')) return 'bg-orange-500'
    return 'bg-gray-500'
  }

  const getPlatformTextColor = (platform: string) => {
    const lower = platform.toLowerCase()
    if (lower.includes('leetcode')) return 'text-yellow-600'
    if (lower.includes('codeforces')) return 'text-blue-600'
    if (lower.includes('codechef')) return 'text-orange-600'
    return 'text-gray-600'
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
          Detailed activity log and problems solved across all platforms
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-auto" style={{ 
        gridTemplateColumns: `repeat(${
          1 + // Total Problems always present
          (allProblems?.platformStats.leetcode.connected ? 1 : 0) + // LeetCode if connected
          (allProblems?.platformStats.codeforces.connected ? 1 : 0) + // Codeforces if connected
          1 // Daily Average always present
        }, 1fr)` 
      }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalProblems()}</div>
            <p className="text-xs text-muted-foreground">All platforms</p>
          </CardContent>
        </Card>

        {allProblems?.platformStats.leetcode.connected && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LeetCode</CardTitle>
              <Code className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allProblems?.platformStats.leetcode.total || 0}</div>
              <p className="text-xs text-muted-foreground">Connected</p>
            </CardContent>
          </Card>
        )}

        {allProblems?.platformStats.codeforces.connected && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Codeforces</CardTitle>
              <Trophy className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allProblems?.platformStats.codeforces.total || 0}</div>
              <p className="text-xs text-muted-foreground">Connected</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageProblems()}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${
          1 + // overview always present
          (allProblems && allProblems.totalProblems > 0 ? 1 : 0) + // all-problems if has problems
          (allProblems?.platformStats.leetcode.connected ? 1 : 0) + // leetcode if connected
          (allProblems?.platformStats.codeforces.connected ? 1 : 0) // codeforces if connected
        }, 1fr)` }}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {allProblems && allProblems.totalProblems > 0 && (
            <TabsTrigger value="all-problems">All Problems</TabsTrigger>
          )}
          {allProblems?.platformStats.leetcode.connected && (
            <TabsTrigger value="leetcode">LeetCode</TabsTrigger>
          )}
          {allProblems?.platformStats.codeforces.connected && (
            <TabsTrigger value="codeforces">Codeforces</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="all-problems">
          {allProblems && allProblems.totalProblems > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  All Problems ({allProblems?.totalProblems || 0})
                </CardTitle>
                <CardDescription>
                  Problems solved across all connected platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allProblems?.problems.map((problem, index) => (
                    <div key={problem.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${getPlatformColor(problem.platform)}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{problem.title}</h4>
                            {problem.status && (
                              <Badge variant="secondary" className="text-xs">
                                {problem.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className={getPlatformTextColor(problem.platform)}>
                              {problem.platform}
                            </span>
                            <span>{problem.language}</span>
                            <span>{formatDate(problem.timestamp)}</span>
                            {problem.runtime && <span>{problem.runtime}</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(problem.link, '_blank')}
                        className="ml-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No problems found. Connect your platforms to see your solved problems.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leetcode">
          {allProblems?.platformStats.leetcode.connected ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-yellow-600" />
                  LeetCode Problems ({leetcodeProblems?.total || 0})
                </CardTitle>
                <CardDescription>
                  Problems solved on LeetCode platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {leetcodeProblems?.problems.map((problem, index) => (
                    <div key={problem.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{problem.title}</h4>
                            {problem.status && (
                              <Badge variant="secondary" className="text-xs">
                                {problem.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{problem.language}</span>
                            <span>{formatDate(problem.timestamp)}</span>
                            {problem.runtime && <span>{problem.runtime}</span>}
                            {problem.memory && <span>{problem.memory}</span>}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(problem.link, '_blank')}
                        className="ml-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      No LeetCode problems found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="codeforces">
          {allProblems?.platformStats.codeforces.connected ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  Codeforces Problems ({codeforcesProblems?.total || 0})
                </CardTitle>
                <CardDescription>
                  Problems solved on Codeforces platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {codeforcesProblems?.problems.map((problem, index) => (
                    <div key={problem.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{problem.title}</h4>
                            {problem.rating && (
                              <Badge variant="outline" className="text-xs">
                                {problem.rating}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{problem.language}</span>
                            <span>{formatDate(problem.timestamp)}</span>
                            {problem.contestId && <span>Contest {problem.contestId}</span>}
                            {problem.index && <span>Problem {problem.index}</span>}
                          </div>
                          {problem.tags && problem.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {problem.tags.slice(0, 3).map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {problem.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{problem.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(problem.link, '_blank')}
                        className="ml-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      No Codeforces problems found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}