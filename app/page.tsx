"use client"

import { AppShell } from "@/components/shell/app-shell"
import { OrbitHub } from "@/components/dashboard/orbit-hub"

export default function Home() {
  return (
    <AppShell profileGate>
      <OrbitHub />
    </AppShell>
  )
}
