"use client"

import { useState, useEffect } from "react"
import { 
  Brain, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Lightbulb, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles
} from "lucide-react"
import { 
  getAIRecommendations, 
  getDifficultyProgression 
} from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface DifficultyProgressionData {
  success: boolean
  platform: string
  currentLevel: string
  nextLevel: string
  suggestions: string[]
  message: string
}

export function AIInsightsPage() {
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendationsData | null>(null)
  const [difficultyProgression, setDifficultyProgression] = useState<DifficultyProgressionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch AI data in parallel
        const [aiResponse, difficultyResponse] = await Promise.allSettled([
          getAIRecommendations(),
          getDifficultyProgression()
        ])

        if (aiResponse.status === 'fulfilled') {
          setAIRecommendations(aiResponse.value)
        }

        if (difficultyResponse.status === 'fulfilled') {
          setDifficultyProgression(difficultyResponse.value)
        }

      } catch (err: any) {
        console.error("Failed to fetch AI insights:", err)
        setError(err.response?.data?.message || "Failed to load AI insights")
      } finally {
        setLoading(false)
      }
    }

    fetchAIData()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100 dark:bg-green-900'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900'
      case 'hard': return 'text-red-600 bg-red-100 dark:bg-red-900'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalized recommendations and learning insights powered by AI
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
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalized recommendations and learning insights powered by AI
          </p>
        </div>
        <div className="text-sm text-destructive">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalized recommendations and learning insights powered by AI
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Analysis Summary */}
          {aiRecommendations && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{aiRecommendations.analysis.currentDifficultyLevel}</div>
                  <p className="text-xs text-muted-foreground">Difficulty level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dominant Topics</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aiRecommendations.analysis.dominantTopics.length}</div>
                  <p className="text-xs text-muted-foreground">Strong areas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Based on Problems</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aiRecommendations.basedOnProblems}</div>
                  <p className="text-xs text-muted-foreground">Problems analyzed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDate(aiRecommendations.generatedAt)}</div>
                  <p className="text-xs text-muted-foreground">Analysis date</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analysis Details */}
          {aiRecommendations && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Dominant Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiRecommendations.analysis.dominantTopics.map((topic, index) => (
                        <Badge key={index} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Solving Pattern</h4>
                    <p className="text-sm text-muted-foreground">
                      {aiRecommendations.analysis.solvingPattern}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Identified Gaps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aiRecommendations.analysis.identifiedGaps.map((gap, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-sm">{gap}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Difficulty Progression */}
          {difficultyProgression && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Difficulty Progression
                </CardTitle>
                <CardDescription>
                  Current: {difficultyProgression.currentLevel} → Next: {difficultyProgression.nextLevel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {difficultyProgression.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {aiRecommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Powered Recommendations
                </CardTitle>
                <CardDescription>
                  Personalized problem recommendations based on your solving patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiRecommendations.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge variant="outline" className={getDifficultyColor(rec.difficulty)}>
                              {rec.difficulty}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(rec.priority)}`}></div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.reasoning}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {rec.estimatedTime}
                            </span>
                            <span>{rec.platform}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Topics:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rec.topics.map((topic, topicIndex) => (
                              <Badge key={topicIndex} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Learning Objective:</span>
                          <p className="text-xs text-muted-foreground mt-1">{rec.learningObjective}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}