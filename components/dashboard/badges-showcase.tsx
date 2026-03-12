"use client"

import { Award, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { getBadges } from "@/lib/api"

interface Badge {
  name: string
  icon: string
  platform: string
}

export function BadgesShowcase() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true)
        const data = await getBadges()
        setBadges(data.badges)
      } catch (err) {
        console.error("Failed to fetch badges", err)
      } finally {
        setLoading(false)
      }
    }

    fetchBadges()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="size-4 text-warning" />
          <h3 className="text-sm font-medium text-muted-foreground">Achievements</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          No badges earned yet. Keep solving problems to unlock achievements!
        </div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="size-4 text-warning" />
          <h3 className="text-sm font-medium text-muted-foreground">Achievements</h3>
          <span className="ml-auto text-xs text-muted-foreground">{badges.length} badges</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {badges.slice(0, 8).map((badge, index) => (
            <div
              key={index}
              className="group/badge relative flex flex-col items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 transition-all hover:border-warning/50 hover:bg-warning/5"
            >
              <div className="relative">
                <img
                  src={badge.icon}
                  alt={badge.name}
                  className="size-10 object-contain"
                />
                <div className="absolute -inset-1 rounded-full bg-warning/20 opacity-0 blur transition-opacity group-hover/badge:opacity-100" />
              </div>
              <span className="text-[10px] text-center text-muted-foreground line-clamp-2 leading-tight">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
        {badges.length > 8 && (
          <div className="mt-3 text-center text-xs text-muted-foreground">
            +{badges.length - 8} more badges
          </div>
        )}
      </div>
    </div>
  )
}
