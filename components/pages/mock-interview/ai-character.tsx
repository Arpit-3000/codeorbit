"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface AICharacterProps {
  isSpeaking: boolean
  isListening: boolean
}

export function AICharacter({ isSpeaking, isListening }: AICharacterProps) {
  return (
    <div className="relative w-64 h-64">
      {/* Outer Ring - Pulsing effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{
          scale: isSpeaking || isListening ? [1, 1.2, 1] : 1,
          opacity: isSpeaking || isListening ? [0.3, 0.6, 0.3] : 0.3,
        }}
        transition={{
          duration: 2,
          repeat: isSpeaking || isListening ? Infinity : 0,
          ease: "easeInOut",
        }}
      />

      {/* Middle Ring */}
      <motion.div
        className="absolute inset-8 rounded-full bg-primary/20"
        animate={{
          scale: isSpeaking || isListening ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: isSpeaking || isListening ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />

      {/* Avatar Container */}
      <motion.div
        className="absolute inset-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-2xl"
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : isListening ? [1, 0.95, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: (isSpeaking || isListening) ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Face */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Eyes */}
          <div className="absolute top-1/3 flex gap-8">
            <motion.div
              className="w-4 h-4 rounded-full bg-white"
              animate={{
                scaleY: isSpeaking ? [1, 0.2, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                repeat: isSpeaking ? Infinity : 0,
                repeatDelay: 2,
              }}
            />
            <motion.div
              className="w-4 h-4 rounded-full bg-white"
              animate={{
                scaleY: isSpeaking ? [1, 0.2, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                repeat: isSpeaking ? Infinity : 0,
                repeatDelay: 2,
              }}
            />
          </div>

          {/* Mouth */}
          <motion.div
            className="absolute bottom-1/3"
            animate={{
              scaleX: isSpeaking ? [1, 1.3, 1, 1.2, 1] : 1,
              scaleY: isSpeaking ? [1, 0.8, 1.2, 0.9, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isSpeaking ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            <div className="w-12 h-8 rounded-full border-2 border-white" />
          </motion.div>

          {/* Microphone Icon (when listening) */}
          {isListening && (
            <motion.div
              className="absolute -bottom-4 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Sound Waves (when speaking) */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-primary"
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{
                width: [0, 280, 320],
                height: [0, 280, 320],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        <motion.div
          className="w-3 h-3 rounded-full bg-primary"
          animate={{
            opacity: isSpeaking ? [0.3, 1, 0.3] : isListening ? [0.3, 1, 0.3] : 0.3,
          }}
          transition={{
            duration: 1,
            repeat: (isSpeaking || isListening) ? Infinity : 0,
          }}
        />
        <motion.div
          className="w-3 h-3 rounded-full bg-primary"
          animate={{
            opacity: isSpeaking ? [0.3, 1, 0.3] : isListening ? [0.3, 1, 0.3] : 0.3,
          }}
          transition={{
            duration: 1,
            repeat: (isSpeaking || isListening) ? Infinity : 0,
            delay: 0.2,
          }}
        />
        <motion.div
          className="w-3 h-3 rounded-full bg-primary"
          animate={{
            opacity: isSpeaking ? [0.3, 1, 0.3] : isListening ? [0.3, 1, 0.3] : 0.3,
          }}
          transition={{
            duration: 1,
            repeat: (isSpeaking || isListening) ? Infinity : 0,
            delay: 0.4,
          }}
        />
      </div>
    </div>
  )
}
