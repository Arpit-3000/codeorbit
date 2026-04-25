"use client"

import { RefreshCw, ExternalLink, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { syncAllPlatforms } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function ProfileSummaryCard() {
  const { user, refreshUser } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute to keep "X minutes ago" accurate
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatLastSyncTime = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) return 'Never synced'
    
    const syncDate = new Date(lastSyncedAt)
    const diffInMinutes = Math.floor((currentTime.getTime() - syncDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    // For older dates, show the actual date
    return syncDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: syncDate.getFullYear() !== currentTime.getFullYear() ? 'numeric' : undefined
    })
  }
  const getConnectedPlatforms = () => {
    const platforms = [
      { name: "LeetCode", connected: !!user?.platforms?.leetcode?.verified, color: "text-warning" },
      { name: "Codeforces", connected: !!user?.platforms?.codeforces, color: "text-chart-1" },
      { name: "GitHub", connected: !!user?.platforms?.github, color: "text-foreground" },
      { name: "CodeChef", connected: !!(user?.platforms?.codechef && (user.platforms.codechef.username || user.platforms.codechef.rating)), color: "text-chart-2" },
      { name: "GFG", connected: !!user?.platforms?.gfg, color: "text-chart-3" },
    ]
    return platforms
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      const result = await syncAllPlatforms()
      
      // Show success message
      console.log("Sync result:", result)
      
      // Refresh user data to get updated lastSyncedAt
      await refreshUser()
      
      // Force page reload to update all components
      window.location.reload()
    } catch (error: any) {
      console.error("Sync failed:", error)
      alert(error.response?.data?.message || "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start gap-5">
        <Avatar className="size-16 border-2 border-primary/20">
          <AvatarImage src={user?.photoURL || ""} alt="User avatar" />
          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-lg font-bold text-primary">
            {user ? getInitials(user.displayName, user.email) : 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>

          {/* Connected platforms */}
          <div className="flex flex-wrap gap-2">
            {getConnectedPlatforms().map((p) => (
              <Badge
                key={p.name}
                variant={p.connected ? "secondary" : "outline"}
                className={`gap-1.5 border-border text-xs ${p.connected ? 'bg-secondary/80 text-secondary-foreground' : 'text-muted-foreground'}`}
              >
                {p.connected && <CheckCircle2 className={`size-3 ${p.color}`} />}
                {p.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-start gap-4 pt-1">
            <span className="text-xs text-muted-foreground">
              Provider: {user?.provider || 'Unknown'}
            </span>
            <div className="flex flex-col items-start gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 gap-1.5 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`size-3 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <span className="text-[10px] text-muted-foreground/80">
                Last synced: {formatLastSyncTime(user?.lastSyncedAt || null)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
