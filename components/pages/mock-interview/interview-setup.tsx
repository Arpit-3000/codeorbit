"use client"

import { useRef, useState } from "react"
import { Check, FileText, Loader2, Mic, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { uploadResume, startInterview } from "@/lib/ai-interview-api"
import { cn } from "@/lib/utils"

export interface InterviewMeta {
  type: string
  difficulty: string
  hasResume: boolean
}

interface InterviewSetupProps {
  onStart: (sessionId: string, meta?: InterviewMeta) => void
}

const DOMAINS: { value: string; label: string }[] = [
  { value: "mixed", label: "a mix of everything" },
  { value: "dsa", label: "data structures & algorithms" },
  { value: "react", label: "React" },
  { value: "node", label: "Node.js" },
  { value: "cpp_java", label: "C++ and Java" },
  { value: "dbms", label: "databases" },
  { value: "os", label: "operating systems" },
  { value: "cn", label: "computer networks" },
  { value: "oops", label: "object-oriented design" },
  { value: "system_design", label: "system design" },
]

const LEVELS = [
  { value: "beginner", label: "beginner" },
  { value: "intermediate", label: "intermediate" },
  { value: "advanced", label: "advanced" },
]

/** A select styled as an underlined phrase inside a sentence. */
const phraseStyle = { fontSize: "inherit", lineHeight: "inherit", fontFamily: "inherit" } as const
const phrase =
  "inline-flex h-auto data-[size=default]:h-auto w-auto items-baseline gap-1 rounded-none border-0 border-b-2 border-primary/60 bg-transparent px-0.5 pb-0.5 pt-0 font-[inherit] text-[inherit] leading-[inherit] text-primary shadow-none transition-colors hover:border-primary focus-visible:ring-0 [&_svg]:size-4 [&_svg]:self-center"

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumePath, setResumePath] = useState<string>("")
  const [interviewType, setInterviewType] = useState<string>("mixed")
  const [difficulty, setDifficulty] = useState<string>("intermediate")
  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [hasResume, setHasResume] = useState(false)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const pickFile = (file?: File) => {
    if (!file) return
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file type", description: "Please upload a PDF file", variant: "destructive" })
      return
    }
    setResumeFile(file)
    setResumePath("")
    setHasResume(false)
  }

  const clearResume = () => {
    setResumeFile(null)
    setResumePath("")
    setHasResume(false)
    if (input.current) input.current.value = ""
  }

  const handleUploadResume = async () => {
    if (!resumeFile) return

    setUploading(true)
    try {
      const response = await uploadResume(resumeFile)

      if (response.success) {
        setResumePath(response.data.path)
        setHasResume(true)
        // A résumé-based interview always runs as "mixed"
        setInterviewType("mixed")
        toast({ title: "Résumé analysed", description: "Questions will be drawn from your skills and projects." })
      } else {
        throw new Error(response.error || "Upload failed")
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.error || error.message || "Failed to upload resume",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleStartInterview = async () => {
    setStarting(true)
    try {
      const response = await startInterview({
        interview_type: interviewType,
        difficulty: difficulty,
        resume_path: resumePath || undefined,
      })

      if (response.success) {
        onStart(response.data.session_id, { type: interviewType, difficulty, hasResume })
      } else {
        throw new Error((response.data as any) || "Failed to start")
      }
    } catch (error: any) {
      toast({
        title: "Couldn't start the interview",
        description: error.response?.data?.error || error.message || "Please try again",
        variant: "destructive",
      })
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-full max-w-6xl content-center gap-x-20 gap-y-14 px-6 py-16 lg:grid-cols-12 lg:px-10">
      <div className="space-y-12 lg:col-span-7">
        <div className="space-y-4">
          <p className="t-eyebrow flex items-center gap-2">
            <Mic className="size-3" /> Mock interview
          </p>
          <h1 className="t-display text-[2.5rem] leading-[1.18] sm:text-[3.25rem]">
            Interview me on{" "}
            {hasResume ? (
              <span className="text-primary">my résumé</span>
            ) : (
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger className={phrase} style={phraseStyle} aria-label="Interview domain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            , at an{" "}
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className={phrase} style={phraseStyle} aria-label="Difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>{" "}
            level.
          </h1>
        </div>

        {/* Résumé */}
        <div className="space-y-3">
          <p className="t-eyebrow">Résumé · optional</p>
          <input
            ref={input}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="sr-only"
            id="resume-upload"
          />
          {!resumeFile ? (
            <label
              htmlFor="resume-upload"
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              className={cn(
                "flex cursor-pointer items-center gap-4 border-y border-dashed px-1 py-5 transition-colors has-[:focus-visible]:outline-2",
                dragging ? "border-primary bg-primary-soft" : "border-border-strong hover:border-foreground/40"
              )}
            >
              <FileText className="size-5 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">Drop your PDF here</span>
                <span className="text-muted-foreground"> or click to browse. The interviewer will ask about your actual projects and stack.</span>
              </span>
            </label>
          ) : (
            <div className="flex items-center gap-4 border-y border-border px-1 py-4">
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{resumeFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hasResume ? (
                    <span className="inline-flex items-center gap-1 text-success">
                      <Check className="size-3" /> Analysed. Questions will follow your résumé.
                    </span>
                  ) : uploading ? (
                    "Reading your résumé…"
                  ) : (
                    "Not analysed yet"
                  )}
                </p>
              </div>
              {!hasResume && (
                <Button size="sm" variant="outline" onClick={handleUploadResume} disabled={uploading}>
                  {uploading && <Loader2 className="animate-spin" />}
                  {uploading ? "Analysing" : "Analyse"}
                </Button>
              )}
              <Button size="icon-sm" variant="ghost" onClick={clearResume} disabled={uploading} aria-label="Remove résumé">
                <X />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg" className="h-12 px-7 text-[15px]" onClick={handleStartInterview} disabled={starting || uploading || (!!resumeFile && !hasResume)}>
            {starting ? <Loader2 className="animate-spin" /> : <Mic />}
            {starting ? "Starting your interview…" : "Begin interview"}
          </Button>
          {resumeFile && !hasResume && !uploading && <p className="text-xs text-muted-foreground">Analyse your résumé first, or remove it to continue without.</p>}
        </div>
      </div>

      {/* What to expect: a sequence, not a feature grid */}
      <aside className="lg:col-span-5 lg:pt-24" aria-label="What to expect">
        <ol className="relative space-y-9 border-l border-border-strong pl-8">
          {[
            ["The conversation", "Aria asks one question at a time, out loud. Answer by speaking or typing. Her next question depends on how you did."],
            ["Adaptive difficulty", "Answers are scored as you go. Do well and the questions get harder; struggle and they ease off."],
            ["The assessment", "End whenever you like and get a written assessment: scores, strengths, gaps, and what to practise next."],
          ].map(([title, body], i) => (
            <li key={title} className="relative">
              <span className="t-num absolute -left-[2.85rem] top-0 flex size-6 items-center justify-center rounded-full border border-border-strong bg-background text-xs text-muted-foreground">
                {i + 1}
              </span>
              <h2 className="text-sm font-medium">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 border-t border-border pt-4 text-xs leading-relaxed text-faint">
          Voice answers use your microphone. The room listens once Aria finishes each question, and your recording is sent to the AI service to be transcribed. Nothing is captured before the interview starts.
        </p>
      </aside>
    </div>
  )
}
