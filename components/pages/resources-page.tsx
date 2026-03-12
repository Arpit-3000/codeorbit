"use client"

import { BookOpen, ExternalLink, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { getResources } from "@/lib/api"

interface Resource {
  _id: string
  name: string
  description: string
  url: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  problems: number
}

function getDifficultyColor(d: string) {
  switch (d) {
    case "Beginner":
      return "bg-success/10 text-success"
    case "Intermediate":
      return "bg-warning/10 text-warning"
    case "Advanced":
      return "bg-chart-4/10 text-chart-4"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getResources()
        setResources(data.resources)
      } catch (err: any) {
        console.error("Failed to fetch resources", err)
        setError(err.response?.data?.message || "Failed to load resources")
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resource Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated DSA sheets, interview prep material, and system design resources
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resource Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated DSA sheets, interview prep material, and system design resources
          </p>
        </div>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resource Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated DSA sheets, interview prep material, and system design resources
        </p>
      </div>

      {/* Resource Grid */}
      {resources.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No resources available</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource, i) => (
            <div
              key={resource._id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex flex-col h-full">
                {/* Category + Difficulty */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-[10px] bg-secondary text-secondary-foreground border-0">
                    {resource.category}
                  </Badge>
                  <Badge className={cn("text-[10px] border-0", getDifficultyColor(resource.difficulty))}>
                    {resource.difficulty}
                  </Badge>
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-foreground mb-1">{resource.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
                  {resource.description}
                </p>

                {/* Problems count */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{resource.problems} problems</span>
                  </div>
                </div>

                {/* Action */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs text-primary hover:bg-primary/10 hover:text-primary h-9"
                  asChild
                >
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    View Resource
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
