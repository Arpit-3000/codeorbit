"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { StatsModeProvider } from "@/contexts/stats-mode-context"
import { useRouter } from "next/navigation"

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

export default function Settings() {
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
          <AppSidebar activeTab="settings" onTabChange={handleSidebarNav} />

          <div className="flex flex-1 flex-col overflow-hidden">
            <TopNavbar onConnectPlatforms={() => {}} />

            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl p-6 lg:p-8">
                <PlaceholderPage title="Settings" description="Manage your account preferences" />
              </div>
            </main>
          </div>
        </div>
      </StatsModeProvider>
    </AuthGuard>
  )
}
