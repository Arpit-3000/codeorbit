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
  getLearningPathSuggestions,
  LearningPathSuggestionsData
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

export function AIInsightsPage() {
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendationsData | null>(null)
  const [learningPathData, setLearningPathData] = useState<LearningPathSuggestionsData | null>(null)
  const [loading, setLoading] = useState(false) // Changed to false initially
  const [learningPathLoading, setLearningPathLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [recommendLoading, setRecommendLoading] = useState(false)

  // Load cached data immediately on component mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        // Try to load cached AI recommendations from localStorage
        const cachedAIData = localStorage.getItem('ai-recommendations-cache')
        if (cachedAIData) {
          const parsedData = JSON.parse(cachedAIData)
          // Check if cache is not too old (e.g., less than 1 hour)
          const cacheTime = new Date(parsedData.cachedAt)
          const now = new Date()
          const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60)
          
          if (hoursDiff < 24) { // Cache valid for 24 hours
            setAIRecommendations(parsedData.data)
          }
        }

        // Try to load cached learning path data
        const cachedLearningPath = localStorage.getItem('learning-path-cache')
        if (cachedLearningPath) {
          const parsedData = JSON.parse(cachedLearningPath)
          const cacheTime = new Date(parsedData.cachedAt)
          const now = new Date()
          const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60)
          
          if (hoursDiff < 24) { // Cache valid for 24 hours
            setLearningPathData(parsedData.data)
          }
        }
      } catch (err) {
        console.error("Failed to load cached data:", err)
      }
    }

    loadCachedData()
  }, [])

  const fetchLearningPath = async () => {
    try {
      setLearningPathLoading(true)
      setError(null)
      
      const learningPathResponse = await getLearningPathSuggestions()
      setLearningPathData(learningPathResponse)
      
      // Cache the learning path data
      localStorage.setItem('learning-path-cache', JSON.stringify({
        data: learningPathResponse,
        cachedAt: new Date().toISOString()
      }))
      
    } catch (err: any) {
      console.error("Failed to fetch learning path:", err)
      setError(err.response?.data?.message || "Failed to load learning path")
    } finally {
      setLearningPathLoading(false)
    }
  }

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

  const handleRecommendMore = async () => {
    try {
      setRecommendLoading(true)
      setError(null)
      
      // Fetch fresh AI recommendations
      const freshRecommendations = await getAIRecommendations()
      setAIRecommendations(freshRecommendations)
      
      // Cache the fresh data
      localStorage.setItem('ai-recommendations-cache', JSON.stringify({
        data: freshRecommendations,
        cachedAt: new Date().toISOString()
      }))
      
      // Switch to recommendations tab to show new results
      setActiveTab("recommendations")
      
    } catch (err: any) {
      console.error("Failed to fetch new recommendations:", err)
      setError(err.response?.data?.message || "Failed to get new recommendations")
    } finally {
      setRecommendLoading(false)
    }
  }

  // New function to refresh all data
  const handleRefreshData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch fresh AI recommendations
      const aiResponse = await getAIRecommendations()
      setAIRecommendations(aiResponse)
      
      // Cache the fresh data
      localStorage.setItem('ai-recommendations-cache', JSON.stringify({
        data: aiResponse,
        cachedAt: new Date().toISOString()
      }))

    } catch (err: any) {
      console.error("Failed to refresh AI insights:", err)
      setError(err.response?.data?.message || "Failed to refresh AI insights")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenProblem = (recommendation: AIRecommendation) => {
    // Use direct link if provided by backend, otherwise generate URL
    let problemUrl = recommendation.link || ""
    
    if (!problemUrl) {
      // Generate problem URL based on platform and title
      if (recommendation.platform.toLowerCase() === "leetcode") {
        // Convert title to slug format (lowercase, replace spaces with hyphens)
        const slug = recommendation.title
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        
        problemUrl = `https://leetcode.com/problems/${slug}/`
      } else if (recommendation.platform.toLowerCase() === "codeforces") {
        // For Codeforces, we'd need contest ID and problem index
        // For now, redirect to problemset
        problemUrl = "https://codeforces.com/problemset"
      } else {
        // Default to platform's main page
        problemUrl = `https://${recommendation.platform.toLowerCase()}.com`
      }
    }
    
    // Open in new tab
    window.open(problemUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading && !aiRecommendations) {
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
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
            {loading && aiRecommendations && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalized recommendations and learning insights powered by AI
            {aiRecommendations && !loading && (
              <span className="ml-2 text-xs opacity-60">
                • Last updated: {formatDate(aiRecommendations.generatedAt)}
              </span>
            )}
          </p>
        </div>
        <Button 
          onClick={handleRefreshData}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* No data state */}
          {!aiRecommendations && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No AI Insights Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Refresh Data" to generate your personalized AI insights and recommendations.
                </p>
                <Button onClick={handleRefreshData} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Insights
                </Button>
              </CardContent>
            </Card>
          )}

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

          {/* Learning Path */}
          {aiRecommendations && aiRecommendations.learningPath && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Path
                </CardTitle>
                <CardDescription>
                  Current Focus: {aiRecommendations.learningPath.currentFocus}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Next Milestone
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-primary/5 border border-primary/20">
                      {aiRecommendations.learningPath.nextMilestone}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Suggested Study Order
                    </h4>
                    <div className="space-y-2">
                      {aiRecommendations.learningPath.suggestedStudyOrder.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {/* No data state */}
          {!aiRecommendations && !loading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate AI insights first to get personalized problem recommendations.
                </p>
                <Button onClick={handleRefreshData} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Recommendations
                </Button>
              </CardContent>
            </Card>
          )}

          {aiRecommendations && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      AI-Powered Recommendations
                    </CardTitle>
                    <CardDescription>
                      Personalized problem recommendations based on your solving patterns
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleRecommendMore}
                    disabled={recommendLoading}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {recommendLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {recommendLoading ? "Loading..." : "Get More"}
                  </Button>
                </div>
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenProblem(rec)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
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

        <TabsContent value="learning-path" className="space-y-4">
          {!learningPathData && !learningPathLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Personalized Learning Path
                </CardTitle>
                <CardDescription>
                  Get a detailed learning roadmap based on your problem-solving patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={fetchLearningPath}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Learning Path
                </Button>
              </CardContent>
            </Card>
          )}

          {learningPathLoading && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span>Generating your personalized learning path...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {learningPathData && (
            <div className="space-y-4">
              {/* Learning Path Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Level</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">{learningPathData.learningPath.currentLevel}</div>
                    <p className="text-xs text-muted-foreground">Your skill level</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{learningPathData.learningPath.estimatedDuration}</div>
                    <p className="text-xs text-muted-foreground">Estimated time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Learning Phases</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{learningPathData.learningPath.totalPhases}</div>
                    <p className="text-xs text-muted-foreground">Structured phases</p>
                  </CardContent>
                </Card>
              </div>

              {/* User Profile Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Your Profile Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Problem Solving Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Solved:</span>
                          <span className="font-medium">{learningPathData.userProfile.totalSolved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LeetCode Rating:</span>
                          <span className="font-medium">{learningPathData.userProfile.leetcodeRating || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Codeforces Rating:</span>
                          <span className="font-medium">{learningPathData.userProfile.codeforcesRating || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Strong Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {learningPathData.userProfile.dominantTopics.map((topic, index) => (
                          <Badge key={index} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Phases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Learning Phases
                  </CardTitle>
                  <CardDescription>
                    Structured approach to improve your problem-solving skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {learningPathData.learningPath.phases.map((phase, index) => (
                      <div key={index} className="relative">
                        {index < learningPathData.learningPath.phases.length - 1 && (
                          <div className="absolute left-4 top-8 w-0.5 h-full bg-border"></div>
                        )}
                        <div className="flex gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <h4 className="font-semibold text-lg">{phase.phase}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {phase.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {phase.focus}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <h5 className="font-medium text-sm mb-2">Topics to Focus</h5>
                                <div className="flex flex-wrap gap-1">
                                  {phase.topics.map((topic, topicIndex) => (
                                    <Badge key={topicIndex} variant="outline" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-sm mb-2">Goals</h5>
                                <ul className="space-y-1">
                                  {phase.goals.map((goal, goalIndex) => (
                                    <li key={goalIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                                      {goal}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-sm mb-2">Milestones</h5>
                              <div className="space-y-1">
                                {phase.milestones.map((milestone, milestoneIndex) => (
                                  <div key={milestoneIndex} className="text-xs text-muted-foreground p-2 rounded bg-muted/50 flex items-center gap-2">
                                    <Target className="w-3 h-3 text-primary flex-shrink-0" />
                                    {milestone}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {learningPathData.learningPath.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"></div>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Topic Distribution Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Topic Distribution Analysis
                  </CardTitle>
                  <CardDescription>
                    Based on {learningPathData.analysis.totalProblemsAnalyzed} problems analyzed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {learningPathData.analysis.topicDistribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{item.topic}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {item.count} problems
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ 
                                width: `${(item.count / Math.max(...learningPathData.analysis.topicDistribution.map(t => t.count))) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {Math.round((item.count / learningPathData.analysis.totalProblemsAnalyzed) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Refresh Button */}
              <div className="flex justify-center">
                <Button 
                  onClick={fetchLearningPath}
                  disabled={learningPathLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {learningPathLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {learningPathLoading ? "Generating..." : "Refresh Learning Path"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}