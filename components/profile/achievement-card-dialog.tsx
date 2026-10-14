"use client"

import { useEffect, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Segmented } from "@/components/ds/primitives"
import { useToast } from "@/hooks/use-toast"
import { CARD_H, CARD_W, downloadCanvas, drawCard, loadFonts, pickMetrics, readFonts, type CardInput, type CardTheme } from "@/lib/achievement-card"

/** Preview and download share one canvas, so the PNG is exactly what's shown here. */
export function AchievementCardDialog({
  open,
  onOpenChange,
  input,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  input: CardInput
}) {
  const { toast } = useToast()
  const [theme, setTheme] = useState<CardTheme>("dark")
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !canvas) return
    let live = true
    setReady(false)
    ;(async () => {
      const fonts = readFonts()
      await loadFonts(fonts)
      if (!live) return
      await drawCard(canvas, input, theme, fonts)
      if (live) setReady(true)
    })().catch((e) => {
      console.error("Achievement card failed to render", e)
      if (live) toast({ title: "Couldn't draw the card", description: "Please try again.", variant: "destructive" })
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canvas, theme, input])

  const download = async () => {
    if (!canvas || !ready) return
    setSaving(true)
    try {
      const slug = (input.handle || input.name).replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "profile"
      await downloadCanvas(canvas, `codeorbit-${slug}-achievement-card.png`)
    } catch {
      toast({ title: "Couldn't create the image", description: "Please try again.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const empty = pickMetrics(input).length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Achievement card</DialogTitle>
        </DialogHeader>

        <div className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-md border border-border bg-secondary/40" style={{ aspectRatio: `${CARD_W} / ${CARD_H}` }}>
          <canvas ref={setCanvas} className="block h-full w-full" aria-label="Preview of your achievement card" role="img" />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Drawing your card…
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label="Card theme" size="sm" value={theme} onChange={setTheme} options={[{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }]} />
          <Button onClick={download} disabled={!ready || saving || empty}>
            {saving ? <Loader2 className="animate-spin" /> : <Download />} Download PNG
          </Button>
        </div>
        {empty && <p className="text-sm text-muted-foreground">Connect and sync a platform first, so there's something to show.</p>}
      </DialogContent>
    </Dialog>
  )
}
