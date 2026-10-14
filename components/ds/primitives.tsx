"use client"

/**
 * CodeOrbit design-system primitives.
 * Only patterns that genuinely recur across routes live here.
 */

import * as React from "react"
import { AlertTriangle, Inbox, RotateCw, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PLATFORM_ICONS } from "@/components/ds/platform-icons"

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  /** "display" = editorial serif headline, "compact" = utilitarian title */
  variant?: "display" | "compact"
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  variant = "display",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow && <p className="t-eyebrow">{eyebrow}</p>}
        <h1
          className={cn(
            variant === "display"
              ? "t-display text-[2.5rem] sm:text-5xl"
              : "t-title text-2xl"
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Section: a titled region, separated by a rule instead of a box       */
/* ------------------------------------------------------------------ */

interface SectionProps {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  /** "panel" (default): a raised surface with its own header. "bare": heading and rule only, for long lists with sticky parts. */
  variant?: "panel" | "bare"
}

export function Section({
  title,
  eyebrow,
  aside,
  children,
  className,
  bodyClassName,
  variant = "panel",
}: SectionProps) {
  const header = (
    <>
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="t-title text-base">{title}</h2>
        {eyebrow && <span className="t-eyebrow hidden truncate sm:inline">{eyebrow}</span>}
      </div>
      {aside && <div className="shrink-0 text-xs text-muted-foreground">{aside}</div>}
    </>
  )

  if (variant === "bare") {
    return (
      <section className={cn("space-y-4", className)}>
        <div className="flex items-end justify-between gap-4 border-b border-border pb-3">{header}</div>
        <div className={bodyClassName}>{children}</div>
      </section>
    )
  }

  return (
    <section className={cn("min-w-0 rounded-lg border border-border bg-surface", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">{header}</div>
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Stat: inline statistic, no container                                 */
/* ------------------------------------------------------------------ */

interface StatProps {
  label: React.ReactNode
  value: React.ReactNode
  unit?: React.ReactNode
  hint?: React.ReactNode
  tone?: "default" | "primary" | "success" | "warning" | "destructive"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const toneText: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
}

const sizeText: Record<NonNullable<StatProps["size"]>, string> = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
}

export function Stat({
  label,
  value,
  unit,
  hint,
  tone = "default",
  size = "md",
  className,
}: StatProps) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <p className="t-eyebrow">{label}</p>
      <p className={cn("t-num font-medium leading-none", sizeText[size], toneText[tone])}>
        {value}
        {unit && (
          <span className="ml-1 text-[0.45em] font-normal text-muted-foreground">{unit}</span>
        )}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Status dot                                                           */
/* ------------------------------------------------------------------ */

type Tone = "neutral" | "primary" | "success" | "warning" | "destructive" | "info"

const dotTone: Record<Tone, string> = {
  neutral: "bg-faint",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
}

export function StatusDot({
  tone = "neutral",
  live,
  className,
}: {
  tone?: Tone
  live?: boolean
  className?: string
}) {
  return (
    <span className={cn("relative inline-flex size-1.5 shrink-0", className)} aria-hidden>
      {live && (
        <span
          className={cn("absolute inset-0 rounded-full animate-ping-soft", dotTone[tone])}
        />
      )}
      <span className={cn("relative size-1.5 rounded-full", dotTone[tone])} />
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Platform mark: identity through a tiny glyph, not a logo wall        */
/* ------------------------------------------------------------------ */

const PLATFORMS: Record<string, { label: string; glyph: string; className: string }> = {
  leetcode: { label: "LeetCode", glyph: "LC", className: "text-leetcode" },
  codeforces: { label: "Codeforces", glyph: "CF", className: "text-codeforces" },
  codechef: { label: "CodeChef", glyph: "CC", className: "text-codechef" },
  gfg: { label: "GeeksforGeeks", glyph: "GG", className: "text-gfg" },
  github: { label: "GitHub", glyph: "GH", className: "text-github" },
  atcoder: { label: "AtCoder", glyph: "AC", className: "text-muted-foreground" },
}

export function platformKey(raw: string): string {
  const l = raw.toLowerCase()
  if (l.includes("leetcode")) return "leetcode"
  if (l.includes("codeforces")) return "codeforces"
  if (l.includes("codechef")) return "codechef"
  if (l.includes("geeks") || l.includes("gfg")) return "gfg"
  if (l.includes("github")) return "github"
  if (l.includes("atcoder")) return "atcoder"
  return l
}

export function platformMeta(raw: string) {
  return (
    PLATFORMS[platformKey(raw)] ?? {
      label: raw,
      glyph: raw.slice(0, 2).toUpperCase(),
      className: "text-muted-foreground",
    }
  )
}

export function PlatformMark({
  platform,
  withLabel,
  className,
  size = "md",
}: {
  platform: string
  withLabel?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const meta = platformMeta(platform)
  const icon = PLATFORM_ICONS[platformKey(platform)]
  const dim = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5"
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {icon ? (
        // Official mark, tinted with the platform's theme-aware token colour
        <svg
          viewBox={icon.viewBox}
          role={withLabel ? undefined : "img"}
          aria-hidden={withLabel || undefined}
          aria-label={withLabel ? undefined : meta.label}
          className={cn("shrink-0 fill-current", dim, meta.className)}
        >
          {!withLabel && <title>{meta.label}</title>}
          {icon.paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      ) : (
        <span
          className={cn(
            "inline-flex h-5 min-w-6 items-center justify-center rounded-sm border border-current/30 px-1 font-mono text-[10px] font-semibold leading-none tracking-tight",
            meta.className
          )}
          aria-hidden={withLabel}
          title={meta.label}
        >
          {meta.glyph}
        </span>
      )}
      {withLabel && <span className="text-sm font-medium">{meta.label}</span>}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Segmented control                                                    */
/* ------------------------------------------------------------------ */

interface SegmentedProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[]
  label: string
  className?: string
  size?: "sm" | "md"
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center rounded-md border border-border p-0.5", className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[3px] font-medium transition-colors",
              size === "md" ? "h-7 px-2.5 text-xs" : "h-6 px-2 text-[11px]",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Contextual states                                                    */
/* ------------------------------------------------------------------ */

interface StateBase {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  /** compact = inline in a small region, default = centred block */
  compact?: boolean
}

function StateShell({
  icon,
  title,
  description,
  action,
  className,
  compact,
  tone,
}: StateBase & { icon: React.ReactNode; tone?: "error" }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-start gap-3 border border-dashed border-border-strong/70 rounded-lg",
        compact ? "p-4" : "p-8 sm:items-center sm:text-center",
        className
      )}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-md border border-border",
          tone === "error" ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <div className="space-y-1">
        <p className="t-title text-sm">{title}</p>
        {description && (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function EmptyState(props: StateBase & { icon?: React.ReactNode }) {
  return <StateShell {...props} icon={props.icon ?? <Inbox className="size-4" />} />
}

export function ErrorState({
  onRetry,
  retryLabel = "Try again",
  ...props
}: StateBase & { onRetry?: () => void; retryLabel?: string }) {
  return (
    <StateShell
      {...props}
      tone="error"
      icon={<AlertTriangle className="size-4" />}
      action={
        props.action ??
        (onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw /> {retryLabel}
          </Button>
        ))
      }
    />
  )
}

/** Contextual loader: says what is being fetched and why it can take a moment. */
export function LoadingState({
  title,
  description,
  className,
  compact,
}: Omit<StateBase, "action">) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 text-sm text-muted-foreground",
        compact ? "py-3" : "py-10 justify-center",
        className
      )}
    >
      <Loader2 className="size-4 animate-spin text-primary" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="text-xs">{description}</p>}
      </div>
    </div>
  )
}

/** Stepped progress for multi-stage operations (sync, analysis ...). */
export function Steps({
  steps,
  current,
  className,
}: {
  steps: string[]
  /** index of the active step; steps before it are done; >= length means all done */
  current: number
  className?: string
}) {
  return (
    <ol className={cn("space-y-1.5", className)}>
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={s}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              done ? "text-foreground" : active ? "text-foreground" : "text-faint"
            )}
          >
            <span className="flex size-4 items-center justify-center">
              {done ? (
                <Check className="size-3.5 text-success" />
              ) : active ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <span className="size-1.5 rounded-full bg-border-strong" />
              )}
            </span>
            {s}
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------------------------------------------ */
/* Kbd                                                                  */
/* ------------------------------------------------------------------ */

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border-strong px-1 font-mono text-[10px] font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </kbd>
  )
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                   */
/* ------------------------------------------------------------------ */

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "now"
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  const sec = s % 60
  return `${m}m ${String(sec).padStart(2, "0")}s`
}

export function timeAgo(date: string | number | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
