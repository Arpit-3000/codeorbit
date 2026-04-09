"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Bell, Link2, ChevronDown, Sun, Moon, Monitor, User, Settings, LogOut, TrendingUp, Trophy, BookOpen, Activity, AlertCircle, X } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/auth-context"
import { getContests } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopNavbarProps {
  onConnectPlatforms: () => void
}

interface SearchResult {
  id: string
  title: string
  description: string
  category: 'platform' | 'stat' | 'contest' | 'resource' | 'page'
  icon: any
  action: () => void
}

interface Contest {
  _id?: string
  platform: string
  name: string
  startTime: string
  duration: number
  link: string
}

export function TopNavbar({ onConnectPlatforms }: TopNavbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [todayContests, setTodayContests] = useState<Contest[]>([])
  const [showContestAlert, setShowContestAlert] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Fetch contests and check for today's contests
  useEffect(() => {
    console.log("=== NAVBAR COMPONENT LOADED ===")
    
    const fetchTodayContests = async () => {
      console.log("=== STARTING CONTEST FETCH ===")
      try {
        console.log("Calling getContests API...")
        const data = await getContests()
        console.log("API Response:", data)
        
        const today = new Date()
        const todayYear = today.getFullYear()
        const todayMonth = today.getMonth()
        const todayDate = today.getDate()
        
        console.log("Today's date:", today.toDateString())
        console.log("Today details:", { year: todayYear, month: todayMonth, date: todayDate })
        
        const contestsToday = data.contests.filter(contest => {
          const contestDate = new Date(contest.startTime)
          const contestYear = contestDate.getFullYear()
          const contestMonth = contestDate.getMonth()
          const contestDay = contestDate.getDate()
          
          const isToday = (
            contestYear === todayYear &&
            contestMonth === todayMonth &&
            contestDay === todayDate
          )
          
          console.log(`Contest: ${contest.name}, Date: ${contestDate.toDateString()}, Is today: ${isToday}`)
          
          return isToday
        })
        
        console.log("Contests today:", contestsToday)
        setTodayContests(contestsToday)
        setShowContestAlert(contestsToday.length > 0)
        
      } catch (error) {
        console.error("Failed to fetch contests:", error)
      }
    }

    fetchTodayContests()
    // Refresh every hour to check for new contests
    const interval = setInterval(fetchTodayContests, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getPlatformInfo = (platform: string) => {
    const lower = platform.toLowerCase()
    if (lower.includes('leetcode')) return { name: 'LeetCode', color: 'text-yellow-600' }
    if (lower.includes('codeforces')) return { name: 'Codeforces', color: 'text-blue-600' }
    if (lower.includes('codechef')) return { name: 'CodeChef', color: 'text-orange-600' }
    if (lower.includes('atcoder')) return { name: 'AtCoder', color: 'text-green-600' }
    if (lower.includes('gfg') || lower.includes('geeksforgeeks')) return { name: 'GeeksforGeeks', color: 'text-green-700' }
    return { name: platform, color: 'text-gray-600' }
  }

  const navigateToContests = () => {
    const event = new CustomEvent('navigate-to-tab', { detail: 'contests' })
    window.dispatchEvent(event)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  // All searchable items
  const allItems: SearchResult[] = [
    // Platforms
    {
      id: 'leetcode',
      title: 'LeetCode',
      description: 'View LeetCode stats and problems',
      category: 'platform',
      icon: TrendingUp,
      action: () => onConnectPlatforms()
    },
    {
      id: 'codeforces',
      title: 'Codeforces',
      description: 'View Codeforces rating and contests',
      category: 'platform',
      icon: TrendingUp,
      action: () => onConnectPlatforms()
    },
    {
      id: 'github',
      title: 'GitHub',
      description: 'View GitHub contributions and repos',
      category: 'platform',
      icon: TrendingUp,
      action: () => onConnectPlatforms()
    },
    // Stats
    {
      id: 'problems-solved',
      title: 'Problems Solved',
      description: 'Total problems solved across platforms',
      category: 'stat',
      icon: Activity,
      action: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    {
      id: 'consistency',
      title: 'Consistency Score',
      description: 'Your coding consistency metric',
      category: 'stat',
      icon: Activity,
      action: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    {
      id: 'streak',
      title: 'Current Streak',
      description: 'Days of continuous coding',
      category: 'stat',
      icon: Activity,
      action: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    // Pages
    {
      id: 'contests',
      title: 'Contests',
      description: 'Upcoming coding contests',
      category: 'page',
      icon: Trophy,
      action: navigateToContests
    },
    {
      id: 'resources',
      title: 'Resources',
      description: 'Learning resources and problem sets',
      category: 'page',
      icon: BookOpen,
      action: () => {
        const event = new CustomEvent('navigate-to-tab', { detail: 'resources' })
        window.dispatchEvent(event)
      }
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Deep dive into your coding analytics',
      category: 'page',
      icon: TrendingUp,
      action: () => {
        const event = new CustomEvent('navigate-to-tab', { detail: 'analytics' })
        window.dispatchEvent(event)
      }
    }
  ]

  // Search logic
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allItems.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    )

    setSearchResults(filtered)
    setShowResults(true)
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    result.action()
    setSearchQuery("")
    setShowResults(false)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'platform': return 'text-blue-500'
      case 'stat': return 'text-green-500'
      case 'contest': return 'text-purple-500'
      case 'resource': return 'text-orange-500'
      case 'page': return 'text-cyan-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <>
      {/* Contest Alert Banner */}
      {showContestAlert && todayContests.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-orange-600 dark:text-orange-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  🎯 {todayContests.length} Contest{todayContests.length > 1 ? 's' : ''} Today!
                </p>
                <div className="flex items-center gap-4 mt-1">
                  {todayContests.slice(0, 3).map((contest, index) => {
                    const platformInfo = getPlatformInfo(contest.platform)
                    const startTime = new Date(contest.startTime).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      hour12: true 
                    })
                    return (
                      <span key={contest._id} className="text-xs text-orange-700 dark:text-orange-300">
                        <span className={platformInfo.color}>{platformInfo.name}</span> at {startTime}
                      </span>
                    )
                  })}
                  {todayContests.length > 3 && (
                    <span className="text-xs text-orange-700 dark:text-orange-300">
                      +{todayContests.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={navigateToContests}
                className="h-7 px-3 text-xs border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/20"
              >
                View All
              </Button>
              <button
                onClick={() => setShowContestAlert(false)}
                className="p-1 rounded-md text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/20 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
      {/* Search */}
      <div ref={searchRef} className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search platforms, stats, contests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {searchResults.map((result) => {
                const Icon = result.icon
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                  >
                    <Icon className={`size-4 mt-0.5 ${getCategoryColor(result.category)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{result.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{result.description}</div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{result.category}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {showResults && searchQuery && searchResults.length === 0 && (
          <div className="absolute top-full mt-2 w-full rounded-lg border border-border bg-card shadow-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onConnectPlatforms}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Link2 className="size-4" />
          <span className="hidden sm:inline">Connect Platforms</span>
        </Button>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem 
              onClick={() => setTheme("light")}
              className="text-foreground focus:bg-accent gap-2"
            >
              <Sun className="size-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setTheme("dark")}
              className="text-foreground focus:bg-accent gap-2"
            >
              <Moon className="size-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setTheme("system")}
              className="text-foreground focus:bg-accent gap-2"
            >
              <Monitor className="size-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button className="relative flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <Bell className="size-4" />
          {todayContests.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white animate-pulse">
              {todayContests.length}
            </span>
          )}
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-accent">
              <Avatar className="size-8">
                <AvatarImage src={user?.photoURL || ""} alt="User avatar" />
                <AvatarFallback className="bg-primary/20 text-xs text-primary font-semibold">
                  {user ? getInitials(user.displayName, user.email) : 'U'}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">
                {user?.displayName || 'User'}
              </div>
              <div className="text-xs">{user?.email}</div>
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={() => {
                const event = new CustomEvent('navigate-to-tab', { detail: 'profile' })
                window.dispatchEvent(event)
              }}
              className="text-foreground focus:bg-accent gap-2"
            >
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground focus:bg-accent gap-2">
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={logout}
              className="text-destructive focus:bg-accent gap-2"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  )
}
