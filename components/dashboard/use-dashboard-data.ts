"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getBadges,
  getContestRatings,
  getDashboardStats,
  getHeatmap,
  getProblemStats,
  getWeeklyActivity,
  type BadgesData,
  type ContestRatingsData,
  type DashboardStats,
  type HeatmapData,
  type ProblemStatsData,
  type WeeklyActivityData,
} from "@/lib/api"

export interface Slice<T> {
  data: T | null
  error: string | null
  loading: boolean
}

export interface DashboardData {
  stats: Slice<DashboardStats>
  problems: Slice<ProblemStatsData>
  ratings: Slice<ContestRatingsData>
  weekly: Slice<WeeklyActivityData>
  heatmap: Slice<HeatmapData>
  badges: Slice<BadgesData>
  /** Re-fetch everything (used after a sync, or by a section's retry). */
  reload: () => void
}

const empty = <T,>(): Slice<T> => ({ data: null, error: null, loading: true })

function messageOf(err: any, fallback: string) {
  return err?.response?.data?.message || err?.message || fallback
}

/**
 * One fetch per analytics endpoint for the whole dashboard.
 * (Previously each widget fetched independently: stats x3, problem-stats x2.)
 * Failures are isolated per slice so one broken endpoint never blanks the page.
 */
export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<Slice<DashboardStats>>(empty)
  const [problems, setProblems] = useState<Slice<ProblemStatsData>>(empty)
  const [ratings, setRatings] = useState<Slice<ContestRatingsData>>(empty)
  const [weekly, setWeekly] = useState<Slice<WeeklyActivityData>>(empty)
  const [heatmap, setHeatmap] = useState<Slice<HeatmapData>>(empty)
  const [badges, setBadges] = useState<Slice<BadgesData>>(empty)
  const [nonce, setNonce] = useState(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    const run = <T,>(
      fn: () => Promise<T>,
      set: React.Dispatch<React.SetStateAction<Slice<T>>>,
      fallback: string
    ) => {
      // keep previous data visible while refreshing
      set((prev) => ({ ...prev, loading: true, error: null }))
      fn()
        .then((data) => alive.current && set({ data, error: null, loading: false }))
        .catch((err) => {
          console.error(fallback, err)
          alive.current && set((prev) => ({ data: prev.data, error: messageOf(err, fallback), loading: false }))
        })
    }
    run(getDashboardStats, setStats, "Couldn't load streak stats")
    run(getProblemStats, setProblems, "Couldn't load problem stats")
    run(getContestRatings, setRatings, "Couldn't load contest ratings")
    run(getWeeklyActivity, setWeekly, "Couldn't load weekly activity")
    run(getHeatmap, setHeatmap, "Couldn't load activity history")
    run(getBadges, setBadges, "Couldn't load achievements")
  }, [nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  // the Sync button lives in the navbar and announces when it has finished
  useEffect(() => {
    window.addEventListener("codeorbit:synced", reload)
    return () => window.removeEventListener("codeorbit:synced", reload)
  }, [reload])

  return { stats, problems, ratings, weekly, heatmap, badges, reload }
}
