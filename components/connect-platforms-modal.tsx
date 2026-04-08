"use client"

import { useState, useEffect } from "react"
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
import { CheckCircle2, Link2, Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { connectLeetCode, verifyLeetCode, connectCodeforces, connectGithub, connectCodeChef, connectGFG } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface Platform {
  id: string
  name: string
  description: string
  color: string
  connected: boolean
  username: string
  url: string
  needsVerification?: boolean
}

interface ConnectPlatformsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectPlatformsModal({ open, onOpenChange }: ConnectPlatformsModalProps) {
  const { user, refreshUser } = useAuth()
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [usernameInput, setUsernameInput] = useState("")
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize platforms from user data
    const initialPlatforms: Platform[] = [
      {
        id: "leetcode",
        name: "LeetCode",
        description: "Track problem solving and contest ratings",
        color: "text-warning",
        connected: !!user?.platforms?.leetcode?.username,
        username: user?.platforms?.leetcode?.username || "",
        url: "https://leetcode.com",
        needsVerification: user?.platforms?.leetcode?.username && !user?.platforms?.leetcode?.verified,
      },
      {
        id: "codeforces",
        name: "Codeforces",
        description: "Competitive programming ratings and submissions",
        color: "text-chart-1",
        connected: !!user?.platforms?.codeforces?.handle,
        username: user?.platforms?.codeforces?.handle || "",
        url: "https://codeforces.com",
      },
      {
        id: "github",
        name: "GitHub",
        description: "Contributions, repos, and open source activity",
        color: "text-foreground",
        connected: !!user?.platforms?.github?.username,
        username: user?.platforms?.github?.username || "",
        url: "https://github.com",
      },
      {
        id: "codechef",
        name: "CodeChef",
        description: "Competitive programming ratings and contests",
        color: "text-chart-2",
        connected: !!(user?.platforms?.codechef && (user.platforms.codechef.username || user.platforms.codechef.rating)),
        username: user?.platforms?.codechef?.username || "",
        url: "https://www.codechef.com/users",
      },
      {
        id: "gfg",
        name: "GeeksforGeeks",
        description: "Coding score and problem solving",
        color: "text-chart-3",
        connected: !!user?.platforms?.gfg?.username,
        username: user?.platforms?.gfg?.username || "",
        url: "https://auth.geeksforgeeks.org/user",
      },
    ]
    setPlatforms(initialPlatforms)
  }, [user])

  const handleConnect = async (id: string) => {
    if (!usernameInput.trim()) return
    
    setConnectingId(id)
    setError(null)

    try {
      if (id === "leetcode") {
        const response = await connectLeetCode(usernameInput)
        setVerificationCode(response.verificationCode)
        setPlatforms((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, connected: true, username: usernameInput, needsVerification: true } : p
          )
        )
      } else if (id === "codeforces") {
        await connectCodeforces(usernameInput)
        setPlatforms((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, connected: true, username: usernameInput } : p
          )
        )
        await refreshUser()
      } else if (id === "github") {
        await connectGithub(usernameInput)
        setPlatforms((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, connected: true, username: usernameInput } : p
          )
        )
        await refreshUser()
      } else if (id === "codechef") {
        await connectCodeChef(usernameInput)
        setPlatforms((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, connected: true, username: usernameInput } : p
          )
        )
        await refreshUser()
      } else if (id === "gfg") {
        await connectGFG(usernameInput)
        setPlatforms((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, connected: true, username: usernameInput } : p
          )
        )
        await refreshUser()
      }
      
      setEditingId(null)
      setUsernameInput("")
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to connect platform")
    } finally {
      setConnectingId(null)
    }
  }

  const handleVerifyLeetCode = async () => {
    setConnectingId("leetcode")
    setError(null)

    try {
      await verifyLeetCode()
      setPlatforms((prev) =>
        prev.map((p) =>
          p.id === "leetcode" ? { ...p, needsVerification: false } : p
        )
      )
      setVerificationCode(null)
      await refreshUser()
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed")
    } finally {
      setConnectingId(null)
    }
  }

  const handleDisconnect = (id: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, connected: false, username: "", needsVerification: false } : p
      )
    )
    if (id === "leetcode") {
      setVerificationCode(null)
    }
  }

  const connectedCount = platforms.filter((p) => p.connected && !p.needsVerification).length

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

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}

        {verificationCode && (
          <div className="rounded-lg bg-primary/10 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">LeetCode Verification Required</p>
            <p className="text-xs text-muted-foreground">
              Add this code to your LeetCode profile's "About Me" section:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-secondary px-3 py-2 font-mono text-sm text-foreground">
                {verificationCode}
              </code>
              <Button
                size="sm"
                onClick={() => navigator.clipboard.writeText(verificationCode)}
                variant="outline"
              >
                Copy
              </Button>
            </div>
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={handleVerifyLeetCode}
              disabled={connectingId === "leetcode"}
            >
              {connectingId === "leetcode" ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Now"
              )}
            </Button>
          </div>
        )}

        <div className="mt-2 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-4 transition-all duration-200",
                platform.connected && !platform.needsVerification
                  ? "border-primary/20 bg-primary/5"
                  : platform.needsVerification
                  ? "border-warning/20 bg-warning/5"
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
                    {platform.connected && !platform.needsVerification && (
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0 border-0">
                        <CheckCircle2 className="size-2.5" />
                        Connected
                      </Badge>
                    )}
                    {platform.needsVerification && (
                      <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning text-[10px] px-1.5 py-0 border-0">
                        <AlertCircle className="size-2.5" />
                        Verify
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
                      <a href={`${platform.url}/${platform.username}`} target="_blank" rel="noopener noreferrer">
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
                      setError(null)
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
