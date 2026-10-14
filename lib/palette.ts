"use client"

import { useCallback, useEffect, useState } from "react"

export const PALETTES = [
  { id: "cobalt", name: "Cobalt", blurb: "Ink navy with an electric blue accent. Matches the logo." },
  { id: "terminal", name: "Terminal", blurb: "Graphite with phosphor green. Heatmaps read like GitHub." },
  { id: "lagoon", name: "Lagoon", blurb: "Deep teal with a bright cyan accent. Calm, clear, study-friendly." },
  { id: "nebula", name: "Nebula", blurb: "Deep space violet. A nod to the Orbit in CodeOrbit." },
  { id: "rose", name: "Rose", blurb: "Warm graphite with a coral-crimson accent. Bold and friendly." },
  { id: "volt", name: "Volt", blurb: "Neutral graphite with electric lime. Sharp and high-energy." },
  { id: "ember", name: "Ember", blurb: "Warm ink with amber. The original look." },
] as const

export type PaletteId = (typeof PALETTES)[number]["id"]
export const DEFAULT_PALETTE: PaletteId = "cobalt"
export const PALETTE_KEY = "codeorbit.palette"

/** Runs before first paint (inlined in <head>) so the chosen palette never flashes. */
export const PALETTE_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem('${PALETTE_KEY}')||'${DEFAULT_PALETTE}';document.documentElement.setAttribute('data-palette',p)}catch(e){document.documentElement.setAttribute('data-palette','${DEFAULT_PALETTE}')}})()`

export function usePalette() {
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE)

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-palette") as PaletteId | null
    if (current && PALETTES.some((p) => p.id === current)) setPaletteState(current)
  }, [])

  const setPalette = useCallback((id: PaletteId) => {
    document.documentElement.setAttribute("data-palette", id)
    try {
      localStorage.setItem(PALETTE_KEY, id)
    } catch {}
    setPaletteState(id)
  }, [])

  return { palette, setPalette }
}
