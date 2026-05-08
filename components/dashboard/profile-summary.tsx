"use client"

import { RefreshCw, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useState } from "react"

export function ProfileSummaryCard() {
  const { user, refreshUser } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [currentPlatform, setCurrentPlatform] = useState("")

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatLastSyncTime = (lastSyncedAt: string | null) => {
    console.log('formatLastSyncTime called with:', lastSyncedAt, 'Type:', typeof lastSyncedAt);
    
    if (!lastSyncedAt) return 'Never synced'
    
    const syncDate = new Date(lastSyncedAt)
    console.log('Parsed sync date:', syncDate, 'Is valid:', !isNaN(syncDate.getTime()));
    
    if (isNaN(syncDate.getTime())) return 'Never synced'
    
    const currentTime = new Date()
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
      setSyncProgress(0)
      setCurrentPlatform("Starting sync...")
      
      // Count connected platforms
      const connectedPlatforms: Array<{key: string, name: string, syncFn: () => Promise<any>}> = []
      
      if (user?.platforms?.leetcode?.verified) {
        connectedPlatforms.push({ 
          key: 'leetcode', 
          name: 'LeetCode',
          syncFn: async () => {
            const { syncLeetCode } = await import('@/lib/api')
            return syncLeetCode()
          }
        })
      }
      if (user?.platforms?.codeforces) {
        connectedPlatforms.push({ 
          key: 'codeforces', 
          name: 'Codeforces',
          syncFn: async () => {
            const { syncCodeforces } = await import('@/lib/api')
            return syncCodeforces()
          }
        })
      }
      if (user?.platforms?.github) {
        connectedPlatforms.push({ 
          key: 'github', 
          name: 'GitHub',
          syncFn: async () => {
            const { syncGithub } = await import('@/lib/api')
            return syncGithub()
          }
        })
      }
      if (user?.platforms?.codechef && (user.platforms.codechef.username || user.platforms.codechef.rating)) {
        connectedPlatforms.push({ 
          key: 'codechef', 
          name: 'CodeChef',
          syncFn: async () => {
            const { syncCodeChef } = await import('@/lib/api')
            return syncCodeChef()
          }
        })
      }
      if (user?.platforms?.gfg) {
        connectedPlatforms.push({ 
          key: 'gfg', 
          name: 'GeeksforGeeks',
          syncFn: async () => {
            const { syncGFG } = await import('@/lib/api')
            return syncGFG()
          }
        })
      }
      
      const totalPlatforms = connectedPlatforms.length || 1
      
      // Sync each platform sequentially and update progress
      for (let i = 0; i < connectedPlatforms.length; i++) {
        const platform = connectedPlatforms[i]
        setCurrentPlatform(`Syncing ${platform.name}...`)
        
        try {
          await platform.syncFn()
          console.log(`${platform.name} synced successfully`)
        } catch (error: any) {
          console.error(`${platform.name} sync failed:`, error)
          // Continue with other platforms even if one fails
        }
        
        // Update progress after each platform completes
        const progress = ((i + 1) / totalPlatforms) * 100
        setSyncProgress(progress)
      }
      
      setCurrentPlatform("Sync complete!")
      
      // Refresh user data to get updated lastSyncedAt
      await refreshUser()
      
      // Wait a bit to show completion
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Force page reload to update all components
      window.location.reload()
    } catch (error: any) {
      console.error("Sync failed:", error)
      alert(error.response?.data?.message || "Sync failed")
      setSyncProgress(0)
      setCurrentPlatform("")
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

          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-4">
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
            </div>
            
            {syncing && (
              <div className="space-y-1">
                <Progress value={syncProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{currentPlatform}</p>
              </div>
            )}
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
