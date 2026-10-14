"use client"

import { useState } from "react"
import { AppShell } from "@/components/shell/app-shell"
import { InterviewSetup, type InterviewMeta } from "./interview-setup"
import { InterviewRoom } from "./interview-room"
import { InterviewReport } from "./interview-report"

type InterviewStage = "setup" | "interview" | "report"

/**
 * setup -> interview -> report. The shell keeps only a slim navigation rail here
 * (no top bar) so the conversation has the whole viewport.
 */
export function MockInterviewLayout() {
  const [stage, setStage] = useState<InterviewStage>("setup")
  const [sessionId, setSessionId] = useState<string>("")
  const [meta, setMeta] = useState<InterviewMeta | undefined>()
  const [reportData, setReportData] = useState<any>(null)

  const handleStartInterview = (id: string, m?: InterviewMeta) => {
    setSessionId(id)
    setMeta(m)
    setStage("interview")
  }

  const handleEndInterview = (report: any) => {
    setReportData(report)
    setStage("report")
  }

  const handleRestartInterview = () => {
    setSessionId("")
    setMeta(undefined)
    setReportData(null)
    setStage("setup")
  }

  return (
    <AppShell bleed hideTopbar forceCollapsed>
      {stage === "setup" && <InterviewSetup onStart={handleStartInterview} />}
      {stage === "interview" && <InterviewRoom sessionId={sessionId} meta={meta} onEnd={handleEndInterview} />}
      {stage === "report" && <InterviewReport report={reportData} onRestart={handleRestartInterview} />}
    </AppShell>
  )
}
