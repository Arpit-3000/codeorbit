"use client"

import { ArrowUpRight, Printer, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InterviewReportProps {
  report: any
  onRestart: () => void
}

type Verdict = { label: string; tone: string; note: string }

const VERDICTS: Record<string, Verdict> = {
  "Strong Hire": { label: "Strong hire", tone: "border-success text-success", note: "Clear, well-supported answers throughout." },
  Hire: { label: "Hire", tone: "border-info text-info", note: "Solid performance with a few gaps." },
  Maybe: { label: "Borderline", tone: "border-warning text-warning", note: "Mixed signals. Could go either way." },
  "No Hire": { label: "Not yet", tone: "border-destructive text-destructive", note: "Significant gaps for this level." },
}

function Gauge({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100))
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm">{label}</p>
        <p className="t-num text-lg">{value.toFixed(1)}</p>
      </div>
      <div className="relative h-1.5 rounded-sm bg-surface-sunken" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={value}>
        <div className="animate-draw-bar h-full rounded-sm bg-primary" style={{ width: `${pct}%` }} />
        {[25, 50, 75].map((t) => (
          <span key={t} className="absolute top-0 h-full w-px bg-background" style={{ left: `${t}%` }} aria-hidden />
        ))}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function List({ title, items, tone }: { title: string; items?: string[]; tone: "good" | "bad" | "neutral" }) {
  if (!items || items.length === 0) return null
  return (
    <section className="space-y-4">
      <h2 className="t-eyebrow">{title}</h2>
      <ul className="space-y-3">
        {items.map((s, i) => (
          <li
            key={i}
            className={cn(
              "border-l-2 pl-4 text-sm leading-relaxed",
              tone === "good" ? "border-success" : tone === "bad" ? "border-destructive/70" : "border-border-strong"
            )}
          >
            {s}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function InterviewReport({ report, onRestart }: InterviewReportProps) {
  const verdict = VERDICTS[report.hiring_recommendation] ?? VERDICTS.Maybe
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
  const num = (v: any) => (typeof v === "number" ? v : Number(v) || 0)

  return (
    <article className="mx-auto max-w-4xl space-y-16 px-6 py-14 sm:px-10 print:py-0">
      {/* Masthead */}
      <header className="space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="t-eyebrow">Interview assessment · {date}</p>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer /> Save as PDF
            </Button>
            <Button size="sm" onClick={onRestart}>
              <RotateCcw /> New interview
            </Button>
          </div>
        </div>

        <div className="grid gap-x-16 gap-y-10 md:grid-cols-[auto_1fr] md:items-end">
          <div className="space-y-2">
            <p className="t-eyebrow">Overall</p>
            <p className="flex items-baseline gap-2">
              <span className="t-num text-[6.5rem] font-medium leading-[0.85] tracking-[-0.05em]">{num(report.overall_score).toFixed(1)}</span>
              <span className="t-num text-2xl text-muted-foreground">/10</span>
            </p>
          </div>
          <div className="space-y-5">
            <div className={cn("inline-flex items-baseline gap-3 border-l-2 pl-4", verdict.tone)}>
              <span className="text-xl font-medium">{verdict.label}</span>
              <span className="text-sm text-muted-foreground">{verdict.note}</span>
            </div>
            <dl className="t-num flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <div>
                <dt className="sr-only">Duration</dt>
                <dd><span className="text-foreground">{report.duration_minutes}</span> min</dd>
              </div>
              <div>
                <dt className="sr-only">Questions</dt>
                <dd><span className="text-foreground">{report.questions_answered}</span> questions answered</dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* Performance */}
      <section className="grid gap-x-16 gap-y-8 border-t border-border pt-10 md:grid-cols-3" aria-label="Performance breakdown">
        <Gauge label="Technical" value={num(report.technical_score)} />
        <Gauge label="Communication" value={num(report.communication_score)} />
        <Gauge label="Confidence" value={num(report.confidence_score)} />
        <p className="text-xs leading-relaxed text-faint md:col-span-3">
          Communication and confidence are estimated from the quality of your answers overall, not measured from your voice or delivery.
        </p>
      </section>

      {/* Narrative */}
      {report.detailed_feedback && (
        <section className="grid gap-x-16 gap-y-4 border-t border-border pt-10 md:grid-cols-[10rem_1fr]">
          <h2 className="t-eyebrow">Assessment</h2>
          <p className="max-w-2xl whitespace-pre-wrap text-[17px] leading-[1.7]">{report.detailed_feedback}</p>
        </section>
      )}

      {/* Strengths vs weaknesses */}
      <div className="grid gap-x-16 gap-y-12 border-t border-border pt-10 md:grid-cols-2">
        <List title="What went well" items={report.strengths} tone="good" />
        <List title="Where to improve" items={report.weaknesses} tone="bad" />
      </div>

      {/* Concepts you missed */}
      {report.missed_concepts?.length > 0 && (
        <section className="grid gap-x-16 gap-y-4 border-t border-border pt-10 md:grid-cols-[10rem_1fr]">
          <h2 className="t-eyebrow">Concepts you missed</h2>
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {report.missed_concepts.map((c: string, i: number) => (
              <li key={i} className="border-b border-border pb-3 text-sm leading-relaxed">
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* What to do next */}
      <section className="space-y-10 border-t border-border pt-10" aria-label="Next steps">
        <h2 className="t-title text-xl">Next steps</h2>
        <div className="grid gap-x-16 gap-y-10 md:grid-cols-2">
          {(report.topics_to_improve?.length > 0 || report.recommended_topics?.length > 0) && (
            <div className="space-y-4">
              <p className="t-eyebrow">Topics to study</p>
              <ul className="flex flex-wrap gap-x-3 gap-y-2">
                {[...new Set([...(report.topics_to_improve ?? []), ...(report.recommended_topics ?? [])])].map((t: string) => (
                  <li key={t} className="font-mono text-[13px] text-muted-foreground before:mr-0.5 before:text-faint before:content-['#']">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.recommended_leetcode_problems?.length > 0 && (
            <div className="space-y-4">
              <p className="t-eyebrow">Practise these</p>
              <ul className="divide-y divide-border border-y border-border">
                {report.recommended_leetcode_problems.map((p: string, i: number) => (
                  <li key={i}>
                    <a
                      href={`https://leetcode.com/problemset/?search=${encodeURIComponent(p)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 py-2.5 text-sm hover:text-primary"
                    >
                      {p}
                      <ArrowUpRight className="size-3.5 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100 print:hidden" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.recommended_resources?.length > 0 && (
            <div className="space-y-4 md:col-span-2">
              <p className="t-eyebrow">Read and watch</p>
              <ul className="divide-y divide-border border-y border-border">
                {report.recommended_resources.map((r: string, i: number) => (
                  <li key={i} className="py-2.5 text-sm">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border pt-8 print:hidden">
        <Button size="lg" onClick={onRestart}>
          <RotateCcw /> Run another interview
        </Button>
        <p className="text-xs text-muted-foreground">Interviews aren't saved. Save this page as a PDF if you want to keep it.</p>
      </footer>
    </article>
  )
}
