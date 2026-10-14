"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Link2, Moon, Sun, Monitor, LogOut, CornerDownLeft } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd } from "@/components/ds/primitives"
import { useAuth } from "@/contexts/auth-context"
import { ALL_NAV_ITEMS } from "./nav"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectPlatforms: () => void
}

/** ⌘K command palette: navigation, platform connection, theme, session. */
export function CommandPalette({ open, onOpenChange, onConnectPlatforms }: Props) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { logout } = useAuth()

  const run = (fn: () => void) => {
    onOpenChange(false)
    // let the dialog close before navigating so focus restoration doesn't fight the route change
    setTimeout(fn, 0)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump to a page or run an action"
      showCloseButton={false}
      className="top-[18%] translate-y-0 sm:max-w-xl"
    >
      <CommandInput placeholder="Jump to a page or run an action..." />
      <CommandList className="max-h-[22rem]">
        <CommandEmpty>Nothing matches. Try a page name like “contests” or “interview”.</CommandEmpty>

        <CommandGroup heading="Go to">
          {ALL_NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              value={`${item.label} ${item.hint}`}
              onSelect={() => run(() => router.push(item.href))}
            >
              <item.icon />
              <span>{item.label}</span>
              <span className="ml-1 truncate text-xs text-muted-foreground">{item.hint}</span>
              <span className="ml-auto flex items-center gap-1">
                <Kbd>g</Kbd>
                <Kbd>{item.key}</Kbd>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem value="connect platforms leetcode codeforces codechef geeksforgeeks github" onSelect={() => run(onConnectPlatforms)}>
            <Link2 />
            Connect or manage platforms
          </CommandItem>
          <CommandItem value="theme light" onSelect={() => run(() => setTheme("light"))}>
            <Sun /> Light theme
          </CommandItem>
          <CommandItem value="theme dark" onSelect={() => run(() => setTheme("dark"))}>
            <Moon /> Dark theme
          </CommandItem>
          <CommandItem value="theme system" onSelect={() => run(() => setTheme("system"))}>
            <Monitor /> Match system theme
          </CommandItem>
          <CommandItem value="sign out logout" onSelect={() => run(logout)}>
            <LogOut /> Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-faint">
        <span className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigate
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>
            <CornerDownLeft className="size-3" />
          </Kbd>
          select
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>esc</Kbd> close
        </span>
      </div>
    </CommandDialog>
  )
}

/** Global shortcuts: ⌘/Ctrl+K opens the palette; `g` then a key navigates. */
export function useShellShortcuts(openPalette: () => void) {
  const router = useRouter()
  useEffect(() => {
    let awaitingGo = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null
      if (!el) return false
      return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
    }

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        openPalette()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return

      if (awaitingGo) {
        awaitingGo = false
        clearTimeout(timer)
        const item = ALL_NAV_ITEMS.find((i) => i.key === e.key.toLowerCase())
        if (item) {
          e.preventDefault()
          router.push(item.href)
        }
        return
      }
      if (e.key === "g") {
        awaitingGo = true
        timer = setTimeout(() => (awaitingGo = false), 1200)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      clearTimeout(timer)
    }
  }, [openPalette, router])
}
