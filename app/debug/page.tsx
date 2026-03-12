"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getHeatmap, getDashboardStats } from "@/lib/api"

export default function DebugPage() {
  const { user } = useAuth()
  const [heatmapData, setHeatmapData] = useState<any>(null)
  const [statsData, setStatsData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const heatmap = await getHeatmap()
        const stats = await getDashboardStats()
        setHeatmapData(heatmap)
        setStatsData(stats)
      } catch (err: any) {
        setError(err.message)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Debug Page</h1>

      <div className="space-y-4">
        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">User Data</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Heatmap Data</h2>
          {heatmapData ? (
            <div>
              <p>Total days: {heatmapData.heatmap?.length || 0}</p>
              <p>Days with activity: {heatmapData.heatmap?.filter((d: any) => d.count > 0).length || 0}</p>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(heatmapData, null, 2)}
              </pre>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold mb-2">Stats Data</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(statsData, null, 2)}
          </pre>
        </div>

        {error && (
          <div className="border border-red-500 rounded p-4 text-red-500">
            <h2 className="font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
