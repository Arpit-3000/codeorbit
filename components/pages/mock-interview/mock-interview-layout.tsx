"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { InterviewSetup } from "./interview-setup"
import { InterviewRoom } from "./interview-room"
import { InterviewReport } from "./interview-report"

type InterviewStage = "setup" | "interview" | "report"

export function MockInterviewLayout() {
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar activeTab="mock-interview" onTabChange={() => {}} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar />
        
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
