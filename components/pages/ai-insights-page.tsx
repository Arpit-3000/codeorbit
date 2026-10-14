"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Clock, Sparkles } from "lucide-react"
import { getAIRecommendations, getLearningPathSuggestions, type LearningPathSuggestionsData } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Section,
  Stat,
  timeAgo,
} from "@/components/ds/primitives"
import { cn } from "@/lib/utils"

interface AIAnalysis {
  dominantTopics: string[]
  currentDifficultyLevel: string
  solvingPattern: string
  identifiedGaps: string[]
}

interface AIRecommendation {
  title: string
  platform: string
  difficulty: string
  topics: string[]
  reasoning: string
  priority: string
  estimatedTime: string
  learningObjective: string
  link?: string // Optional direct link to the problem
}

interface LearningPath {
  currentFocus: string
  nextMilestone: string
  suggestedStudyOrder: string[]
}

interface AIRecommendationsData {
  success: boolean
  analysis: AIAnalysis
  recommendations: AIRecommendation[]
  learningPath: LearningPath
  basedOnProblems: number
  generatedAt: string
  message: string
}

const AI_CACHE = "ai-recommendations-cache"
const PATH_CACHE = "learning-path-cache"
const CACHE_HOURS = 24

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const hours = (Date.now() - new Date(parsed.cachedAt).getTime()) / 3_600_000
    return hours < CACHE_HOURS ? (parsed.data as T) : null
  } catch (err) {
    console.error("Failed to load cached data:", err)
    return null
  }
}

function writeCache(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, cachedAt: new Date().toISOString() }))
  } catch {}
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 }

/** Priority as a 3-step meter, so it reads without relying on colour. */
function Priority({ value }: { value: string }) {
  const n = 3 - (PRIORITY_RANK[value.toLowerCase()] ?? 1)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title={`${value} priority`}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("w-1 rounded-[1px]", i === 1 ? "h-1.5" : i === 2 ? "h-2.5" : "h-3.5", i <= n ? "bg-primary" : "bg-border-strong")} />
        ))}
      </span>
      {value} priority
    </span>
  )
}

const DIFF_TEXT: Record<string, string> = { easy: "text-easy", medium: "text-medium", hard: "text-hard" }

function openProblem(rec: AIRecommendation) {
  // Use direct link if provided by backend, otherwise generate URL
  let url = rec.link || ""
  if (!url) {
    const platform = rec.platform.toLowerCase()
    if (platform === "leetcode") {
      const slug = rec.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      url = `https://leetcode.com/problems/${slug}/`
    } else if (platform === "codeforces") {
      url = "https://codeforces.com/problemset"
    } else {
      url = `https://${platform}.com`
    }
  }
  window.open(url, "_blank", "noopener,noreferrer")
}

function Topics({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-2 gap-y-1", className)}>
      {items.map((t) => (
        <li key={t} className="font-mono text-[11px] text-muted-foreground before:mr-0.5 before:text-faint before:content-['#']">
          {t}
        </li>
      ))}
    </ul>
  )
}

