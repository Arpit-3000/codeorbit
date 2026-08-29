"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { InterviewSetup } from "./interview-setup"
import { InterviewRoom } from "./interview-room"
import { InterviewReport } from "./interview-report"

type InterviewStage = "setup" | "interview" | "report"

export function MockInterviewLayout() {
  const router = useRouter()
  const [stage, setStage] = useState<InterviewStage>("setup")
  const [sessionId, setSessionId] = useState<string>("")
  const [reportData, setReportData] = useState<any>(null)

  const handleStartInterview = (id: string) => {
    setSessionId(id)
    setStage("interview")
  }

  const handleEndInterview = (report: any) => {
    setReportData(report)
    setStage("report")
  }

  const handleRestartInterview = () => {
    setSessionId("")
    setReportData(null)
    setStage("setup")
  }

  // Handle sidebar navigation
  const handleSidebarNav = (tab: string) => {
    console.log('[MOCK INTERVIEW] Sidebar nav to:', tab)
    
    // Map sidebar tabs to routes
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
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar activeTab="mock-interview" onTabChange={handleSidebarNav} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar onConnectPlatforms={() => {}} />
        
        <main className="flex-1 overflow-y-auto">
          {stage === "setup" && (
            <InterviewSetup onStart={handleStartInterview} />
          )}
          
          {stage === "interview" && (
            <InterviewRoom 
              sessionId={sessionId}
              onEnd={handleEndInterview}
            />
          )}
          
          {stage === "report" && (
            <InterviewReport 
              report={reportData}
              onRestart={handleRestartInterview}
            />
          )}
        </main>
      </div>
    </div>
  )
}
