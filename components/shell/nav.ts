import {
  LayoutDashboard,
  User,
  Activity,
  Trophy,
  BookOpen,
  Sparkles,
  Settings,
  MessageSquare,
  Mic,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** one-line description, used by the command palette */
  hint: string
  /** two-key "go to" shortcut: press g, then this key */
  key: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Track",
    items: [
      { id: "dashboard", label: "OrbitHub", href: "/", icon: LayoutDashboard, hint: "Where you stand across every platform", key: "h" },
      { id: "profile", label: "Portfolio", href: "/profile", icon: User, hint: "Your developer identity", key: "p" },
      { id: "activity", label: "Activity", href: "/activity", icon: Activity, hint: "Your coding history, day by day", key: "a" },
      { id: "contests", label: "Contest Tracker", href: "/contests", icon: Trophy, hint: "What starts next, and when", key: "c" },
    ],
  },
  {
    label: "Improve",
    items: [
      { id: "ai-insights", label: "Smart Insights", href: "/ai-insights", icon: Sparkles, hint: "What to work on next", key: "i" },
      { id: "mock-interview", label: "Mock Interview", href: "/mock-interview", icon: Mic, hint: "Practice with an AI interviewer", key: "m" },
      { id: "resources", label: "Knowledge Hub", href: "/resources", icon: BookOpen, hint: "Curated study material", key: "k" },
    ],
  },
  {
    label: "Together",
    items: [
      { id: "social", label: "Collab Space", href: "/social", icon: MessageSquare, hint: "Friends, pings and live rooms", key: "s" },
    ],
  },
]

export const SETTINGS_ITEM: NavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
  hint: "Account preferences",
  key: ",",
}

export const ALL_NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  SETTINGS_ITEM,
]

/** Map the legacy `navigate-to-tab` event ids to routes. */
export const TAB_TO_ROUTE: Record<string, string> = {
  dashboard: "/",
  profile: "/profile",
  analytics: "/",
  activity: "/activity",
  contests: "/contests",
  resources: "/resources",
  discuss: "/social",
  social: "/social",
  "mock-interview": "/mock-interview",
  "ai-insights": "/ai-insights",
  settings: "/settings",
}

export function activeNavId(pathname: string): string | null {
  if (pathname === "/") return "dashboard"
  const hit = ALL_NAV_ITEMS.find((i) => i.href !== "/" && pathname.startsWith(i.href))
  if (hit) return hit.id
  if (pathname.startsWith("/room")) return "social"
  return null
}
