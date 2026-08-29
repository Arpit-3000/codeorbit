"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { AIInsightsPage } from "@/components/pages/ai-insights-page"
import { StatsModeProvider } from "@/contexts/stats-mode-context"
import { useRouter } from "next/navigation"

export default function AIInsights() {
  const router = useRouter()

  const handleSidebarNav = (tab: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/',
      'profile': '/profile',
      'activity': '/activity',
      'contests': '/contests',
      'resources': '/resources',
      'social': '/social',
      'mock-interview': '/mock-interview',
      'ai-insights': '/ai-insights',
      'settings': '/settings',
    }
    
    if (routes[tab]) {
      router.push(routes[tab])
    }
  }

  return (
    <AuthGuard>
      <StatsModeProvider>
        <div className="flex min-h-screen bg-background">
          <AppSidebar activeTab="ai-insights" onTabChange={handleSidebarNav} />

          <div className="flex flex-1 flex-col overflow-hidden">
            <TopNavbar onConnectPlatforms={() => {}} />

            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl p-6 lg:p-8">
                <AIInsightsPage />
              </div>
            </main>
          </div>
        </div>
      </StatsModeProvider>
    </AuthGuard>
  )
}
