"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic, MicOff, Video, VideoOff, Users, Eraser, Pen, Square, Circle, Type, Image as ImageIcon, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  user: string
  avatar: string
  text: string
  timestamp: Date
  reactions?: string[]
}

export function DiscussionPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      user: "User A",
      avatar: "",
      text: "Hey, I'm got bfs problem, what is it shamlal last of how about rsluux?",
      timestamp: new Date(Date.now() - 300000),
      reactions: []
    },
    {
      id: "2",
      user: "User B",
      avatar: "",
      text: "I've anticipating nser hsiuou voice grending to purchase as and great problems",
      timestamp: new Date(Date.now() - 240000),
      reactions: ["👍"]
    },
    {
      id: "3",
      user: "User A",
      avatar: "",
      text: "Hey, I'm melting of lenastly what will I orually know the questions are asd chat?",
      timestamp: new Date(Date.now() - 180000),
      reactions: []
    },
    {
      id: "4",
      user: "User A",
      avatar: "",
      text: "Hi there's a great resulting frombix 😊",
      timestamp: new Date(Date.now() - 120000),
      reactions: []
    }
  ])
  const [newMessage, setNewMessage] = useState("")
  const [isMicOn, setIsMicOn] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false)
  const [activeTool, setActiveTool] = useState<string>("pen")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      user: user?.displayName || user?.email?.split("@")[0] || "You",
      avatar: user?.photoURL || "",
      text: newMessage,
      timestamp: new Date(),
      reactions: []
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Canvas drawing functionality
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : "#000000"
    ctx.lineWidth = activeTool === "eraser" ? 20 : 2
    ctx.lineCap = "round"
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="size-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Discussion Room</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Discussion room college amotional online in four students
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4 h-[calc(100vh-220px)]">
        {/* Left Sidebar - Discussion Chat */}
        <div className="rounded-xl border border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Discussion Chat</h3>
            <div className="mt-2 h-1 w-24 bg-primary rounded-full" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={msg.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {msg.user.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{msg.user}</span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">{msg.text}</p>
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {msg.reactions.map((reaction, i) => (
                        <span key={i} className="text-xs">{reaction}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-secondary/50"
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Brainstorming Canvas */}
        <div className="rounded-xl border-2 border-primary bg-card flex flex-col">
          {/* Toolbar */}
          <div className="p-3 border-b border-border bg-secondary/30">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={activeTool === "pen" ? "default" : "ghost"}
                onClick={() => setActiveTool("pen")}
                className="h-8 w-8 p-0"
              >
                <Pen className="size-4" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === "eraser" ? "default" : "ghost"}
                onClick={() => setActiveTool("eraser")}
                className="h-8 w-8 p-0"
              >
                <Eraser className="size-4" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === "text" ? "default" : "ghost"}
                onClick={() => setActiveTool("text")}
                className="h-8 w-8 p-0"
              >
                <Type className="size-4" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === "square" ? "default" : "ghost"}
                onClick={() => setActiveTool("square")}
                className="h-8 w-8 p-0"
              >
                <Square className="size-4" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === "circle" ? "default" : "ghost"}
                onClick={() => setActiveTool("circle")}
                className="h-8 w-8 p-0"
              >
                <Circle className="size-4" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === "image" ? "default" : "ghost"}
                onClick={() => setActiveTool("image")}
                className="h-8 w-8 p-0"
              >
                <ImageIcon className="size-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCanvas}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-full bg-white rounded-lg cursor-crosshair shadow-sm"
            />
          </div>
        </div>

        {/* Right Sidebar - Voice & Tools */}
        <div className="rounded-xl border border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Voice & Tools</h3>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {/* Voice Controls */}
            <div className="flex justify-center gap-4">
              <Button
                size="icon"
                variant={isMicOn ? "default" : "outline"}
                onClick={() => setIsMicOn(!isMicOn)}
                className={cn("size-12 rounded-full", isMicOn && "bg-primary")}
              >
                {isMicOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="size-12 rounded-full"
              >
                <MicOff className="size-5" />
              </Button>
            </div>

            {/* Volume Controls */}
            <div className="flex justify-center gap-4">
              <Button size="icon" variant="outline" className="size-10 rounded-full">
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </Button>
              <Button size="icon" variant="outline" className="size-10 rounded-full">
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </Button>
            </div>

            {/* Brainstorming Canvas Button */}
            <Button className="w-full" variant="default">
              Brainstorming Canvas
            </Button>

            {/* Video Call Button */}
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              <Video className="size-4 mr-2" />
              Video Call
            </Button>

            {/* Video Participants */}
            <div className="space-y-3 mt-6">
              <div className="aspect-video rounded-lg bg-secondary/50 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Users className="size-8" />
                </div>
              </div>
              <div className="aspect-video rounded-lg bg-secondary/50 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Users className="size-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
