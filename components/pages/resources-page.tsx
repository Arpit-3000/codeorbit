"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Search, X } from "lucide-react"
import { getResources } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState, PageHeader, Segmented } from "@/components/ds/primitives"
import { cn } from "@/lib/utils"

type Difficulty = "Beginner" | "Intermediate" | "Advanced"

interface Resource {
  _id: string
  name: string
  description: string
  url: string
  category: string
  difficulty: Difficulty
  problems: number
}

const LEVELS: Difficulty[] = ["Beginner", "Intermediate", "Advanced"]

/** Three pips: how steep the material is, readable without colour. */
function Level({ value }: { value: string }) {
  const n = LEVELS.indexOf(value as Difficulty) + 1
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title={value}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("h-3 w-1 rounded-[1px]", i <= n ? "bg-foreground" : "bg-border-strong")} />
        ))}
      </span>
      {value}
    </span>
  )
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function ResourcesPage() {
  const [resources, setResources] = useState<Resource[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [level, setLevel] = useState<"all" | Difficulty>("all")
  const [sort, setSort] = useState<"curated" | "level">("curated")

  const load = useCallback(() => {
    setError(null)
    getResources()
      .then((d) => setResources(d.resources as Resource[]))
      .catch((e) => {
        console.error("Failed to fetch resources", e)
        setError(e?.response?.data?.message || "Failed to load resources")
      })
  }, [])
  useEffect(load, [load])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    resources?.forEach((r) => counts.set(r.category, (counts.get(r.category) ?? 0) + 1))
    return [...counts.entries()]
  }, [resources])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = (resources ?? []).filter(
      (r) =>
        (category === "all" || r.category === category) &&
        (level === "all" || r.difficulty === level) &&
        (!q || `${r.name} ${r.description} ${r.category}`.toLowerCase().includes(q))
    )
    if (sort === "level") list = [...list].sort((a, b) => LEVELS.indexOf(a.difficulty) - LEVELS.indexOf(b.difficulty))
    return list
  }, [resources, query, category, level, sort])

  const grouped = useMemo(() => {
    const m = new Map<string, Resource[]>()
    filtered.forEach((r) => m.set(r.category, [...(m.get(r.category) ?? []), r]))
    return [...m.entries()]
  }, [filtered])

  const hasFilters = category !== "all" || level !== "all" || query !== ""
  const reset = () => {
    setCategory("all")
    setLevel("all")
    setQuery("")
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Knowledge Hub"
        title="Study material, curated"
        description="Sheets, roadmaps and references worth your time, organised by topic and by how steep they are."
      />

      {error && !resources ? (
        <ErrorState title="Couldn't load the library" description={error} onRetry={load} />
      ) : !resources ? (
        <div className="grid gap-12 lg:grid-cols-12" aria-busy="true" aria-label="Loading resources">
          <Skeleton className="h-48 lg:col-span-3" />
          <div className="space-y-3 lg:col-span-9">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
        </div>
      ) : resources.length === 0 ? (
        <EmptyState title="The library is empty" description="No resources have been published yet." />
      ) : (
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-12">
          {/* Topic index */}
          <aside className="min-w-0 lg:col-span-3">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the library"
                  aria-label="Search resources"
                  className="pl-8 pr-8"
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <nav aria-label="Topics" className="flex gap-x-1 gap-y-0.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                <p className="t-eyebrow mb-1 hidden lg:block">Topics</p>
                {[["all", resources.length] as const, ...categories].map(([name, count]) => (
                  <button
                    key={name}
                    onClick={() => setCategory(name)}
                    aria-pressed={category === name}
                    className={cn(
                      "flex shrink-0 items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                      category === name ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <span className="whitespace-nowrap">{name === "all" ? "Everything" : name}</span>
                    <span className="t-num text-xs text-faint">{count}</span>
                  </button>
                ))}
              </nav>

              <div className="hidden space-y-2 lg:block">
                <p className="t-eyebrow">Level</p>
                <Segmented
                  label="Difficulty"
                  size="sm"
                  value={level}
                  onChange={setLevel}
                  options={[{ value: "all", label: "Any" }, { value: "Beginner", label: "Easy" }, { value: "Intermediate", label: "Mid" }, { value: "Advanced", label: "Hard" }]}
                />
              </div>
            </div>
          </aside>

          {/* Index */}
          <div className="min-w-0 space-y-6 lg:col-span-9">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <p aria-live="polite">
                <span className="t-num text-foreground">{filtered.length}</span> of {resources.length} resources
                {hasFilters && (
                  <button onClick={reset} className="ml-3 underline underline-offset-4 hover:text-foreground">
                    Reset filters
                  </button>
                )}
              </p>
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <Segmented
                    label="Difficulty"
                    size="sm"
                    value={level}
                    onChange={setLevel}
                    options={[{ value: "all", label: "Any" }, { value: "Beginner", label: "Easy" }, { value: "Intermediate", label: "Mid" }, { value: "Advanced", label: "Hard" }]}
                  />
                </div>
                <Segmented label="Sort" size="sm" value={sort} onChange={setSort} options={[{ value: "curated", label: "Curated" }, { value: "level", label: "Easiest first" }]} />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="Nothing matches"
                description={query ? `No resource mentions “${query}” with these filters.` : "No resources fit this combination of topic and level."}
                action={<Button variant="outline" size="sm" onClick={reset}>Reset filters</Button>}
              />
            ) : (
              grouped.map(([cat, list]) => (
                <section key={cat} aria-labelledby={`cat-${cat}`} className="overflow-hidden rounded-lg border border-border bg-surface">
                  <h2 id={`cat-${cat}`} className="flex items-center justify-between gap-3 border-b border-border bg-surface-sunken/50 px-5 py-3.5">
                    <span className="t-title text-base">{cat}</span>
                    <span className="t-num rounded-sm bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {list.length} {list.length === 1 ? "resource" : "resources"}
                    </span>
                  </h2>
                  <ul className="divide-y divide-border">
                    {list.map((r) => (
                      <li key={r._id}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group grid gap-x-8 gap-y-3 px-5 py-5 outline-offset-[-2px] transition-colors hover:bg-accent/40 sm:grid-cols-[1fr_9.5rem]"
                        >
                          <span className="min-w-0 space-y-1.5">
                            <span className="flex items-center gap-2">
                              <span className="text-base font-medium group-hover:text-primary">{r.name}</span>
                              <ArrowUpRight className="size-3.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                            </span>
                            <span className="line-clamp-2 block max-w-prose text-sm leading-relaxed text-muted-foreground">{r.description}</span>
                          </span>
                          <span className="flex items-center justify-between gap-4 sm:flex-col sm:items-start sm:justify-center sm:gap-2 sm:border-l sm:border-border sm:pl-6">
                            <Level value={r.difficulty} />
                            <span className="t-num text-xs text-muted-foreground">
                              {r.problems ? `${r.problems} problems` : host(r.url)}
                            </span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
