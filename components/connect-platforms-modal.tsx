"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Link2, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Platform {
  id: string
  name: string
  description: string
  color: string
  connected: boolean
  username: string
  url: string
}

const initialPlatforms: Platform[] = [
  {
    id: "leetcode",
    name: "LeetCode",
    description: "Track problem solving and contest ratings",
    color: "text-warning",
    connected: true,
    username: "dev_coder42",
    url: "https://leetcode.com",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    description: "Competitive programming ratings and submissions",
    color: "text-chart-1",
    connected: true,
    username: "dev_coder42",
    url: "https://codeforces.com",
  },
  {
    id: "codechef",
    name: "CodeChef",
    description: "Contest performance and problem solving stats",
    color: "text-chart-5",
    connected: true,
    username: "dev_coder42",
    url: "https://codechef.com",
  },
  {
    id: "gfg",
    name: "GeeksforGeeks",
    description: "DSA practice and coding score tracking",
    color: "text-success",
    connected: false,
    username: "",
    url: "https://geeksforgeeks.org",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Contributions, repos, and open source activity",
    color: "text-foreground",
    connected: true,
    username: "dev-coder42",
    url: "https://github.com",
  },
  {
    id: "hackerrank",
    name: "HackerRank",
    description: "Badges, certifications, and challenge scores",
    color: "text-success",
    connected: false,
    username: "",
    url: "https://hackerrank.com",
  },
  {
    id: "hackerearth",
    name: "HackerEarth",
    description: "Competitive programming and hackathon stats",
    color: "text-chart-1",
    connected: false,
    username: "",
    url: "https://hackerearth.com",
  },
  {
    id: "atcoder",
    name: "AtCoder",
    description: "Japanese competitive programming platform",
    color: "text-chart-4",
    connected: false,
    username: "",
    url: "https://atcoder.jp",
  },
]

interface ConnectPlatformsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectPlatformsModal({ open, onOpenChange }: ConnectPlatformsModalProps) {
  const [platforms, setPlatforms] = useState(initialPlatforms)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [usernameInput, setUsernameInput] = useState("")

  const handleConnect = (id: string) => {
    if (!usernameInput.trim()) return
    setConnectingId(id)

    // Simulate connection
    setTimeout(() => {
      setPlatforms((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, connected: true, username: usernameInput } : p
        )
      )
      setConnectingId(null)
      setEditingId(null)
      setUsernameInput("")
    }, 1500)
  }

  const handleDisconnect = (id: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, connected: false, username: "" } : p
      )
    )
  }

  const connectedCount = platforms.filter((p) => p.connected).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Link2 className="size-5 text-primary" />
            Connect Your Coding Profiles
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Link your competitive programming and coding platform accounts to aggregate
            all your stats in one place.{" "}
            <span className="font-medium text-primary">{connectedCount}/{platforms.length}</span> connected.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-4 transition-all duration-200",
                platform.connected
                  ? "border-primary/20 bg-primary/5"
                  : "border-border bg-secondary/30 hover:border-border hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={cn("flex size-10 items-center justify-center rounded-lg bg-secondary font-bold text-xs", platform.color)}>
                  {platform.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{platform.name}</h4>
                    {platform.connected && (
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0 border-0">
                        <CheckCircle2 className="size-2.5" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{platform.description}</p>
                  {platform.connected && platform.username && (
                    <p className="text-xs text-primary/70 font-mono mt-0.5">@{platform.username}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                {platform.connected ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      asChild
                    >
                      <a href={platform.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDisconnect(platform.id)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : editingId === platform.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Username"
                      className="h-8 w-32 bg-secondary border-border text-sm text-foreground"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConnect(platform.id)
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => handleConnect(platform.id)}
                      disabled={connectingId === platform.id}
                    >
                      {connectingId === platform.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        "Link"
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => {
                      setEditingId(platform.id)
                      setUsernameInput("")
                    }}
                  >
                    <Link2 className="size-3" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
