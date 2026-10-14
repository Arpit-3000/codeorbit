"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, Loader2, Square, Volume2, VolumeX, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { AICharacter } from "./ai-character"
import type { InterviewMeta } from "./interview-setup"
import {
  getSessionStatus,
  submitAnswer,
  endInterview,
  speechToText,
  stopSpeech,
  advanceStage,
} from "@/lib/ai-interview-api"

interface Evaluation {
  score: number
  feedback: string
}

interface Message {
  type: "question" | "answer"
  /** Full text, as spoken aloud */
  content: string
  /** For interviewer turns: a short reaction to the previous answer, shown above the question */
  reaction?: string
  question?: string
  evaluation?: Evaluation
  timestamp: Date
}

interface InterviewRoomProps {
  sessionId: string
  meta?: InterviewMeta
  onEnd: (report: any) => void
}

const STAGES = [
  { id: "introduction", label: "Introduction" },
  { id: "resume_discussion", label: "Résumé" },
  { id: "technical_round", label: "Technical" },
  { id: "behavioral_round", label: "Behavioural" },
  { id: "closing", label: "Closing" },
]

/** How many answers complete each stage; the interview then moves on by itself. */
const STAGE_DONE_AT: Record<string, number> = {
  introduction: 1,
  resume_discussion: 3,
  technical_round: 8,
  behavioral_round: 10,
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

export function InterviewRoom({ sessionId, meta, onEnd }: InterviewRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [liveText, setLiveText] = useState("")
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [unsupported, setUnsupported] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [heard, setHeard] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [level, setLevel] = useState(0)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [stage, setStage] = useState("introduction")
  const [difficulty, setDifficulty] = useState(meta?.difficulty ?? "")
  const [answered, setAnswered] = useState(0)
  const [avgScore, setAvgScore] = useState<number | null>(null)
  const [loadingFirst, setLoadingFirst] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [ending, setEnding] = useState(false)

  const abortRef = useRef<(() => void) | null>(null)
  const finishRef = useRef<(() => void) | null>(null)
  const aliveRef = useRef(true)
  const listeningRef = useRef(false)
  const haltRef = useRef(false)
  const busyRef = useRef(false)
  const repeatsRef = useRef(0)
  const speechIdRef = useRef(0)
  const currentQuestionRef = useRef("")
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const voiceOnRef = useRef(true)
  const { toast } = useToast()

  useEffect(() => {
    voiceOnRef.current = voiceOn
    if (!voiceOn) {
      stopAllSpeech()
      listen() // nothing left to wait for, so go straight to listening
    }
  }, [voiceOn])

  useEffect(() => {
    aliveRef.current = true
    fetchInitialQuestion()
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => {
      aliveRef.current = false
      clearInterval(t)
      stopAllSpeech()
      haltListening()
      teardownRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isProcessing])

  const stopAllSpeech = () => {
    speechIdRef.current++ // anything still waiting on the old utterance knows it was cut off
    if (typeof window !== "undefined") window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }

  const fetchInitialQuestion = async () => {
    try {
      setLoadError(false)
      setLoadingFirst(true)
      const response = await getSessionStatus(sessionId)

      if (response.success) {
        const question = response.data.current_question
        setStage(response.data.stage || "introduction")
        setDifficulty(response.data.difficulty || difficulty)
        setAnswered(response.data.questions_answered || 0)
        if (response.data.questions_answered > 0) setAvgScore(response.data.overall_score)
        setMessages([{ type: "question", content: question, question, timestamp: new Date() }])
        currentQuestionRef.current = question
        askQuestion(question)
      } else {
        throw new Error("No session")
      }
    } catch (error) {
      console.error("Failed to fetch question:", error)
      setLoadError(true)
    } finally {
      setLoadingFirst(false)
    }
  }

  /** Resolves true when the question was read to the end, false if it was cut off. */
  const speakText = (text: string) =>
    new Promise<boolean>((resolve) => {
      stopAllSpeech()
      if (!voiceOnRef.current || typeof window === "undefined" || !window.speechSynthesis) return resolve(true)

      const id = speechIdRef.current
      setIsSpeaking(true)
      const done = () => {
        const finished = speechIdRef.current === id
        if (finished) setIsSpeaking(false)
        resolve(finished)
      }
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.onend = done
        utterance.onerror = done
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        console.error("Speech synthesis error:", error)
        done()
      }
    })

  /** Ask out loud, then start listening for the answer. */
  const askQuestion = async (text: string) => {
    const finished = await speakText(text)
    if (finished && aliveRef.current) listen()
  }

  const teardownRecording = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (recTimerRef.current) clearInterval(recTimerRef.current)
    recTimerRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    setLevel(0)
  }

  const haltListening = () => {
    haltRef.current = true
    abortRef.current?.()
  }

  /**
   * Hands-free answering: record the microphone and watch the volume. This works in every browser (including Brave,
   * which blocks the built-in speech recognition); the finished recording is transcribed by the AI service.
   * - Nothing said for 5 seconds: the question is read again (twice at most, then we wait for the button).
   * - Once you've spoken, a 2-second pause means you're done and the answer is sent.
   */
  const listen = async () => {
    if (!aliveRef.current || listeningRef.current || busyRef.current) return
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setUnsupported(true)
      return
    }
    listeningRef.current = true
    haltRef.current = false
    setPaused(false)
    setHeard(false)
    setLiveText("")

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch {
      listeningRef.current = false
      setPaused(true)
      toast({
        title: "Microphone access denied",
        description: "Allow microphone access in your browser's address bar, then press Answer.",
        variant: "destructive",
      })
      return
    }
    if (!aliveRef.current || haltRef.current) {
      stream.getTracks().forEach((t) => t.stop())
      listeningRef.current = false
      return
    }

    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const AC = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AC()
    audioCtxRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    ctx.createMediaStreamSource(stream).connect(analyser)
    const samples = new Uint8Array(analyser.fftSize)

    const startedAt = Date.now()
    let noise = 0
    let calibrated = 0
    let voiceTicks = 0
    let spoke = false
    let lastVoice = startedAt
    let forced = false
    let done = false

    const finish = (manual = false) => {
      if (done) return
      done = true
      forced = manual
      if (recorder.state !== "inactive") recorder.stop()
    }
    abortRef.current = () => finish()

    const vad = setInterval(() => {
      analyser.getByteTimeDomainData(samples)
      let sum = 0
      for (let i = 0; i < samples.length; i++) {
        const v = (samples[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / samples.length)
      setLevel(Math.min(1, rms * 4))

      const now = Date.now()
      if (now - startedAt < 500) {
        // learn the room's background noise first
        noise = (noise * calibrated + rms) / (calibrated + 1)
        calibrated++
        return
      }
      const loud = rms > Math.max(0.02, noise * 3)
      voiceTicks = loud ? voiceTicks + 1 : 0
      if (loud) lastVoice = now
      if (!spoke && voiceTicks >= 3) {
        spoke = true
        setHeard(true)
      }
      if (spoke && now - lastVoice > 2000) finish()
      else if (!spoke && now - startedAt > 5500) finish()
      else if (now - startedAt > 180000) finish()
    }, 100)
    finishRef.current = () => finish(true)

    recorder.onstop = async () => {
      clearInterval(vad)
      stream.getTracks().forEach((t) => t.stop())
      teardownRecording()
      setIsRecording(false)
      setHeard(false)
      listeningRef.current = false
      abortRef.current = null
      finishRef.current = null

      if (!aliveRef.current || haltRef.current) return
      if (!spoke && !forced) {
        if (repeatsRef.current < 2) {
          repeatsRef.current += 1
          askQuestion(`Let me repeat the question. ${currentQuestionRef.current}`)
        } else {
          setPaused(true)
        }
        return
      }

      repeatsRef.current = 0
      busyRef.current = true
      setIsTranscribing(true)
      try {
        const res = await speechToText(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }))
        const text = String(res?.transcription ?? "").trim()
        if (!text) {
          busyRef.current = false
          setIsTranscribing(false)
          toast({ title: "Didn't catch that", description: "Press Answer and try again a little closer to the microphone." })
          setPaused(true)
          return
        }
        setLiveText(text)
        setIsTranscribing(false)
        await submitAnswerToAPI(text)
      } catch {
        busyRef.current = false
        setIsTranscribing(false)
        setPaused(true)
        toast({
          title: "Couldn't transcribe that",
          description: "The speech service didn't respond. Press Answer to try again.",
          variant: "destructive",
        })
      }
    }

    recorder.start(250)
    setRecordSeconds(0)
    recTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    setIsRecording(true)
  }

  /** The "Answer" button: skip the rest of the question and start listening now. */
  const answerNow = () => {
    stopAllSpeech()
    repeatsRef.current = 0
    listen()
  }

  /** The "Done answering" button: stop listening and send what was said. */
  const stopRecording = () => finishRef.current?.()

  const submitAnswerToAPI = async (answer: string) => {
    busyRef.current = true
    setIsProcessing(true)
    setPendingAnswer(null)
    let spoken: string | null = null

    // Add the answer to the transcript right away
    setMessages((prev) => [...prev, { type: "answer", content: answer, timestamp: new Date() }])
    setLiveText("")

    try {
      const response = await submitAnswer({ session_id: sessionId, answer })

      if (response.success) {
        const { response_to_answer: reaction, next_question: nextQuestion, evaluation, stage: nextStage, difficulty: nextDifficulty, overall_score, questions_answered } = response.data

        // Move through the interview stages as answers accumulate. Each advance returns the first question of
        // the new stage, which replaces the question that was just generated in the old one.
        let question: string = nextQuestion
        let currentStage: string = nextStage
        for (let hops = 0; hops < 3; hops++) {
          const skipResume = currentStage === "resume_discussion" && !meta?.hasResume
          const done = STAGE_DONE_AT[currentStage] !== undefined && questions_answered >= STAGE_DONE_AT[currentStage]
          if (!done && !skipResume) break
          try {
            const adv: any = await advanceStage(sessionId)
            question = adv?.data?.question ?? question
            currentStage = adv?.data?.stage ?? currentStage
          } catch (err) {
            console.error("Failed to advance interview stage:", err)
            break
          }
        }

        const combinedMessage = reaction ? `${reaction}\n\n${question}` : question

        setMessages((prev) => {
          // attach the score to the answer it belongs to
          const next = [...prev]
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].type === "answer") {
              next[i] = { ...next[i], evaluation: { score: evaluation.overall_score, feedback: evaluation.feedback } }
              break
            }
          }
          return [...next, { type: "question", content: combinedMessage, reaction, question, timestamp: new Date() }]
        })
        if (currentStage) setStage(currentStage)
        if (nextDifficulty) setDifficulty(nextDifficulty)
        setAnswered(questions_answered)
        setAvgScore(overall_score)

        currentQuestionRef.current = question
        spoken = combinedMessage
      } else {
        throw new Error("Failed to submit answer")
      }
    } catch (error: any) {
      // Keep the answer so it can be resent
      setMessages((prev) => prev.slice(0, -1))
      setPendingAnswer(answer)
      setPaused(true)
      toast({
        title: "Answer not submitted",
        description: error.response?.data?.error || error.message || "Press Resend answer to try again.",
        variant: "destructive",
      })
    } finally {
      busyRef.current = false
      setIsProcessing(false)
    }
    if (spoken) askQuestion(spoken)
  }

  const handleEndInterview = async () => {
    setEnding(true)
    try {
      stopAllSpeech()
      haltListening()
      try {
        await stopSpeech(sessionId)
      } catch (error) {
        console.error("Failed to stop speech on backend:", error)
      }

      const response = await endInterview(sessionId)

      if (response.success) {
        onEnd(response.data.report)
      } else {
        throw new Error("Failed to end interview")
      }
    } catch (error: any) {
      toast({
        title: "Couldn't generate your assessment",
        description: error.response?.data?.error || error.message || "Please try again",
        variant: "destructive",
      })
      setEnding(false)
      setConfirmEnd(false)
    }
  }

  const openFinish = () => {
    stopAllSpeech()
    haltListening()
    setPaused(true)
    setConfirmEnd(true)
  }

  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.id === stage))
  const busy = isProcessing || isTranscribing
  const status = isRecording ? "Listening" : isTranscribing ? "Transcribing" : isProcessing ? "Thinking" : isSpeaking ? "Speaking" : paused ? "Paused" : "Your turn"
  const hint = unsupported
    ? "This browser can't access a microphone, so the voice interview can't run here."
    : isRecording
      ? heard
        ? "I can hear you. Your answer is sent after a short pause, or press Done answering."
        : "Listening. Just start speaking. If it stays quiet for 5 seconds, Aria will repeat the question."
      : pendingAnswer
        ? "Your answer didn't send. Press Resend answer."
        : paused
          ? "Paused. Press Answer when you're ready."
          : isSpeaking
            ? "Aria is asking. Listening starts when she's done."
            : ""

  if (loadingFirst) {
    return (
      <div role="status" className="flex min-h-full items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" /> Aria is preparing your first question…
      </div>
    )
  }

  if (loadError) {
    return (
      <div role="alert" className="mx-auto flex min-h-full max-w-md flex-col items-start justify-center gap-4 px-6">
        <p className="t-display text-3xl">We couldn't load your interview.</p>
        <p className="text-sm text-muted-foreground">The session may have expired, or the interview service is unreachable. Your résumé and settings aren't lost.</p>
        <Button onClick={fetchInitialQuestion}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Progress: stage, count, difficulty, and your running average */}
      <header className="shrink-0 border-b border-border">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4 sm:px-6">
          <nav aria-label="Interview stage" className="hidden min-w-0 flex-1 items-center gap-1 sm:flex">
            {STAGES.map((s, i) => (
              <span key={s.id} className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs",
                    i === stageIndex ? "font-medium text-foreground" : i < stageIndex ? "text-muted-foreground" : "text-faint"
                  )}
                  aria-current={i === stageIndex ? "step" : undefined}
                >
                  {s.label}
                </span>
                {i < STAGES.length - 1 && <span className="mx-1 h-px w-4 bg-border-strong" aria-hidden />}
              </span>
            ))}
          </nav>
          <p className="t-eyebrow sm:hidden">{STAGES[stageIndex].label}</p>

          <div className="t-num ml-auto flex items-center gap-5 text-xs text-muted-foreground">
            <span title="Questions answered">
              Q <span className="text-foreground">{answered}</span>
            </span>
            {avgScore !== null && (
              <span title="Average score so far">
                <span className="text-foreground">{avgScore.toFixed(1)}</span>/10
              </span>
            )}
            {difficulty && <span className="hidden capitalize sm:inline">{difficulty}</span>}
            <span className="flex items-center gap-1" title="Elapsed">
              <Timer className="size-3" /> {clock(elapsed)}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={openFinish} disabled={busy}>
            Finish
          </Button>
        </div>
      </header>

      {/* Conversation */}
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-10 px-4 py-10 sm:px-6">
          {messages.map((m, i) => {
            const isLatestQuestion = m.type === "question" && i === messages.length - 1
            if (m.type === "question") {
              return (
                <section key={i} aria-label="Interviewer" className={cn("space-y-3 animate-fade-in-up", !isLatestQuestion && "opacity-60")}>
                  {m.reaction && <p className="text-sm leading-relaxed text-muted-foreground">{m.reaction}</p>}
                  <p className={cn("font-display font-medium tracking-[-0.025em] whitespace-pre-wrap", isLatestQuestion ? "text-[1.75rem] leading-[1.3] sm:text-[2.25rem]" : "text-xl leading-snug")}>
                    {m.question ?? m.content}
                  </p>
                </section>
              )
            }
            return (
              <section key={i} aria-label="Your answer" className="animate-fade-in-up border-l-2 border-primary pl-5">
                <p className="t-eyebrow mb-1.5">You</p>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
                {m.evaluation && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="t-num mr-2 rounded-sm bg-secondary px-1.5 py-0.5 text-foreground">{m.evaluation.score.toFixed(1)}</span>
                    {m.evaluation.feedback}
                  </p>
                )}
              </section>
            )
          })}

          {busy && (
            <p role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Aria is evaluating your answer and preparing the next question…
            </p>
          )}
        </div>
      </div>

      {/* Composer */}
      <footer className="shrink-0 border-t border-border bg-background">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AICharacter isSpeaking={isSpeaking} isListening={isRecording} isThinking={busy && !isRecording} level={level} size="sm" />
              <p className="text-xs text-muted-foreground" aria-live="polite">
                <span className="font-medium text-foreground">Aria</span> · {status}
                {isRecording && <span className="t-num ml-2 text-destructive">{clock(recordSeconds)}</span>}
              </p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setVoiceOn((v) => !v)} aria-pressed={!voiceOn} aria-label={voiceOn ? "Mute interviewer voice" : "Unmute interviewer voice"} title={voiceOn ? "Mute Aria's voice" : "Unmute Aria's voice"}>
              {voiceOn ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>

          <div aria-live="polite" className="min-h-[72px] rounded-md border border-border px-4 py-3 text-[15px] leading-relaxed">
            {liveText || <span className="text-faint">{hint}</span>}
          </div>

          <div className="flex items-center justify-end gap-2">
            {isRecording ? (
              <Button variant="destructive" onClick={stopRecording}>
                <Square className="fill-current" /> Done answering
              </Button>
            ) : pendingAnswer ? (
              <Button onClick={() => submitAnswerToAPI(pendingAnswer)} disabled={busy}>
                Resend answer
              </Button>
            ) : (
              <Button variant="outline" onClick={answerNow} disabled={busy || unsupported}>
                <Mic /> Answer
              </Button>
            )}
          </div>
        </div>
      </footer>

      <AlertDialog open={confirmEnd} onOpenChange={(o) => !ending && setConfirmEnd(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish and get your assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              {answered === 0
                ? "You haven't answered any questions yet, so the assessment will have little to go on."
                : `You've answered ${answered} question${answered === 1 ? "" : "s"}. Ending now generates your written assessment. This can take a few seconds.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ending}>Keep going</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleEndInterview()
              }}
              disabled={ending}
            >
              {ending && <Loader2 className="animate-spin" />}
              {ending ? "Writing your assessment…" : "Finish interview"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
