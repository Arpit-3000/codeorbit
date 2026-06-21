"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Send, Loader2, Volume2, StopCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AICharacter } from "./ai-character"
import { 
  getSessionStatus, 
  submitAnswer, 
  endInterview,
  speechToText,
  stopSpeech
} from "@/lib/ai-interview-api"

interface Message {
  type: "question" | "answer" | "response"  // Added "response" type for AI's contextual feedback
  content: string
  timestamp: Date
}

interface InterviewRoomProps {
  sessionId: string
  onEnd: (report: any) => void
}

export function InterviewRoom({ sessionId, onEnd }: InterviewRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesisUtterance | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch initial question
    fetchInitialQuestion()
    
    // Cleanup speech on unmount
    return () => {
      stopAllSpeech()
    }
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const stopAllSpeech = () => {
    // Stop browser speech synthesis
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const fetchInitialQuestion = async () => {
    try {
      const response = await getSessionStatus(sessionId)
      
      if (response.success) {
        const question = response.data.current_question
        setCurrentQuestion(question)
        setMessages([{ type: "question", content: question, timestamp: new Date() }])
        
        // Speak the question
        speakText(question)
      }
    } catch (error) {
      console.error("Failed to fetch question:", error)
      toast({
        title: "Error",
        description: "Failed to load interview question",
        variant: "destructive",
      })
    }
  }

  const speakText = async (text: string) => {
    // Stop any ongoing speech first
    stopAllSpeech()
    
    setIsSpeaking(true)
    try {
      // Use browser's speech synthesis
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      
      setSpeechSynthesis(utterance)
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Speech synthesis error:", error)
      setIsSpeaking(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" })
        await transcribeAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      setAudioChunks(chunks)
      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
      
      toast({
        title: "Recording started",
        description: "Speak your answer clearly",
      })
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice feature",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      const response = await speechToText(audioBlob)
      const transcription = response.transcription
      setCurrentAnswer(transcription)
      
      // Automatically submit the answer
      await submitAnswerToAPI(transcription)
    } catch (error: any) {
      toast({
        title: "Transcription failed",
        description: "Please type your answer instead",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const submitAnswerToAPI = async (answer: string = currentAnswer) => {
    if (!answer.trim()) {
      toast({
        title: "Empty answer",
        description: "Please provide an answer",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    
    // Add user's answer to messages
    setMessages(prev => [...prev, { type: "answer", content: answer, timestamp: new Date() }])

    try {
      const response = await submitAnswer({
        session_id: sessionId,
        answer: answer,
      })

      if (response.success) {
        const responseToAnswer = response.data.response_to_answer
        const nextQuestion = response.data.next_question
        
        // First, add AI's contextual response to answer
        if (responseToAnswer) {
          setMessages(prev => [...prev, { 
            type: "response", 
            content: responseToAnswer, 
            timestamp: new Date() 
          }])
          
          // Speak the contextual response
          await speakText(responseToAnswer)
          
          // Small delay before showing next question
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
        
        // Then add AI's next question to messages
        setMessages(prev => [...prev, { 
          type: "question", 
          content: nextQuestion, 
          timestamp: new Date() 
        }])
        setCurrentQuestion(nextQuestion)
        setCurrentAnswer("")
        
        // Speak the next question
        if (responseToAnswer) {
          // If we spoke the response, wait a bit before next question
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        await speakText(nextQuestion)
        
        toast({
          title: "Answer evaluated",
          description: `Score: ${response.data.evaluation.overall_score.toFixed(1)}/10`,
        })
      } else {
        throw new Error("Failed to submit answer")
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.response?.data?.error || error.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEndInterview = async () => {
    try {
      // Stop all speech immediately
      stopAllSpeech()
      
      // Call backend to stop speech
      try {
        await stopSpeech(sessionId)
      } catch (error) {
        console.error("Failed to stop speech on backend:", error)
      }
      
      // End the interview
      const response = await endInterview(sessionId)
      
      if (response.success) {
        onEnd(response.data.report)
      } else {
        throw new Error("Failed to end interview")
      }
    } catch (error: any) {
      toast({
        title: "Failed to end interview",
        description: error.response?.data?.error || error.message || "Please try again",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full flex">
      {/* Left: AI Character */}
      <div className="w-1/3 border-r flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-transparent">
        <AICharacter isSpeaking={isSpeaking} isListening={isRecording} />
        <div className="text-center mt-6 px-6">
          <h3 className="text-lg font-semibold mb-2">Aria - Your AI Interviewer</h3>
          <p className="text-sm text-muted-foreground">
            {isSpeaking ? "Speaking..." : isRecording ? "Listening..." : "Ready to listen"}
          </p>
        </div>
      </div>

      {/* Right: Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === "answer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.type === "answer"
                    ? "bg-primary text-primary-foreground"
                    : message.type === "response"
                    ? "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  {(message.type === "question" || message.type === "response") && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Mic className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      {message.type === "answer" ? "You" : "Aria"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.type === "answer" && (
                    <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-6 space-y-4">
          <Textarea
            placeholder="Type your answer here..."
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isProcessing || isRecording}
          />

          <div className="flex gap-3">
            {/* Voice Button */}
            {!isRecording ? (
              <Button
                size="lg"
                variant="outline"
                onClick={startRecording}
                disabled={isProcessing}
                className="flex-1"
              >
                <Mic className="w-5 h-5 mr-2" />
                Record Answer
              </Button>
            ) : (
              <Button
                size="lg"
                variant="destructive"
                onClick={stopRecording}
                className="flex-1"
              >
                <MicOff className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}

            {/* Submit Button */}
            <Button
              size="lg"
              onClick={() => submitAnswerToAPI()}
              disabled={isProcessing || isRecording || !currentAnswer.trim()}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Answer
                </>
              )}
            </Button>

            {/* End Interview */}
            <Button
              size="lg"
              variant="destructive"
              onClick={handleEndInterview}
              disabled={isProcessing || isRecording}
            >
              <StopCircle className="w-5 h-5 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
