"use client"

import { Calendar, Clock, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getContests } from "@/lib/api"

interface Contest {
  _id?: string
  platform: string
  name: string
  startTime: string
  duration: number
  link: string
}

export function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getContests()
        // Filter contests to show only current and next month
        const selectedMonth = currentDate.getMonth()
        const selectedYear = currentDate.getFullYear()
        const filteredContests = data.contests.filter(contest => {
          const contestDate = new Date(contest.startTime)
          return contestDate.getMonth() === selectedMonth && contestDate.getFullYear() === selectedYear
        })
        setContests(filteredContests)
      } catch (err: any) {
        console.error("Failed to fetch contests", err)
        setError(err.response?.data?.message || "Failed to load contests")
      } finally {
        setLoading(false)
      }
    }

    fetchContests()
  }, [currentDate])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getPlatformInfo = (platform: string) => {
    const lower = platform.toLowerCase()
    if (lower.includes('leetcode')) return { 
      logo: '/LeetCode_logo_black.png', 
      name: 'LC', 
      fullName: 'LeetCode',
      color: 'bg-yellow-500'
    }
    if (lower.includes('codeforces')) return { 
      logo: '/Codeforces_logo.png', 
      name: 'CF', 
      fullName: 'Codeforces',
      color: 'bg-blue-500'
    }
    if (lower.includes('codechef')) return { 
      logo: '/CodeChef_Logo.png', 
      name: 'CC', 
      fullName: 'CodeChef',
      color: 'bg-orange-500'
    }
    if (lower.includes('atcoder')) return { 
      logo: null, 
      name: 'AC', 
      fullName: 'AtCoder',
      color: 'bg-green-500'
    }
    if (lower.includes('gfg') || lower.includes('geeksforgeeks')) return { 
      logo: null, 
      name: 'GFG', 
      fullName: 'GeeksforGeeks',
      color: 'bg-green-600'
    }
    return { 
      logo: null, 
      name: platform.slice(0, 2).toUpperCase(), 
      fullName: platform,
      color: 'bg-gray-500'
    }
  }

  const getContestsForDate = (date: Date) => {
    const dateStr = date.toDateString()
    return contests.filter(contest => {
      const contestDate = new Date(contest.startTime)
      return contestDate.toDateString() === dateStr
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'next') {
        // Go to next month
        newDate.setMonth(prev.getMonth() + 1)
      } else if (direction === 'prev') {
        // Go to previous month
        newDate.setMonth(prev.getMonth() - 1)
      }
      return newDate
    })
  }

  const isCurrentMonth = () => {
    const today = new Date()
    return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
  }

  const canGoNext = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const viewingMonth = currentDate.getMonth()
    const viewingYear = currentDate.getFullYear()
    
    // Allow going next only if we're not already 1 month ahead
    if (viewingYear > currentYear) return false
    if (viewingYear === currentYear && viewingMonth > currentMonth + 1) return false
    return true
  }

  const canGoPrev = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const viewingMonth = currentDate.getMonth()
    const viewingYear = currentDate.getFullYear()
    
    // Allow going back only if we're not already at current month or before
    if (viewingYear < currentYear) return false
    if (viewingYear === currentYear && viewingMonth <= currentMonth) return false
    return true
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

  const days = getDaysInMonth(currentDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track upcoming and past competitive programming contests
        </p>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            disabled={!canGoPrev()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            disabled={!canGoNext()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {dayNames.map(day => (
            <div key={day} className="p-4 text-center text-base font-semibold text-muted-foreground bg-muted/50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-36 border-r border-b border-border bg-muted/20" />
            }

            const dayContests = getContestsForDate(day)
            const isToday = day.toDateString() === new Date().toDateString()

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "h-36 border-r border-b border-border p-3 relative overflow-hidden",
                  isToday && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-base font-semibold mb-2",
                  isToday ? "text-primary font-bold" : "text-foreground"
                )}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-2">
                  {dayContests.slice(0, 2).map((contest) => {
                    const platformInfo = getPlatformInfo(contest.platform)
                    const startTime = formatTime(contest.startTime)
                    
                    return (
                      <button
                        key={contest._id || contest.name}
                        onClick={() => window.open(contest.link, '_blank')}
                        className="w-full text-left group"
                      >
                        <div className="flex flex-col items-center gap-1 p-2 rounded-md text-xs hover:bg-muted/50 transition-colors">
                          <span className="truncate text-foreground group-hover:text-primary font-medium text-center w-full">
                            {contest.name.length > 12 ? contest.name.slice(0, 12) + '...' : contest.name}
                          </span>
                          <span className="text-xs text-muted-foreground text-center">
                            {startTime}
                          </span>
                          {platformInfo.logo ? (
                            <img 
                              src={platformInfo.logo} 
                              alt={platformInfo.fullName}
                              className={cn(
                                "object-contain flex-shrink-0",
                                platformInfo.fullName === 'Codeforces' ? "w-16 h-16" : "w-12 h-12"
                              )}
                            />
                          ) : (
                            <div className={cn("w-10 h-10 rounded-full flex-shrink-0", platformInfo.color)} />
                          )}
                        </div>
                      </button>
                    )
                  })}
                  {dayContests.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayContests.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-muted-foreground">Platforms:</span>
        <div className="flex items-center gap-1">
          <img src="/LeetCode_logo_black.png" alt="LeetCode" className="w-6 h-6 object-contain" />
          <span>LeetCode</span>
        </div>
        <div className="flex items-center gap-1">
          <img src="/Codeforces_logo.png" alt="Codeforces" className="w-10 h-10 object-contain" />
          <span>Codeforces</span>
        </div>
        <div className="flex items-center gap-1">
          <img src="/CodeChef_Logo.png" alt="CodeChef" className="w-6 h-6 object-contain" />
          <span>CodeChef</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>GeeksforGeeks</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>AtCoder</span>
        </div>
      </div>
    </div>
  )
}
