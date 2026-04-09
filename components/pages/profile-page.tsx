"use client"

import { User, Mail, Shield, Code2, Trophy, GitBranch, Activity, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentUserProfile } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileData {
  id: string
  email: string
  displayName: string | null
  photoURL: string | null
  provider: string
  lastSyncedAt: string
  platforms: {
    leetcode: {
      username: string
      verified: boolean
      totalSolved: number
      contestRating: number
      contestsPlayed: number
    } | null
    codeforces: {
      handle: string
      rating: number
      maxRating: number
      rank: string
      solvedProblems: number
      contestsPlayed: number
    } | null
    github: {
      username: string
      avatar: string
      followers: number
      publicRepos: number
      totalStars: number
      totalContributions: number
    } | null
  }
  stats: {
    activeDays: number
    consistencyScore: number
  }
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getCurrentUserProfile()
        console.log("Profile data:", data)
        setProfile(data)
      } catch (err: any) {
        console.error("Failed to fetch profile", err)
        setError(err.response?.data?.message || "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and edit your developer profile</p>
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
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and edit your developer profile</p>
        </div>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and edit your developer profile</p>
        </div>
        <div className="text-sm text-muted-foreground">No profile data available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and edit your developer profile</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">Account Information</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={profile.photoURL || ""} alt="Profile picture" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-2xl font-bold text-primary">
                    {getInitials(profile.displayName, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-foreground">
                    {profile.displayName || "No display name"}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {profile.provider === "google" ? "Google Account" : "Local Account"}
                  </Badge>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="capitalize text-foreground">{profile.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Display Name:</span>
                  <span className="text-foreground">{profile.displayName || "Not set"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Synced:</span>
                  <span className="text-foreground">
                    {profile.lastSyncedAt ? new Date(profile.lastSyncedAt).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">Activity Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <div className="text-3xl font-bold text-foreground">{profile.stats.activeDays}</div>
                <div className="text-sm text-muted-foreground">Active Days</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-3xl font-bold text-foreground">{profile.stats.consistencyScore}%</div>
                <div className="text-sm text-muted-foreground">Consistency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">Connected Platforms</h3>
            <div className="space-y-3">
              {/* LeetCode */}
              {profile.platforms.leetcode && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-warning" />
                      <div className="font-medium text-foreground">LeetCode</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">@{profile.platforms.leetcode.username}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Solved</div>
                      <div className="font-semibold text-foreground">{profile.platforms.leetcode.totalSolved}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rating</div>
                      <div className="font-semibold text-foreground">
                        {profile.platforms.leetcode.contestRating || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Codeforces */}
              {profile.platforms.codeforces && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <div className="font-medium text-foreground">Codeforces</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">@{profile.platforms.codeforces.handle}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Solved</div>
                      <div className="font-semibold text-foreground">
                        {profile.platforms.codeforces.solvedProblems}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rating</div>
                      <div className="font-semibold text-foreground">{Number(profile.platforms.codeforces.rating).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Rank: </span>
                    <span className="font-semibold capitalize text-foreground">{profile.platforms.codeforces.rank}</span>
                  </div>
                </div>
              )}

              {/* GitHub */}
              {profile.platforms.github && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-success" />
                      <div className="font-medium text-foreground">GitHub</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">@{profile.platforms.github.username}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Repos</div>
                      <div className="font-semibold text-foreground">{profile.platforms.github.publicRepos}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Stars</div>
                      <div className="font-semibold text-foreground">{profile.platforms.github.totalStars}</div>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Contributions: </span>
                    <span className="font-semibold text-foreground">
                      {profile.platforms.github.totalContributions}
                    </span>
                  </div>
                </div>
              )}

              {/* CodeChef */}
              {profile.platforms.codechef && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-chart-2" />
                      <div className="font-medium text-foreground">CodeChef</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">@{profile.platforms.codechef.username}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Rating</div>
                      <div className="font-semibold text-foreground">{Number(profile.platforms.codechef.rating).toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Highest</div>
                      <div className="font-semibold text-foreground">{Number(profile.platforms.codechef.highestRating).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Stars</div>
                      <div className="font-semibold text-foreground">{profile.platforms.codechef.stars}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Global Rank</div>
                      <div className="font-semibold text-foreground">{profile.platforms.codechef.globalRank || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* GFG */}
              {profile.platforms.gfg && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-chart-3" />
                      <div className="font-medium text-foreground">GeeksforGeeks</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">@{profile.platforms.gfg.username}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Score</div>
                      <div className="font-semibold text-foreground">{profile.platforms.gfg.score}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Solved</div>
                      <div className="font-semibold text-foreground">{profile.platforms.gfg.problemsSolved}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show message if no platforms connected */}
              {!profile.platforms.leetcode && 
               !profile.platforms.codeforces && 
               !profile.platforms.github && 
               !profile.platforms.codechef && 
               !profile.platforms.gfg && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <div className="text-sm text-muted-foreground">No platforms connected yet</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Connect your coding platforms to see your stats here
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
