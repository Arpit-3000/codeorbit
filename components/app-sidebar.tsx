"use client"

import { useState } from "react"
import Image from "next/image"
import {
  LayoutDashboard,
  User,
  Activity,
  Trophy,
  BookOpen,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: User, label: "Profile", id: "profile" },
  { icon: Activity, label: "Activity", id: "activity" },
  { icon: Trophy, label: "Contests", id: "contests" },
  { icon: BookOpen, label: "Resources", id: "resources" },
  { icon: Sparkles, label: "AI Insights", id: "ai-insights" },
  { icon: Settings, label: "Settings", id: "settings" },
]

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out z-30",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg overflow-hidden">
          <Image
            src="/iconLogo.png"
            alt="CodeOrbit Logo"
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight animate-slide-in-left">
            <span className="text-primary">Code</span>
            <span className="text-foreground">Orbit</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          const button = (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                )}
              />
              {!collapsed && (
                <span className="animate-slide-in-left">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </button>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          }

          return button
        })}
      </nav>

      {/* Collapse Button */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
