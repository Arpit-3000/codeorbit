"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BookOpen, 
  Code,
  RotateCcw,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface InterviewReportProps {
  report: any
  onRestart: () => void
}

export function InterviewReport({ report, onRestart }: InterviewReportProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getRecommendationBadge = (recommendation: string) => {
    const config = {
      "Strong Hire": { variant: "default" as const, icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200" },
      "Hire": { variant: "secondary" as const, icon: CheckCircle, color: "bg-blue-100 text-blue-800 border-blue-200" },
      "Maybe": { variant: "outline" as const, icon: Target, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      "No Hire": { variant: "destructive" as const, icon: XCircle, color: "bg-red-100 text-red-800 border-red-200" },
    }
    return config[recommendation as keyof typeof config] || config["Maybe"]
  }

  const recommendation = getRecommendationBadge(report.hiring_recommendation)
  const RecommendationIcon = recommendation.icon

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">Interview Complete!</h1>
        <p className="text-lg text-muted-foreground">
          Here's your comprehensive performance report
        </p>
      </div>

      {/* Overall Score */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-center">Overall Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(report.overall_score)}`}>
                {report.overall_score.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Overall Score</p>
            </div>
            
            <div className="h-24 w-px bg-border" />
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm w-32">Technical:</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(report.technical_score / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {report.technical_score.toFixed(1)}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm w-32">Communication:</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(report.communication_score / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {report.communication_score.toFixed(1)}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm w-32">Confidence:</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(report.confidence_score / 10) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right">
                  {report.confidence_score.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t">
            <RecommendationIcon className="w-5 h-5" />
            <span className="text-lg font-semibold">Hiring Recommendation:</span>
            <Badge className={recommendation.color}>
              {report.hiring_recommendation}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.strengths.map((strength: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.weaknesses.map((weakness: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Topics to Improve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Topics to Study
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {report.topics_to_improve.map((topic: string, index: number) => (
              <Badge key={index} variant="outline">
                {topic}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended LeetCode Problems */}
      {report.recommended_leetcode_problems && report.recommended_leetcode_problems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Recommended Practice Problems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {report.recommended_leetcode_problems.map((problem: string, index: number) => (
                <div 
                  key={index}
                  className="p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium">{problem}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.detailed_feedback}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {report.duration_minutes}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Minutes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {report.questions_answered}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Questions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {report.overall_score.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-center pt-4">
        <Button size="lg" onClick={onRestart}>
          <RotateCcw className="w-5 h-5 mr-2" />
          Start New Interview
        </Button>
        
        <Button size="lg" variant="outline" onClick={() => window.print()}>
          <Download className="w-5 h-5 mr-2" />
          Download Report
        </Button>
      </div>
    </div>
  )
}