export function AIInsightsPage() {
  const [recs, setRecs] = useState<AIRecommendationsData | null>(null)
  const [path, setPath] = useState<LearningPathSuggestionsData | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [pathLoading, setPathLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pathError, setPathError] = useState<string | null>(null)

  // Show the last analysis instantly; it is refreshed on demand.
  useEffect(() => {
    setRecs(readCache<AIRecommendationsData>(AI_CACHE))
    setPath(readCache<LearningPathSuggestionsData>(PATH_CACHE))
  }, [])

  const analyse = useCallback(async () => {
    try {
      setAnalysing(true)
      setError(null)
      const data = await getAIRecommendations()
      setRecs(data)
      writeCache(AI_CACHE, data)
    } catch (err: any) {
      console.error("Failed to refresh AI insights:", err)
      setError(err.response?.data?.message || "The analysis couldn't be completed")
    } finally {
      setAnalysing(false)
    }
  }, [])

  const buildPath = useCallback(async () => {
    try {
      setPathLoading(true)
      setPathError(null)
      const data = await getLearningPathSuggestions()
      setPath(data)
      writeCache(PATH_CACHE, data)
    } catch (err: any) {
      console.error("Failed to fetch learning path:", err)
      setPathError(err.response?.data?.message || "Couldn't build the roadmap")
    } finally {
      setPathLoading(false)
    }
  }, [])

  const sorted = useMemo(
    () => [...(recs?.recommendations ?? [])].sort((a, b) => (PRIORITY_RANK[a.priority.toLowerCase()] ?? 1) - (PRIORITY_RANK[b.priority.toLowerCase()] ?? 1)),
    [recs]
  )

  const maxTopic = Math.max(...(path?.analysis.topicDistribution.map((t) => t.count) ?? [1]), 1)

  return (
    <div className="space-y-16">
      <PageHeader
        eyebrow="Smart Insights"
        title={
          <>
            What to work on <span className="text-primary">next</span>
          </>
        }
        description="CodeOrbit reads your recent solves, finds the pattern in them, and picks problems that close the gaps."
        actions={
          <Button variant={recs ? "outline" : "default"} onClick={analyse} disabled={analysing}>
            <Sparkles className={cn(analysing && "animate-pulse")} />
            {analysing ? "Analysing…" : recs ? "Re-analyse" : "Analyse my activity"}
          </Button>
        }
      />

      {error && (
        <ErrorState
          compact
          title={error}
          description={recs ? "Showing your last analysis below." : "Nothing has been changed. Make sure a platform with recent solves is connected."}
          onRetry={analyse}
        />
      )}

      {!recs && !analysing && !error && (
        <EmptyState
          icon={<Sparkles className="size-4" />}
          title="No analysis yet"
          description="Run one and you'll get a read on your solving pattern, the topics you're avoiding, and a short list of problems chosen for you."
          action={<Button onClick={analyse}><Sparkles /> Analyse my activity</Button>}
        />
      )}

      {analysing && !recs && (
        <LoadingState
          title="Reading your recent submissions"
          description="Fetching your latest solves, grouping them by topic and difficulty, then choosing what to recommend. Usually 5 to 15 seconds."
        />
      )}

      {recs && (
        <div className={cn("space-y-16 transition-opacity", analysing && "opacity-50")} aria-busy={analysing}>
          {/* 1. What the analysis sees */}
          <section aria-labelledby="reading" className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <p id="reading" className="t-eyebrow">
                The reading · {recs.basedOnProblems} solves · {timeAgo(recs.generatedAt)}
              </p>
              <p className="font-display text-3xl font-medium leading-[1.2] tracking-[-0.03em] sm:text-[2.25rem]">
                You're solving at <span className="capitalize text-primary">{recs.analysis.currentDifficultyLevel}</span> level
                {recs.analysis.dominantTopics.length > 0 && (
                  <>
                    , leaning on{" "}
                    <span className="text-primary">{recs.analysis.dominantTopics.slice(0, 3).join(", ")}</span>
                  </>
                )}
                .
              </p>
              <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{recs.analysis.solvingPattern}</p>
            </div>
            <div className="space-y-4 lg:col-span-4">
              <p className="t-eyebrow">Gaps it found</p>
              {recs.analysis.identifiedGaps.length ? (
                <ul className="space-y-2.5 border-l-2 border-primary pl-4">
                  {recs.analysis.identifiedGaps.map((g) => (
                    <li key={g} className="text-sm leading-snug">{g}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No clear gaps. Your coverage looks balanced.</p>
              )}
            </div>
          </section>

          {/* 2. What to do about it */}
          <Section title="Work on next" aside={`${sorted.length} picks, highest priority first`}>
            {sorted.length === 0 ? (
              <EmptyState compact title="No recommendations returned" description="Try re-analysing after a few more solves." />
            ) : (
              <ol className="divide-y divide-border">
                {sorted.map((rec, i) => (
                  <li key={`${rec.title}-${i}`} className="grid gap-x-8 gap-y-4 py-6 lg:grid-cols-12">
                    <div className="flex gap-4 lg:col-span-8">
                      <span className="t-num w-6 shrink-0 pt-1 text-sm text-faint">{String(i + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            <span className="t-eyebrow mr-2 align-middle">Because</span>
                            {rec.reasoning}
                          </p>
                          <h3 className="text-lg font-medium tracking-tight">{rec.title}</h3>
                        </div>
                        <p className="max-w-xl text-[13px] leading-relaxed">
                          <span className="text-faint">You'll practise: </span>
                          {rec.learningObjective}
                        </p>
                        <Topics items={rec.topics} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pl-10 lg:col-span-4 lg:flex-col lg:items-end lg:gap-2 lg:pl-0">
                      <Priority value={rec.priority} />
                      <span className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className={cn("font-medium capitalize", DIFF_TEXT[rec.difficulty.toLowerCase()])}>{rec.difficulty}</span>
                        <span>{rec.platform}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" />{rec.estimatedTime}</span>
                      </span>
                      <Button variant="outline" size="sm" onClick={() => openProblem(rec)}>
                        Open problem <ArrowUpRight />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {/* 3. Where it leads */}
          {recs.learningPath && (
            <Section title="Where this leads" eyebrow="direction">
              <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-5">
                  <Stat label="Current focus" size="sm" value={recs.learningPath.currentFocus} className="[&>p:nth-child(2)]:font-sans [&>p:nth-child(2)]:text-xl [&>p:nth-child(2)]:leading-snug" />
                  <div className="space-y-1.5">
                    <p className="t-eyebrow">Next milestone</p>
                    <p className="text-[15px] leading-relaxed">{recs.learningPath.nextMilestone}</p>
                  </div>
                </div>
                <div className="lg:col-span-7">
                  <p className="t-eyebrow mb-3">Suggested study order</p>
                  <ol className="relative space-y-4 border-l border-border-strong pl-6">
                    {recs.learningPath.suggestedStudyOrder.map((step, i) => (
                      <li key={step} className="relative text-sm leading-relaxed">
                        <span className="t-num absolute -left-[2.15rem] top-0 flex size-5 items-center justify-center rounded-full border border-border-strong bg-background text-[10px] text-muted-foreground">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* 4. Full roadmap, built on request */}
      <Section
        title="Full roadmap"
        eyebrow="phases · milestones"
        aside={
          path && (
            <Button variant="ghost" size="sm" onClick={buildPath} disabled={pathLoading}>
              {pathLoading ? "Rebuilding…" : "Rebuild"}
            </Button>
          )
        }
      >
        {pathError && <ErrorState compact title={pathError} onRetry={buildPath} className="mb-6" />}

        {!path && !pathLoading && (
          <EmptyState
            compact
            title="A phase-by-phase plan"
            description="Turn the reading above into a structured roadmap with durations, goals and milestones for each phase."
            action={<Button variant="outline" size="sm" onClick={buildPath}><Sparkles /> Build my roadmap</Button>}
          />
        )}
        {pathLoading && !path && <LoadingState compact title="Building your roadmap" description="Mapping your topic coverage onto a plan." />}

        {path && (
          <div className={cn("space-y-14", pathLoading && "opacity-50")}>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:[&>*+*]:border-l sm:[&>*+*]:pl-6">
              <Stat label="Level" size="sm" value={<span className="capitalize">{path.learningPath.currentLevel}</span>} />
              <Stat label="Duration" size="sm" value={path.learningPath.estimatedDuration} />
              <Stat label="Phases" size="sm" value={path.learningPath.totalPhases} />
              <Stat label="Solved" size="sm" value={path.userProfile.totalSolved} hint={`LC ${path.userProfile.leetcodeRating || "—"} · CF ${path.userProfile.codeforcesRating || "—"}`} />
            </div>

            <ol className="space-y-0">
              {path.learningPath.phases.map((phase, i) => (
                <li key={phase.phase} className="grid gap-x-10 gap-y-4 border-t border-border py-7 lg:grid-cols-12">
                  <div className="lg:col-span-3">
                    <p className="t-num text-sm text-primary">Phase {i + 1}</p>
                    <h3 className="mt-1 text-base font-medium">{phase.phase}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{phase.duration} · {phase.focus}</p>
                  </div>
                  <div className="space-y-4 lg:col-span-5">
                    <p className="t-eyebrow">Goals</p>
                    <ul className="space-y-2 text-sm">
                      {phase.goals.map((g) => (
                        <li key={g} className="flex gap-2.5"><span className="mt-2 size-1 shrink-0 rounded-full bg-foreground" />{g}</li>
                      ))}
                    </ul>
                    <Topics items={phase.topics} />
                  </div>
                  <div className="space-y-2 lg:col-span-4">
                    <p className="t-eyebrow">Done when</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {phase.milestones.map((m) => (
                        <li key={m} className="border-l-2 border-border-strong pl-3">{m}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>

            <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <div>
                <p className="t-eyebrow mb-4">Topic coverage · {path.analysis.totalProblemsAnalyzed} problems</p>
                <ul className="space-y-2.5">
                  {path.analysis.topicDistribution.map((t) => (
                    <li key={t.topic} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-xs">
                      <span className="truncate text-muted-foreground">{t.topic}</span>
                      <span className="h-1.5 rounded-sm bg-surface-sunken">
                        <span className="animate-draw-bar block h-full rounded-sm bg-primary" style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                      </span>
                      <span className="t-num text-right text-faint">{t.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="t-eyebrow mb-4">Immediate next steps</p>
                <ol className="space-y-3 text-sm">
                  {path.learningPath.nextSteps.map((s, i) => (
                    <li key={s} className="flex gap-3">
                      <span className="t-num text-faint">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}
