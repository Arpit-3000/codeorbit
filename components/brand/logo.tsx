import { cn } from "@/lib/utils"

/**
 * CodeOrbit logo: two interlocking rings (ink + signal amber) and a live-text wordmark in the app typeface.
 * Everything uses theme tokens, so it adapts to light and dark without separate files.
 */
function Rings({ className }: { className?: string }) {
  return (
    <svg viewBox="20 48 160 104" aria-hidden className={cn("h-[1.15em] w-auto shrink-0", className)} fill="none" strokeWidth={16}>
      <g transform="translate(100,100)">
        <rect x="-35" y="-35" width="70" height="70" rx="18" transform="translate(-28,0) rotate(45)" stroke="var(--foreground)" />
        <rect x="-35" y="-35" width="70" height="70" rx="18" transform="translate(28,0) rotate(45)" stroke="var(--primary)" />
      </g>
    </svg>
  )
}

const SIZES = { sm: "text-[1.05rem]", md: "text-[1.3rem]", lg: "text-[1.6rem]" }

export function LogoMark({ className }: { className?: string }) {
  return <Rings className={cn("text-[1.5rem]", className)} />
}

export function Logo({ className, size = "md", label = "CodeOrbit" }: { className?: string; size?: keyof typeof SIZES; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.5em] leading-none", SIZES[size], className)} role="img" aria-label={label}>
      <Rings />
      <span aria-hidden className="font-semibold tracking-[-0.025em] text-foreground">
        Code<span className="font-normal text-muted-foreground">Orbit</span>
      </span>
    </span>
  )
}
