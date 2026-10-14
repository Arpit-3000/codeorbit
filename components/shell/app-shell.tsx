"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ChevronsLeft,
  ChevronsRight,
  Link2,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Sun,
  User as UserIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { StatsModeProvider } from "@/contexts/stats-mode-context"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ConnectPlatformsModal } from "@/components/connect-platforms-modal"
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal"
import { NotificationBell } from "@/components/social/notification-bell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ds/primitives"
import { Logo, LogoMark } from "@/components/brand/logo"
import { SyncControl } from "@/components/dashboard/sync-control"
import { CommandPalette, useShellShortcuts } from "./command-palette"
import { NAV_GROUPS, SETTINGS_ITEM, TAB_TO_ROUTE, activeNavId, type NavItem } from "./nav"

const COLLAPSE_KEY = "codeorbit.sidebar.collapsed"

function initials(name: string | null | undefined, email: string | undefined) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  return (email ?? "U").slice(0, 2).toUpperCase()
}

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center outline-offset-4" aria-label="CodeOrbit home">
      {collapsed ? <LogoMark /> : <Logo size="md" />}
    </Link>
  )
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed?: boolean; onNavigate?: () => void }) {
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      {/* signal rule: the one place the accent says "you are here" */}
      <span
        className={cn(
          "absolute -left-3 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
        aria-hidden
      />
      <item.icon className={cn("size-4 shrink-0", active && "text-primary")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

function NavList({ activeId, collapsed, onNavigate }: { activeId: string | null; collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed && <p className="t-eyebrow px-2.5 pb-1.5">{group.label}</p>}
          {collapsed && <div className="mx-2 mb-1 border-t border-border first:hidden" />}
          {group.items.map((item) => (
            <NavLink key={item.id} item={item} active={activeId === item.id} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Account block (bottom of sidebar)                                   */
/* ------------------------------------------------------------------ */

function AccountMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, logout } = useAuth()
  const { setTheme, theme } = useTheme()
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-accent/60",
            collapsed && "justify-center"
          )}
          aria-label="Account menu"
        >
          <Avatar className="size-7 rounded-md after:rounded-md">
            <AvatarImage src={user?.photoURL || ""} alt="" className="rounded-md" />
            <AvatarFallback className="rounded-md bg-primary-soft text-[11px] font-semibold text-primary">
              {initials(user?.displayName, user?.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium">{user?.displayName || user?.username || "Account"}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{user?.username ? `@${user.username}` : user?.email}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{user?.displayName || "User"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <UserIcon /> Portfolio
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(SETTINGS_ITEM.href)}>
          <SETTINGS_ITEM.icon /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="t-eyebrow py-1">Theme</DropdownMenuLabel>
        {[
          { v: "light", l: "Light", i: Sun },
          { v: "dark", l: "Dark", i: Moon },
          { v: "system", l: "System", i: Monitor },
        ].map(({ v, l, i: I }) => (
          <DropdownMenuItem key={v} onClick={() => setTheme(v)} className={cn(theme === v && "text-primary")}>
            <I /> {l}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={logout}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

interface AppShellProps {
  children: React.ReactNode
  /** Remove page padding and max-width (rooms, immersive tools). */
  bleed?: boolean
  /** Show the username-completion gate (dashboard only, as before). */
  profileGate?: boolean
  /** Hide the global top bar (immersive views draw their own chrome). */
  hideTopbar?: boolean
  /** Start with the sidebar collapsed to a rail regardless of preference. */
  forceCollapsed?: boolean
}

/**
 * The shell is a frame: sidebar and top bar share one tinted surface, and the page itself is a raised panel set into it.
 * (Darker than the page in dark mode, a step grayer in light mode.)
 */
const FRAME = "bg-[color-mix(in_oklab,var(--background)_94%,var(--foreground))] dark:bg-[color-mix(in_oklab,var(--background)_55%,black)]"

export function AppShell({ children, bleed, profileGate, hideTopbar, forceCollapsed }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const activeId = activeNavId(pathname)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1")
    } catch {}
  }, [])
  const isCollapsed = forceCollapsed || collapsed

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1")
      } catch {}
      return !c
    })
  }

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  useShellShortcuts(openPalette)

  // Legacy in-page navigation event (search results, contest banner, etc.)
  useEffect(() => {
    const onNavigate = (e: Event) => {
      const route = TAB_TO_ROUTE[(e as CustomEvent).detail as string]
      if (route) router.push(route)
    }
    window.addEventListener("navigate-to-tab", onNavigate)
    return () => window.removeEventListener("navigate-to-tab", onNavigate)
  }, [router])

  // Any page can ask the shell to open the platform connection dialog.
  useEffect(() => {
    const open = () => setConnectOpen(true)
    window.addEventListener("open-connect-platforms", open)
    return () => window.removeEventListener("open-connect-platforms", open)
  }, [])

  // close the mobile drawer on route change
  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <AuthGuard>
      <StatsModeProvider>
        {profileGate && <ProfileCompletionModal />}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
        >
          Skip to content
        </a>

        <div className={cn("flex h-dvh overflow-hidden", FRAME)}>
          {/* Desktop sidebar */}
          <aside
            className={cn(
              "sticky top-0 z-30 hidden h-dvh shrink-0 flex-col transition-[width] duration-200 ease-out lg:flex",
              isCollapsed ? "w-[60px]" : "w-[224px]"
            )}
          >
            <div className={cn("flex h-14 items-center", isCollapsed ? "justify-center" : "px-4")}>
              <Brand collapsed={isCollapsed} />
            </div>
            <NavList activeId={activeId} collapsed={isCollapsed} />
            <div className="space-y-1 p-2">
              <NavLink item={SETTINGS_ITEM} active={activeId === "settings"} collapsed={isCollapsed} />
              <AccountMenu collapsed={isCollapsed} />
              {!forceCollapsed && (
                <button
                  onClick={toggleCollapsed}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  className={cn(
                    "flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-[11px] text-faint transition-colors hover:text-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  {isCollapsed ? <ChevronsRight className="size-3.5" /> : <><ChevronsLeft className="size-3.5" /> Collapse</>}
                </button>
              )}
            </div>
          </aside>

          {/* Mobile drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className={cn("flex w-[264px] flex-col gap-0 p-0 sm:max-w-[264px]", FRAME)}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Primary navigation</SheetDescription>
              <div className="flex h-14 items-center border-b border-border px-4">
                <Brand />
              </div>
              <NavList activeId={activeId} onNavigate={() => setMobileOpen(false)} />
              <div className="space-y-1 border-t border-border p-2">
                <NavLink item={SETTINGS_ITEM} active={activeId === "settings"} onNavigate={() => setMobileOpen(false)} />
                <AccountMenu />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {!hideTopbar && (
              <header className={cn("z-20 flex h-14 shrink-0 items-center gap-2 px-3 sm:px-5", FRAME)}>
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                  <Menu />
                </Button>
                <Link href="/" className="lg:hidden" aria-label="CodeOrbit home">
                  <LogoMark className="text-[1.3rem]" />
                </Link>

                <button
                  onClick={openPalette}
                  className="group ml-1 flex h-9 w-full max-w-xl items-center gap-2.5 rounded-md border border-border px-2.5 text-left text-[13px] text-muted-foreground transition-colors hover:border-border-strong hover:bg-accent/50"
                  aria-label="Search or jump to (Command K)"
                >
                  <Search className="size-3.5" />
                  <span className="flex-1 truncate">Search pages and actions…</span>
                  <span className="hidden items-center gap-1 sm:flex">
                    <Kbd>⌘</Kbd>
                    <Kbd>K</Kbd>
                  </span>
                </button>

                <div className="ml-auto flex items-center gap-2">
                  <SyncControl />
                  <Button variant="outline" size="sm" onClick={() => setConnectOpen(true)} className="hidden sm:inline-flex">
                    <Link2 /> Platforms
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setConnectOpen(true)} className="sm:hidden" aria-label="Connect platforms">
                    <Link2 />
                  </Button>
                  <NotificationBell />
                </div>
              </header>
            )}

            {/* the page: a raised panel inside the frame. It scrolls itself, so its rounded corners stay put. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-background lg:mb-3 lg:mr-3 lg:rounded-2xl lg:border lg:border-border lg:shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-12px_rgb(0_0_0/0.25)]">
              <main id="main" className={cn("min-h-0 flex-1", bleed && "h-full", !bleed && "mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10")}>
                {children}
              </main>
            </div>
          </div>
        </div>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onConnectPlatforms={() => setConnectOpen(true)} />
        <ConnectPlatformsModal open={connectOpen} onOpenChange={setConnectOpen} />
      </StatsModeProvider>
    </AuthGuard>
  )
}
