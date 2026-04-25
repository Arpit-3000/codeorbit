"use client"

import React, { createContext, useContext, useState } from "react"

type StatsMode = "dsa" | "dev"

interface StatsModeContextType {
  mode: StatsMode
  setMode: (mode: StatsMode) => void
}

const StatsModeContext = createContext<StatsModeContextType | undefined>(undefined)

export function StatsModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<StatsMode>("dsa")

  return (
    <StatsModeContext.Provider value={{ mode, setMode }}>
      {children}
    </StatsModeContext.Provider>
  )
}

export function useStatsMode() {
  const context = useContext(StatsModeContext)
  if (!context) {
    throw new Error("useStatsMode must be used within StatsModeProvider")
  }
  return context
}
