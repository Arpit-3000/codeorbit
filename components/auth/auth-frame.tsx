"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { Logo } from "@/components/brand/logo"
import { FloatingCode } from "@/components/auth/floating-code"
import { AuthBackdrop } from "@/components/auth/auth-backdrop"
import { cn } from "@/lib/utils"

/**
 * Shared frame for sign-in and sign-up: one focused column over a full-screen hairline grid.
 * The hierarchy is: wordmark, one serif headline, the form, one line to switch modes.
 */
export function AuthFrame({
  title,
  description,
  children,
  footer,
  grid = true,
}: {
  title: React.ReactNode
  description: string
  children: React.ReactNode
  footer: React.ReactNode
  /** the faint hairline grid behind the page (the sign-in page turns it off) */
  grid?: boolean
}) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-background">
      {/* drifting colour behind everything (free Paper Design shaders; fades out behind the form) */}
      <AuthBackdrop className="pointer-events-none absolute inset-0 -z-20" />

      {/* grid across the whole screen (optional) */}
      {grid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      )}

      <FloatingCode />

      <header className="flex h-16 items-center px-6 sm:px-10">
        <Link href="/auth/login" aria-label="CodeOrbit">
          <Logo size="lg" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[22rem] animate-fade-in-up">
          <div className="mb-8 space-y-2">
            <h1 className="t-display text-[2.75rem]">{title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
          <p className="mt-8 text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mb-4 border-l-2 border-destructive bg-destructive/8 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  )
}

export function AuthNotice({ message }: { message: string }) {
  if (!message) return null
  return (
    <p role="status" className="mb-4 border-l-2 border-success bg-success/10 px-3 py-2 text-sm">
      {message}
    </p>
  )
}

export function GoogleButton({ loading, onClick, label = "Continue with Google" }: { loading: boolean; onClick: () => void; label?: string }) {
  return (
    <Button type="button" variant="outline" className="h-10 w-full" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Icons.google className="size-4" />}
      {label}
    </Button>
  )
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-faint" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  className,
}: {
  id: string
  label: string
  type?: "text" | "email" | "password"
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  hint?: React.ReactNode
  className?: string
}) {
  const [shown, setShown] = React.useState(false)
  const isPassword = type === "password"
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && shown ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={cn("h-10 bg-background", isPassword && "pr-10")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            className="absolute right-0 top-0 flex size-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
