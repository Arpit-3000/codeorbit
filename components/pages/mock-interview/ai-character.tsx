"use client"

import { cn } from "@/lib/utils"

interface AICharacterProps {
  isSpeaking: boolean
  isListening: boolean
  /** Waiting on the interviewer's reply. */
  isThinking?: boolean
  /** 0..1 live microphone level while listening (real signal, not decoration). */
  level?: number
  size?: "sm" | "lg"
  className?: string
}

const BARS = 17

/**
 * The interviewer's presence: a voice-activity trace, not a face.
 * Speaking: a travelling wave. Listening: bars follow your microphone. Thinking: a slow sweep. Idle: a flat line.
 */
export function AICharacter({ isSpeaking, isListening, isThinking, level = 0, size = "lg", className }: AICharacterProps) {
  const state = isSpeaking ? "speaking" : isListening ? "listening" : isThinking ? "thinking" : "idle"
  const h = size === "lg" ? 56 : 28

  return (
    <div
      role="img"
      aria-label={
        state === "speaking" ? "Interviewer is speaking" : state === "listening" ? "Listening to you" : state === "thinking" ? "Interviewer is thinking" : "Interviewer is ready"
      }
      className={cn("flex items-center", className)}
      style={{ height: h, gap: size === "lg" ? 4 : 3 }}
    >
      {Array.from({ length: BARS }).map((_, i) => {
        const centre = 1 - Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2) // 0 at the edges, 1 in the middle
        let scale = 0.08
        if (state === "listening") scale = Math.max(0.08, Math.min(1, level * (0.35 + centre * 0.9)))
        return (
          <span
            key={i}
            className={cn(
              "w-[3px] origin-center rounded-full",
              state === "idle" && "bg-border-strong",
              state === "speaking" && "bg-primary",
              state === "listening" && "bg-destructive",
              state === "thinking" && "bg-muted-foreground"
            )}
            style={{
              height: "100%",
              transform: `scaleY(${scale})`,
              transition: state === "listening" ? "transform 70ms linear" : undefined,
              animation:
                state === "speaking"
                  ? `voice-wave 900ms ease-in-out ${(i * 55) % 900}ms infinite alternate`
                  : state === "thinking"
                    ? `think-sweep 1.4s ease-in-out ${i * 60}ms infinite`
                    : undefined,
              ["--lo" as string]: String(0.12 + centre * 0.1),
              ["--hi" as string]: String(0.3 + centre * 0.7),
            }}
          />
        )
      })}
    </div>
  )
}
