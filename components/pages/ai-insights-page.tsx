"use client"

import { useState, useEffect } from "react"
import { 
  Brain, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Lightbulb, 
  Clock, 
  Star, 
  ArrowRight,
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles
} from "lucide-react"
import { 
  getAIRecommendations, 
  getTopicRecommendations, 
  getLearningPath, 
  getDifficultyProgression 
} from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface TopicProblem {
  title: string
  description: string
  keyConcepts: string[]
  difficulty: string
  estimatedTime: string
  prerequisites: string[]
}

interface TopicRecommendationsData {
  success: boolean
  topic: string
  difficulty: string
  platform: string
  problems: TopicProblem[]
  message: string
}

interface LearningPathData {
  success: boolean
  learningPath: LearningPath
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
  const [topicRecommendations, setTopicRecommendations] = useState<TopicRecommendationsData | null>(null)
  const [learningPath, setLearningPath] = useState<LearningPathData | null>(null)
  const [difficultyProgression, setDifficultyProgression] = useState<DifficultyProgressionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Topic recommendation filters
  const [selectedTopic, setSelectedTopic] = useState("graph")
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium")
  const [selectedPlatform, setSelectedPlatform] = useState("leetcode")

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch all AI data in parallel
        const [aiResponse, learningPathResponse, difficultyResponse] = await Promise.allSettled([
          getAIRecommendations(),
          getLearningPath(),
          getDifficultyProgression()
        ])

        if (aiResponse.status === 'fulfilled') {
          setAIRecommendations(aiResponse.value)
        }

        if (learningPathResponse.status === 'fulfilled') {
          setLearningPath(learningPathResponse.value)
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

  const fetchTopicRecommendations = async () => {
    try {
      const data = await getTopicRecommendations(selectedTopic, selectedDifficulty, selectedPlatform)
      setTopicRecommendations(data)
    } catch (err: any) {
      console.error("Failed to fetch topic recommendations:", err)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchTopicRecommendations()
    }
  }, [selectedTopic, selectedDifficulty, selectedPlatform, loading])

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
          <TabsTrigger value="topic-specific">Topic Specific</TabsTrigger>
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

        <TabsContent value="learning-path" className="space-y-4">
          {(aiRecommendations?.learningPath || learningPath?.learningPath) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Path
                </CardTitle>
                <CardDescription>
                  Structured learning progression based on your current skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-primary/10">
                      <h4 className="font-semibold text-primary mb-2">Current Focus</h4>
                      <p className="text-sm">{(aiRecommendations?.learningPath || learningPath?.learningPath)?.currentFocus}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <h4 className="font-semibold mb-2">Next Milestone</h4>
                      <p className="text-sm">{(aiRecommendations?.learningPath || learningPath?.learningPath)?.nextMilestone}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Suggested Study Order</h4>
                    <div className="space-y-3">
                      {(aiRecommendations?.learningPath || learningPath?.learningPath)?.suggestedStudyOrder.map((step, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="flex-1">{step}</span>
                          {index < (aiRecommendations?.learningPath || learningPath?.learningPath)!.suggestedStudyOrder.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="topic-specific" className="space-y-4">
          {/* Topic Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Topic-Specific Recommendations
              </CardTitle>
              <CardDescription>
                Get targeted problem recommendations for specific topics and difficulty levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Topic</label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="graph">Graph</SelectItem>
                      <SelectItem value="dp">Dynamic Programming</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                      <SelectItem value="tree">Tree</SelectItem>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="math">Math</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Platform</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leetcode">LeetCode</SelectItem>
                      <SelectItem value="codeforces">Codeforces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Topic Recommendations */}
              {topicRecommendations && (
                <div className="space-y-4">
                  <h4 className="font-semibold">
                    {topicRecommendations.problems.length} {selectedDifficulty} {selectedTopic} problems on {selectedPlatform}
                  </h4>
                  
                  {topicRecommendations.problems.map((problem, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{problem.title}</h4>
                            <Badge variant="outline" className={getDifficultyColor(problem.difficulty)}>
                              {problem.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{problem.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {problem.estimatedTime}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Key Concepts:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {problem.keyConcepts.map((concept, conceptIndex) => (
                              <Badge key={conceptIndex} variant="secondary" className="text-xs">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Prerequisites:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {problem.prerequisites.map((prereq, prereqIndex) => (
                              <Badge key={prereqIndex} variant="outline" className="text-xs">
                                {prereq}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}