"use client"

import { RefreshCw, ExternalLink, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const connectedPlatforms = [
  { name: "LeetCode", connected: true, color: "text-warning" },
  { name: "Codeforces", connected: true, color: "text-chart-1" },
  { name: "CodeChef", connected: true, color: "text-chart-5" },
  { name: "GFG", connected: false, color: "text-success" },
  { name: "GitHub", connected: true, color: "text-foreground" },
]

export function ProfileSummaryCard() {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start gap-5">
        <Avatar className="size-16 border-2 border-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-lg font-bold text-primary">
            DV
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">dev_coder42</h3>
            <p className="text-sm text-muted-foreground">Full-Stack Developer</p>
          </div>

          {/* Connected platforms */}
          <div className="flex flex-wrap gap-2">
            {connectedPlatforms.map((p) => (
              <Badge
                key={p.name}
                variant={p.connected ? "secondary" : "outline"}
                className={`gap-1.5 border-border text-xs ${p.connected ? 'bg-secondary/80 text-secondary-foreground' : 'text-muted-foreground'}`}
              >
                {p.connected && <CheckCircle2 className={`size-3 ${p.color}`} />}
                {p.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs text-muted-foreground">
              Last synced: 2 min ago
            </span>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs text-primary hover:bg-primary/10 hover:text-primary">
              <RefreshCw className="size-3" />
              Sync Now
            </Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <ExternalLink className="size-3" />
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
