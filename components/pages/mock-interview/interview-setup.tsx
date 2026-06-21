"use client"

import { useState } from "react"
import { Upload, FileText, Loader2, Mic, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { uploadResume, startInterview } from "@/lib/ai-interview-api"

interface InterviewSetupProps {
  onStart: (sessionId: string) => void
}

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumePath, setResumePath] = useState<string>("")
  const [interviewType, setInterviewType] = useState<string>("mixed")
  const [difficulty, setDifficulty] = useState<string>("intermediate")
  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [hasResume, setHasResume] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        return
      }
      setResumeFile(file)
    }
  }

  const handleUploadResume = async () => {
    if (!resumeFile) return

    setUploading(true)
    try {
      const response = await uploadResume(resumeFile)

      if (response.success) {
        setResumePath(response.data.path)
        setHasResume(true)
        // Auto-set to mixed interview when resume is uploaded
        setInterviewType("mixed")
        toast({
          title: "Resume uploaded successfully",
          description: "Interview will be based on your resume skills",
        })
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
        onStart(response.data.session_id)
        toast({
          title: "Interview started",
          description: "Get ready to showcase your skills!",
        })
      } else {
        throw new Error(response.data as any || "Failed to start")
      }
    } catch (error: any) {
      toast({
        title: "Failed to start interview",
        description: error.response?.data?.error || error.message || "Please try again",
        variant: "destructive",
      })
      setStarting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Mic className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">AI Mock Interview</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Practice with our AI interviewer powered by advanced language models. 
          Get real-time feedback and improve your interview skills.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Sparkles className="w-8 h-8 text-primary mb-2" />
            <CardTitle>AI-Powered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced AI conducts realistic interviews with contextual follow-up questions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Mic className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Voice Interview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Speak naturally with voice recognition and AI voice responses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <FileText className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Resume-Based</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Questions tailored to your resume and coding profile
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Setup Your Interview</CardTitle>
          <CardDescription>
            Upload your resume and select interview preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>Resume (Upload to get personalized interview)</Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="flex items-center justify-center w-full h-12 px-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {resumeFile ? resumeFile.name : "Choose PDF file"}
                </label>
              </div>
              {resumeFile && !resumePath && (
                <Button
                  onClick={handleUploadResume}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              )}
            </div>
            {resumePath && (
              <p className="text-sm text-green-600">✓ Resume uploaded - Interview will be based on your skills</p>
            )}
            {!resumePath && (
              <p className="text-xs text-muted-foreground">
                💡 With resume: AI asks questions based on your skills. Without resume: Choose specific domain below.
              </p>
            )}
          </div>

          {/* Interview Type - Only show if no resume */}
          {!hasResume && (
            <div className="space-y-2">
              <Label>Interview Domain</Label>
              <Select value={interviewType} onValueChange={setInterviewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dsa">Data Structures & Algorithms</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="node">Node.js</SelectItem>
                  <SelectItem value="cpp_java">C++ / Java</SelectItem>
                  <SelectItem value="dbms">Database Management</SelectItem>
                  <SelectItem value="os">Operating Systems</SelectItem>
                  <SelectItem value="cn">Computer Networks</SelectItem>
                  <SelectItem value="oops">Object-Oriented Programming</SelectItem>
                  <SelectItem value="system_design">System Design</SelectItem>
                  <SelectItem value="mixed">Mixed (All Topics)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the domain you want to be interviewed on
              </p>
            </div>
          )}
          
          {hasResume && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Resume-based interview:</strong> Questions will be asked based on the skills and projects mentioned in your resume.
              </p>
            </div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Button */}
          <Button
            className="w-full h-12 text-lg"
            onClick={handleStartInterview}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting Interview...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Interview
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="max-w-2xl mx-auto bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. <strong>With Resume:</strong> Upload your resume for personalized interview based on your skills</li>
            <li>2. <strong>Without Resume:</strong> Choose specific domain (React, DSA, etc.) to focus on</li>
            <li>3. Select difficulty level (Beginner/Intermediate/Advanced)</li>
            <li>4. Click "Start Interview" to begin with AI interviewer</li>
            <li>5. Speak your answers using microphone or type them</li>
            <li>6. Get real-time feedback and detailed report at the end</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
