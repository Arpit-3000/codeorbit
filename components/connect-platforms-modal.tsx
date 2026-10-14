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
import { PlatformMark } from "@/components/ds/primitives"
import { CheckCircle2, Link2, Loader2, ExternalLink, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { connectLeetCode, verifyLeetCode, connectCodeforces, connectCodeChef, connectGFG, connectGithub, disconnectPlatform } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { ConnectGithubModal } from "@/components/connect-github-modal"

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
  const [githubModalOpen, setGithubModalOpen] = useState(false)

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
      } else if (id === "github") {
        const name = usernameInput.trim().replace(/^@/, "")
        const res = await connectGithub(name)
        setPlatforms((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, connected: true, username: res.github?.username ?? name } : p
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

  const handleDisconnect = async (id: string) => {
    setError(null)
    try {
      await disconnectPlatform(id as "leetcode" | "codeforces" | "codechef" | "gfg")
      setPlatforms((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, connected: false, username: "", needsVerification: false } : p
        )
      )
      if (id === "leetcode") {
        setVerificationCode(null)
      }
      await refreshUser()
    } catch (err: any) {
      setError(err.response?.data?.message || "Couldn't disconnect. Try again.")
    }
  }

  const connectedCount = platforms.filter((p) => p.connected && !p.needsVerification).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[600px]">
        <DialogHeader className="space-y-1.5 border-b border-border px-6 py-5">
          <DialogTitle className="t-display text-3xl">Your platforms</DialogTitle>
          <DialogDescription>
            <span className="t-num text-foreground">{connectedCount}</span> of {platforms.length} connected. Everything you link is combined into one dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-6">
          {error && (
            <div role="alert" className="mt-4 flex items-start gap-2 border-l-2 border-destructive bg-destructive/8 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          {verificationCode && (
            <div className="mt-4 space-y-3 border-l-2 border-warning bg-warning/8 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Prove it's your LeetCode account</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Paste this code into the "About Me" section of your LeetCode profile, save, then verify. You can remove it afterwards.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-surface-sunken px-3 py-2 font-mono text-sm">{verificationCode}</code>
                <Button size="sm" onClick={() => navigator.clipboard.writeText(verificationCode)} variant="outline">
                  Copy
                </Button>
              </div>
              <Button size="sm" className="w-full" onClick={handleVerifyLeetCode} disabled={connectingId === "leetcode"}>
                {connectingId === "leetcode" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Checking your profile…
                  </>
                ) : (
                  "I've added it. Verify"
                )}
              </Button>
            </div>
          )}

          <ul className="divide-y divide-border">
            {platforms.map((platform) => {
              const linked = platform.connected && !platform.needsVerification
              return (
                <li key={platform.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-4">
                  <PlatformMark platform={platform.id} />
                  <div className="min-w-0 flex-1 basis-40">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{platform.name}</h4>
                      {linked && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-success">
                          <CheckCircle2 className="size-3" /> Linked
                        </span>
                      )}
                      {platform.needsVerification && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-warning">
                          <AlertCircle className="size-3" /> Needs verification
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {platform.connected && platform.username ? (
                        <span className="t-num">@{platform.username}</span>
                      ) : (
                        platform.description
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {platform.connected ? (
                      <>
                        <Button variant="ghost" size="icon-sm" asChild aria-label={`Open ${platform.name} profile`}>
                          <a href={`${platform.url}/${platform.username}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink />
                          </a>
                        </Button>
                        {/* GitHub is managed through its own OAuth dialog */}
                        {platform.id === "github" ? (
                          <Button variant="outline" size="sm" onClick={() => setGithubModalOpen(true)}>
                            Manage
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleDisconnect(platform.id)}>
                            Disconnect
                          </Button>
                        )}
                      </>
                    ) : editingId === platform.id ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder="Username"
                          aria-label={`${platform.name} username`}
                          autoFocus
                          className="h-8 w-36"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConnect(platform.id)
                            if (e.key === "Escape") setEditingId(null)
                          }}
                        />
                        <Button size="sm" onClick={() => handleConnect(platform.id)} disabled={connectingId === platform.id || !usernameInput.trim()}>
                          {connectingId === platform.id ? <Loader2 className="animate-spin" /> : "Link"}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(platform.id)
                          setUsernameInput("")
                          setError(null)
                        }}
                      >
                        <Link2 /> Connect
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="h-4" />

        {/* GitHub OAuth Modal */}
        <ConnectGithubModal
          open={githubModalOpen}
          onOpenChange={setGithubModalOpen}
          githubData={user?.platforms?.github || null}
          onUpdate={refreshUser}
        />
      </DialogContent>
    </Dialog>
  )
}
