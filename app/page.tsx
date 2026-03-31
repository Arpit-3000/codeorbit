"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { ConnectPlatformsModal } from "@/components/connect-platforms-modal"
import { ProfileSummaryCard } from "@/components/dashboard/profile-summary"
import { PlatformStatsGrid } from "@/components/dashboard/platform-stats"
import {
  TotalProblemsSolved,
  DifficultyDistribution,
  ContestRatingsChart,
  WeeklyActivityChart,
} from "@/components/dashboard/charts"
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap"
import { StatsWidgets, ConsistencyScore, PlatformComparison } from "@/components/dashboard/stats-widgets"
import { BadgesShowcase } from "@/components/dashboard/badges-showcase"
import { ContestsPage } from "@/components/pages/contests-page"
import { ResourcesPage } from "@/components/pages/resources-page"
import { AIInsightsPage } from "@/components/pages/ai-insights-page"
import { ProfilePage } from "@/components/pages/profile-page"
import { ActivityPage } from "@/components/pages/activity-page"

function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your unified coding performance overview across all platforms
        </p>
      </div>

      {/* Profile Summary */}
      <ProfileSummaryCard />

      {/* Stats Widgets */}
      <StatsWidgets />

      {/* Platform Stats Grid */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-foreground">Platform Stats</h2>
        <PlatformStatsGrid />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TotalProblemsSolved />
        <DifficultyDistribution />
      </div>

      {/* Contest Ratings */}
      <ContestRatingsChart />

      {/* Activity Heatmap */}
      <ActivityHeatmap />

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WeeklyActivityChart />
        <ConsistencyScore />
        <PlatformComparison />
      </div>

      {/* Badges */}
      <BadgesShowcase />
    </div>
  )
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex h-64 items-center justify-center rounded-xl border border-border border-dashed bg-card/50">
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  )
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [connectModalOpen, setConnectModalOpen] = useState(false)

  // Listen for navigation events from search
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setActiveTab(event.detail)
    }

    window.addEventListener('navigate-to-tab' as any, handleNavigate)
    return () => window.removeEventListener('navigate-to-tab' as any, handleNavigate)
  }, [])

  function renderContent() {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent />
      case "profile":
        return <ProfilePage />
      case "analytics":
        return <PlaceholderPage title="Analytics" description="Deep dive into your coding analytics" />
      case "activity":
        return <ActivityPage />
      case "contests":
        return <ContestsPage />
      case "resources":
        return <ResourcesPage />
      case "ai-insights":
        return <AIInsightsPage />
      case "settings":
        return <PlaceholderPage title="Settings" description="Manage your account preferences" />
      default:
        return <DashboardContent />
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNavbar onConnectPlatforms={() => setConnectModalOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-6 lg:p-8">
              {renderContent()}
            </div>
          </main>
        </div>

        <ConnectPlatformsModal
          open={connectModalOpen}
          onOpenChange={setConnectModalOpen}
        />
      </div>
    </AuthGuard>
  )
}
