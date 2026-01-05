'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Voice message type from Hume
interface VoiceMessage {
  type: 'user_message' | 'assistant_message'
  content: string
  timestamp: number
}

// Context type
interface VoiceContextType {
  messages: VoiceMessage[]
  addMessage: (type: VoiceMessage['type'], content: string) => void
  clearMessages: () => void
  isConnected: boolean
  setIsConnected: (connected: boolean) => void
  lastUserQuery: string | null
  setLastUserQuery: (query: string | null) => void
  // For detecting job-related queries
  lastJobQuery: { query: string; timestamp: number } | null
  setLastJobQuery: (query: { query: string; timestamp: number } | null) => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

// Maximum messages to keep in context
const MAX_MESSAGES = 20

interface VoiceContextProviderProps {
  children: ReactNode
}

export function VoiceContextProvider({ children }: VoiceContextProviderProps) {
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUserQuery, setLastUserQuery] = useState<string | null>(null)
  const [lastJobQuery, setLastJobQuery] = useState<{ query: string; timestamp: number } | null>(null)

  const addMessage = useCallback((type: VoiceMessage['type'], content: string) => {
    if (!content.trim()) return

    const newMessage: VoiceMessage = {
      type,
      content: content.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => {
      const updated = [...prev, newMessage]
      // Keep only the last MAX_MESSAGES
      return updated.slice(-MAX_MESSAGES)
    })

    // Track user queries
    if (type === 'user_message') {
      setLastUserQuery(content.trim())
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setLastUserQuery(null)
    setLastJobQuery(null)
  }, [])

  return (
    <VoiceContext.Provider
      value={{
        messages,
        addMessage,
        clearMessages,
        isConnected,
        setIsConnected,
        lastUserQuery,
        setLastUserQuery,
        lastJobQuery,
        setLastJobQuery,
      }}
    >
      {children}
    </VoiceContext.Provider>
  )
}

export function useVoiceContext() {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoiceContext must be used within a VoiceContextProvider')
  }
  return context
}

// Utility hook to get formatted transcript
export function useVoiceTranscript() {
  const { messages } = useVoiceContext()

  const transcript = messages
    .map((m) => `${m.type === 'user_message' ? 'User' : 'Advisor'}: ${m.content}`)
    .join('\n')

  return transcript
}
