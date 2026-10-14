"use client"

import { AppShell } from "@/components/shell/app-shell"
import { ProfilePage } from "@/components/pages/profile-page"

export default function Profile() {
  return (
    <AppShell>
      <ProfilePage />
    </AppShell>
  )
}
