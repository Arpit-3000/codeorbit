/**
 * AI Interview API Client
 * Connects to Node.js backend which proxies to AI service
 */

import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
const AI_INTERVIEW_BASE = `${API_BASE_URL}/api/ai-interview`

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: AI_INTERVIEW_BASE,
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface CodingProfile {
  leetcode_rating?: number
  codeforces_rating?: number
  codechef_rating?: number
  strong_topics?: string[]
  weak_topics?: string[]
  total_problems_solved?: number
  contest_participation?: number
}

export interface StartInterviewRequest {
  interview_type: string
  difficulty: string
  resume_path?: string
}

export interface StartInterviewResponse {
  success: boolean
  data: {
    session_id: string
    message: string
    question: string
    stage: string
    difficulty: string
  }
}

export interface SubmitAnswerRequest {
  session_id: string
  answer: string
}

export interface SubmitAnswerResponse {
  success: boolean
  data: {
    evaluation: {
      overall_score: number
      technical_accuracy: number
      depth: number
      clarity: number
      completeness: number
      communication: number
      strengths: string[]
      weaknesses: string[]
      feedback: string
      confidence_level: string
    }
    next_question: string
    stage: string
    difficulty: string
    overall_score: number
    questions_answered: number
  }
}

export interface EndInterviewResponse {
  success: boolean
  data: {
    message: string
    report: {
      overall_score: number
      technical_score: number
      communication_score: number
      confidence_score: number
      strengths: string[]
      weaknesses: string[]
      topics_to_improve: string[]
      missed_concepts: string[]
      recommended_topics: string[]
      recommended_leetcode_problems: string[]
      recommended_resources: string[]
      hiring_recommendation: string
      detailed_feedback: string
      session_id: string
      duration_minutes: number
      questions_answered: number
    }
  }
}

export interface SessionStatusResponse {
  success: boolean
  data: {
    session_id: string
    user_id: string
    interview_type: string
    stage: string
    difficulty: string
    questions_answered: number
    overall_score: number
    current_question: string
  }
}

/**
 * Upload Resume
 */
export async function uploadResume(file: File) {
  const formData = new FormData()
  formData.append("resume", file)

  const response = await apiClient.post("/upload-resume", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data
}

/**
 * Start Interview
 */
export async function startInterview(
  data: StartInterviewRequest
): Promise<StartInterviewResponse> {
  const response = await apiClient.post("/start", data)
  return response.data
}

/**
 * Submit Answer
 */
export async function submitAnswer(
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> {
  const response = await apiClient.post("/answer", data)
  return response.data
}

/**
 * Get Follow-up Question
 */
export async function getFollowup(session_id: string) {
  const response = await apiClient.post("/followup", { session_id })
  return response.data
}

/**
 * End Interview
 */
export async function endInterview(
  session_id: string
): Promise<EndInterviewResponse> {
  const response = await apiClient.post(`/end/${session_id}`)
  return response.data
}

/**
 * Get Session Status
 */
export async function getSessionStatus(
  session_id: string
): Promise<SessionStatusResponse> {
  const response = await apiClient.get(`/session/${session_id}`)
  return response.data
}

/**
 * Advance Stage
 */
export async function advanceStage(session_id: string) {
  const response = await apiClient.post(`/advance/${session_id}`)
  return response.data
}

/**
 * Speech to Text (if backend supports it)
 * Note: Currently voice features use browser APIs
 */
export async function speechToText(audioBlob: Blob) {
  const formData = new FormData()
  formData.append("audio", audioBlob, "answer.webm")

  // This would need to be added to backend if needed
  // For now, we use browser's speech recognition
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000"}/voice/speech-to-text`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )

  return response.data
}
