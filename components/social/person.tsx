"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatusDot } from "@/components/ds/primitives"
import { cn } from "@/lib/utils"

interface PersonLike {
  displayName?: string
  username?: string
  email?: string
  photoURL?: string
  profileImage?: string
}

export function personName(p: PersonLike) {
  return p.displayName || p.username || "User"
}

export function PersonAvatar({
  person,
  size = "md",
  online,
  className,
}: {
  person: PersonLike
  size?: "sm" | "md" | "lg"
  /** undefined = don't show presence */
  online?: boolean
  className?: string
}) {
  const dim = size === "sm" ? "size-7" : size === "lg" ? "size-12" : "size-9"
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={cn(dim, "rounded-md after:rounded-md")}>
        <AvatarImage className="rounded-md" src={person.photoURL || person.profileImage} alt="" />
        <AvatarFallback className="rounded-md bg-secondary text-xs font-medium">
          {(person.displayName || person.username || person.email || "U")[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {online !== undefined && (
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-[2px]" title={online ? "Online" : "Offline"}>
          <StatusDot tone={online ? "success" : "neutral"} />
        </span>
      )}
    </span>
  )
}

/** A single person in a list: identity on the left, actions on the right. No card chrome. */
export function PersonRow({
  person,
  online,
  meta,
  children,
  className,
}: {
  person: PersonLike
  online?: boolean
  meta?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <li className={cn("flex items-center gap-3 border-b border-border py-3 last:border-b-0", className)}>
      <PersonAvatar person={person} online={online} size="lg" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{personName(person)}</p>
        {person.username && <p className="t-num truncate text-xs text-muted-foreground">@{person.username}</p>}
        {meta && <div className="mt-1 text-xs text-muted-foreground">{meta}</div>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </li>
  )
}
