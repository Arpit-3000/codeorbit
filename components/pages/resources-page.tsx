"use client"

import { BookOpen, ExternalLink, Star, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Resource {
  name: string
  description: string
  problems: number
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  category: string
  progress: number
}

const resources: Resource[] = [
  {
    name: "Striver's SDE Sheet",
    description: "180+ handpicked DSA problems covering all important topics for SDE interviews.",
    problems: 191,
    difficulty: "Intermediate",
    category: "Interview Prep",
    progress: 68,
  },
  {
    name: "Blind 75",
    description: "Curated list of 75 most frequently asked LeetCode questions by topic.",
    problems: 75,
    difficulty: "Intermediate",
    category: "Interview Prep",
    progress: 82,
  },
  {
    name: "NeetCode 150",
    description: "Structured roadmap of 150 problems organized by pattern and difficulty.",
    problems: 150,
    difficulty: "Intermediate",
    category: "Interview Prep",
    progress: 45,
  },
  {
    name: "Love Babbar 450",
    description: "Comprehensive DSA sheet with 450 problems across all fundamental topics.",
    problems: 450,
    difficulty: "Beginner",
    category: "DSA Fundamentals",
    progress: 32,
  },
  {
    name: "System Design Primer",
    description: "Learn to design large-scale systems. Covers scalability, caching, and more.",
    problems: 50,
    difficulty: "Advanced",
    category: "System Design",
    progress: 15,
  },
  {
    name: "CP Handbook",
    description: "Competitive programming techniques including graph theory, DP, and number theory.",
    problems: 200,
    difficulty: "Advanced",
    category: "Competitive Programming",
    progress: 22,
  },
]

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource, i) => (
          <div
            key={resource.name}
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

              {/* Progress */}
              <div className="mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{resource.problems} problems</span>
                  <span className="font-medium text-foreground">{resource.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${resource.progress}%` }}
                  />
                </div>
              </div>

              {/* Action */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs text-primary hover:bg-primary/10 hover:text-primary h-9"
              >
                Continue Learning
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
