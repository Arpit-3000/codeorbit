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
import { GithubStatus } from "@/components/github-status"
import { ContestsPage } from "@/components/pages/contests-page"
import { ResourcesPage } from "@/components/pages/resources-page"
import { AIInsightsPage } from "@/components/pages/ai-insights-page"
import { ProfilePage } from "@/components/pages/profile-page"
import { ActivityPage } from "@/components/pages/activity-page"
import { DiscussionPage } from "@/components/pages/discussion-page"
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal"
import { StatsModeProvider, useStatsMode } from "@/contexts/stats-mode-context"
import { Button } from "@/components/ui/button"
import { Code2, Trophy } from "lucide-react"

function DashboardContent() {
  const { mode, setMode } = useStatsMode()

  return (
    <div className="space-y-6">
      {/* Welcome Header with Toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your unified coding performance overview across all platforms
          </p>
        </div>
        
        {/* Stats Mode Toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
          <Button
            size="sm"
            variant={mode === "dsa" ? "default" : "ghost"}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setMode("dsa")}
          >
            <Trophy className="size-3.5" />
            DSA Stats
          </Button>
          <Button
            size="sm"
            variant={mode === "dev" ? "default" : "ghost"}
            className="h-8 gap-1.5 text-xs"
            onClick={() => setMode("dev")}
          >
            <Code2 className="size-3.5" />
            Dev Stats
          </Button>
        </div>
      </div>

      {/* Profile Summary */}
      <ProfileSummaryCard />

      {/* Stats Widgets - Only show for DSA mode */}
      {mode === "dsa" && <StatsWidgets />}

      {/* GitHub Status - Only show for Dev mode */}
      {mode === "dev" && (
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">Development Stats</h2>
          <GithubStatus />
        </div>
      )}

      {/* Platform Stats Grid - Only show for DSA mode */}
      {mode === "dsa" && (
        <div>
          <h2 className="mb-4 text-base font-semibold text-foreground">Platform Stats</h2>
          <PlatformStatsGrid showOnlyGithub={false} />
        </div>
      )}

      {/* Charts Row - Only show for DSA mode */}
      {mode === "dsa" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <TotalProblemsSolved />
          <DifficultyDistribution />
        </div>
      )}

      {/* Contest Ratings - Only show for DSA mode */}
      {mode === "dsa" && <ContestRatingsChart />}

      {/* Activity Heatmap */}
      <ActivityHeatmap />

      {/* Bottom Row - Only show for DSA mode */}
      {mode === "dsa" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <WeeklyActivityChart />
          <ConsistencyScore />
          <PlatformComparison />
        </div>
      )}

      {/* Badges - Only show for DSA mode */}
      {mode === "dsa" && <BadgesShowcase />}
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
      case "discuss":
        return <DiscussionPage />
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
      <StatsModeProvider>
        <ProfileCompletionModal />
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
      </StatsModeProvider>
    </AuthGuard>
  )
}
