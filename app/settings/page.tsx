"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Link2, Monitor, Moon, Sun } from "lucide-react"
import { AppShell } from "@/components/shell/app-shell"
import { ALL_NAV_ITEMS } from "@/components/shell/nav"
import { Kbd, PageHeader, PlatformMark, Section, Segmented } from "@/components/ds/primitives"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { connectionState } from "@/lib/platform-data"
import { PALETTES, usePalette } from "@/lib/palette"
import { cn } from "@/lib/utils"

const PLATFORM_KEYS = ["leetcode", "codeforces", "codechef", "gfg", "github"] as const

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingsContent() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const connected = connectionState(user)
  const { palette, setPalette } = usePalette()

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <PageHeader variant="compact" eyebrow="Settings" title="Preferences" description="How CodeOrbit looks, what it's connected to, and how to move around it faster." />

      <Section title="Appearance">
        <Row label="Theme" hint="“System” follows your operating system and switches automatically.">
          {mounted && (
            <Segmented
              label="Theme"
              value={(theme as "light" | "dark" | "system") ?? "system"}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light", icon: <Sun className="size-3" /> },
                { value: "dark", label: "Dark", icon: <Moon className="size-3" /> },
                { value: "system", label: "System", icon: <Monitor className="size-3" /> },
              ]}
            />
          )}
        </Row>
      </Section>

      <Section title="Colour theme" eyebrow="try them live">
        <div role="radiogroup" aria-label="Colour theme" className="grid gap-4 sm:grid-cols-3">
          {PALETTES.map((p) => {
            const active = palette === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPalette(p.id)}
                className={cn(
                  "group overflow-hidden rounded-lg border text-left transition-all",
                  active ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-border-strong"
                )}
              >
                {/* each preview carries its own palette, so you see the real colours in your current light/dark mode */}
                <span data-palette={p.id} className="block bg-background p-4 text-foreground">
                  <span className="block rounded-md border border-border bg-surface p-3">
                    <span className="flex items-center justify-between">
                      <span className="h-2 w-12 rounded-full bg-foreground/80" />
                      <span className="h-5 w-10 rounded-sm bg-primary" />
                    </span>
                    <span className="mt-3 flex gap-[3px]">
                      {["heat-0", "heat-1", "heat-2", "heat-3", "heat-4", "heat-2", "heat-3", "heat-1", "heat-4", "heat-2", "heat-0", "heat-3"].map((h, i) => (
                        <span key={i} className="aspect-square flex-1 rounded-[2px]" style={{ background: `var(--${h})` }} />
                      ))}
                    </span>
                    <span className="mt-3 block h-1.5 w-2/3 rounded-sm bg-primary" />
                  </span>
                </span>
                <span className="block border-t border-border bg-surface p-4">
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name}</span>
                    {active && <span className="text-xs text-primary">In use</span>}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{p.blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Connected platforms">
        <ul className="divide-y divide-border">
          {PLATFORM_KEYS.map((k) => (
            <li key={k} className="flex items-center justify-between py-3">
              <PlatformMark platform={k} withLabel />
              <span className={connected[k] ? "text-xs text-success" : "text-xs text-faint"}>{connected[k] ? "Connected" : "Not connected"}</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.dispatchEvent(new CustomEvent("open-connect-platforms"))}>
          <Link2 /> Manage platforms
        </Button>
      </Section>

      <Section title="Account">
        <div className="divide-y divide-border">
          <Row label="Email">
            <span className="t-num text-sm text-muted-foreground">{user?.email}</span>
          </Row>
          <Row label="Username" hint="Edit it from your Portfolio.">
            <span className="t-num text-sm text-muted-foreground">{user?.username ? `@${user.username}` : "Not set"}</span>
          </Row>
          <Row label="Sign-in method">
            <span className="text-sm capitalize text-muted-foreground">{user?.provider === "google" ? "Google" : "Email and password"}</span>
          </Row>
        </div>
      </Section>

      <Section title="Keyboard">
        <ul className="divide-y divide-border">
          <li className="flex items-center justify-between py-2.5 text-sm">
            <span>Command palette</span>
            <span className="flex gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          </li>
          {ALL_NAV_ITEMS.map((i) => (
            <li key={i.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-muted-foreground">Go to <span className="text-foreground">{i.label}</span></span>
              <span className="flex gap-1"><Kbd>g</Kbd><Kbd>{i.key}</Kbd></span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

export default function Settings() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  )
}
