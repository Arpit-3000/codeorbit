"use client"

import { useEffect, useState } from "react"
import { Check, RefreshCw, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { StatusDot, platformMeta, timeAgo } from "@/components/ds/primitives"
import { syncCodeChef, syncCodeforces, syncGFG, syncGithub, syncLeetCode } from "@/lib/api"
import { cn } from "@/lib/utils"

type RunState = "idle" | "running" | "done" | "error"
type RowState = "pending" | "running" | "ok" | "failed"

interface Row {
  key: string
  label: string
  state: RowState
  error?: string
}

/**
 * Sync with a visible lifecycle: idle -> syncing (per-platform) -> done / partial failure.
 * Same per-platform calls as before, but the outcome of each is shown instead of swallowed,
 * and the page refreshes its data in place instead of a hard reload.
 */
export function SyncControl() {
  const { user, refreshUser } = useAuth()
  const [run, setRun] = useState<RunState>("idle")
  const [rows, setRows] = useState<Row[]>([])
  const [open, setOpen] = useState(false)

  const p = user?.platforms
  const jobs: { key: string; label: string; fn: () => Promise<unknown> }[] = []
  if (p?.leetcode?.verified) jobs.push({ key: "leetcode", label: "LeetCode", fn: syncLeetCode })
  if (p?.codeforces) jobs.push({ key: "codeforces", label: "Codeforces", fn: syncCodeforces })
  if (p?.github) jobs.push({ key: "github", label: "GitHub", fn: syncGithub })
  if (p?.codechef && (p.codechef.username || p.codechef.rating)) jobs.push({ key: "codechef", label: "CodeChef", fn: syncCodeChef })
  if (p?.gfg) jobs.push({ key: "gfg", label: "GeeksforGeeks", fn: syncGFG })

  const start = async () => {
    if (run === "running" || jobs.length === 0) return
    setOpen(true)
    setRun("running")
    const state: Row[] = jobs.map((j) => ({ key: j.key, label: j.label, state: "pending" }))
    setRows(state)

    const patch = (i: number, next: Partial<Row>) => {
      state[i] = { ...state[i], ...next }
      setRows([...state])
    }

    // Sequential, as before: the scrapers are heavy and the server rate-limits itself.
    for (let i = 0; i < jobs.length; i++) {
      patch(i, { state: "running" })
      try {
        await jobs[i].fn()
        patch(i, { state: "ok" })
      } catch (err: any) {
        console.error(`${jobs[i].label} sync failed:`, err)
        patch(i, { state: "failed", error: err?.response?.data?.message || "Could not reach the platform" })
      }
    }

    try {
      await refreshUser()
    } catch {}
    window.dispatchEvent(new CustomEvent("codeorbit:synced"))
    setRun(state.some((r) => r.state === "failed") ? "error" : "done")
  }

  // a finished run settles back to the plain button after a few seconds
  useEffect(() => {
    if (run !== "done") return
    const t = setTimeout(() => setRun("idle"), 3500)
    return () => clearTimeout(t)
  }, [run])

  const last = user?.lastSyncedAt
  const done = rows.filter((r) => r.state === "ok" || r.state === "failed").length
  const failed = rows.filter((r) => r.state === "failed").length

  const lastText = last && !isNaN(new Date(last).getTime()) ? `Last synced ${timeAgo(last)}` : null

  const label =
    run === "running"
      ? `${Math.min(done + 1, jobs.length)}/${jobs.length}`
      : run === "done"
        ? "Synced"
        : run === "error"
          ? `${failed} failed`
          : "Sync"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={start}
          disabled={run === "running" || jobs.length === 0}
          title={jobs.length === 0 ? "Connect a platform first" : lastText ?? "Pull in your latest numbers"}
          aria-label={run === "idle" ? `Sync platforms${lastText ? `. ${lastText}` : ""}` : label}
          aria-live="polite"
          className={cn(
            "gap-2 rounded-full pl-2.5 pr-3.5 transition-colors",
            run === "running" && "border-primary/50 bg-primary-soft text-primary",
            run === "done" && "border-success/50 text-success",
            run === "error" && "border-destructive/50 text-destructive"
          )}
        >
          {run === "done" ? <Check /> : <RefreshCw className={cn(run === "running" && "animate-spin")} />}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </PopoverAnchor>
      <PopoverContent align="end" className="w-64 space-y-2 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Syncing platforms</p>
          <button onClick={() => setOpen(false)} aria-label="Close" className="text-faint hover:text-foreground">
            <X className="size-3.5" />
          </button>
        </div>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 flex size-4 items-center justify-center">
                {r.state === "ok" ? (
                  <Check className="size-3.5 text-success" />
                ) : r.state === "failed" ? (
                  <X className="size-3.5 text-destructive" />
                ) : r.state === "running" ? (
                  <RefreshCw className="size-3 animate-spin text-primary" />
                ) : (
                  <StatusDot />
                )}
              </span>
              <span className="flex-1">
                <span className="font-medium">{platformMeta(r.key).label}</span>
                {r.error && <span className="block text-destructive">{r.error}</span>}
              </span>
            </li>
          ))}
        </ul>
        {run === "done" && <p className="text-xs text-muted-foreground">Everything is up to date.</p>}
        {run === "error" && (
          <Button size="sm" variant="outline" className="w-full" onClick={start}>
            Retry all
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
