'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { VoiceProvider, useVoice } from '@humeai/voice-react'
import { authClient } from '@/lib/auth/client'
import { useVoiceContext } from '@/context/VoiceContext'

function VoiceInterface({ accessToken }: { accessToken: string }) {
  const { connect, disconnect, status, messages, isPlaying } = useVoice()
  const { data: session } = authClient.useSession()
  const user = session?.user || null
  const [manualConnected, setManualConnected] = useState(false)
  const [waveHeights, setWaveHeights] = useState<number[]>([])

  // Connect to shared voice context
  const { addMessage, setIsConnected } = useVoiceContext()
  const lastMessageCountRef = useRef(0)

  useEffect(() => {
    if (status.value === 'connected') {
      setManualConnected(true)
      setIsConnected(true)
    }
    if (status.value === 'disconnected') {
      setManualConnected(false)
      setIsConnected(false)
    }
  }, [status.value, setIsConnected])

  // Sync Hume messages to VoiceContext
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // Process new messages
      const newMessages = messages.slice(lastMessageCountRef.current)
      newMessages.forEach((msg: any) => {
        if (msg.type === 'user_message' || msg.type === 'assistant_message') {
          const content = msg.message?.content || ''
          if (content) {
            addMessage(msg.type as 'user_message' | 'assistant_message', content)
          }
        }
      })
      lastMessageCountRef.current = messages.length
    }
  }, [messages, addMessage])

  // Waveform animation
  useEffect(() => {
    if (status.value === 'connected') {
      const interval = setInterval(() => {
        setWaveHeights([...Array(40)].map(() => 20 + Math.random() * 80))
      }, 150)
      return () => clearInterval(interval)
    } else {
      setWaveHeights([...Array(40)].map((_, i) => 20 + Math.sin(i * 0.5) * 15))
    }
  }, [status.value])

  const handleConnect = useCallback(async () => {
    if (!accessToken) return

    const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID

    // Extract first name from authenticated user
    const extractFirstName = (displayName: string | null | undefined): string | null => {
      if (!displayName) return null
      if (displayName.includes('@')) return null
      const firstName = displayName.split(/[\s.]+/)[0]
      if (!firstName || firstName.length < 2 || firstName.length > 20) return null
      if (!/^[A-Za-z]+$/.test(firstName)) return null
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
    }

    const firstName = extractFirstName(user?.name)
    const sessionIdWithName = firstName
      ? `${firstName}|${user?.id || 'anon'}_${Date.now()}`
      : `${user?.id || 'anon'}_${Date.now()}`

    const systemPrompt = `USER_CONTEXT:
${firstName ? `name: ${firstName}` : 'name: unknown'}
status: ${user ? 'authenticated' : 'guest'}

You are a fractional career advisor. Help users find part-time executive opportunities.
${firstName ? `Greet ${firstName} warmly.` : 'Greet the user warmly.'}`

    try {
      await connect({
        auth: { type: 'accessToken' as const, value: accessToken },
        configId: configId,
        sessionSettings: {
          type: 'session_settings' as const,
          systemPrompt,
          customSessionId: sessionIdWithName,
        }
      })
      setManualConnected(true)
    } catch (e: any) {
      console.error('[FQ] Connect error:', e?.message || e)
      setManualConnected(false)
    }
  }, [connect, accessToken, user])

  const handleDisconnect = useCallback(async () => {
    disconnect()
    setManualConnected(false)
  }, [disconnect])

  const isConnected = status.value === 'connected' || manualConnected
  const isConnecting = status.value === 'connecting' && !manualConnected
  const isError = status.value === 'error'

  return (
    <div className="flex flex-col items-center">
      {/* Microphone Button */}
      <div className="relative mb-8">
        {/* Active pulse when connected */}
        {isConnected && (
          <div
            className="absolute inset-0 rounded-full animate-[ping_2s_ease-in-out_infinite]"
            style={{
              border: '3px solid rgba(59, 130, 246, 0.3)',
              transform: 'scale(1.2)',
            }}
          />
        )}

        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isConnecting}
          className={`relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center transition-all duration-300 ${
            isConnected
              ? 'bg-blue-600 shadow-2xl hover:bg-blue-700'
              : isConnecting
              ? 'bg-gray-300 cursor-wait'
              : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-xl'
          }`}
          aria-label={isConnected ? "End conversation" : "Start voice conversation"}
        >
          {isConnecting ? (
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg
              className={`w-16 h-16 md:w-20 md:h-20 text-white ${isPlaying ? 'animate-pulse' : ''}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {isConnected ? (
                <rect x="6" y="6" width="12" height="12" rx="2" />
              ) : (
                <>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </>
              )}
            </svg>
          )}
        </button>
      </div>

      {/* Action Button */}
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={`px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 mb-6 ${
          isConnected
            ? 'bg-red-500 text-white hover:bg-red-600'
            : isConnecting
            ? 'bg-gray-200 text-gray-500 cursor-wait'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isConnecting ? 'Connecting...' : isConnected ? 'End Conversation' : 'Start Voice Search'}
      </button>

      {/* Waveform Animation */}
      <div className="flex items-center justify-center gap-[3px] h-16 w-64 mb-6">
        {waveHeights.map((height, i) => (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-all duration-100 ${
              isPlaying
                ? 'bg-white'
                : isConnected
                ? 'bg-white/80'
                : 'bg-white/50'
            }`}
            style={{
              height: `${isPlaying ? Math.min(height * 1.3, 100) : height}%`,
              transition: isPlaying ? 'all 0.05s ease-out' : 'all 0.1s ease-out'
            }}
          />
        ))}
      </div>

      {/* Status Text */}
      <p className={`text-lg font-medium mb-6 text-center ${
        isPlaying ? 'text-white' : 'text-white/80'
      }`}>
        {isConnecting
          ? "Connecting to your career advisor..."
          : isConnected
          ? isPlaying
            ? "Speaking..."
            : "Listening... Ask about CFO, CMO, or CTO roles"
          : isError
          ? "Connection lost — tap to reconnect"
          : "Tap to find fractional opportunities"}
      </p>

      {/* Transcript - Simple version */}
      {isConnected && messages.length > 0 && (
        <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-lg p-4 max-h-48 overflow-y-auto">
          {messages
            .filter((m: any) => m.type === 'user_message' || m.type === 'assistant_message')
            .slice(-6)
            .map((msg: any, i) => {
              const content = msg.message?.content || ''
              if (!content) return null
              const isUser = msg.type === 'user_message'
              return (
                <div key={i} className={`mb-2 text-sm ${isUser ? 'text-blue-200' : 'text-white'}`}>
                  <span className="font-medium">{isUser ? 'You: ' : 'Advisor: '}</span>
                  <span className="opacity-90">{content.substring(0, 200)}...</span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

export function VoiceWidget() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: session, isPending: authLoading } = authClient.useSession()

  useEffect(() => {
    // Only fetch Hume token if user is authenticated
    if (!session?.user) return

    async function getAccessToken() {
      try {
        const response = await fetch('/api/hume-token')
        if (!response.ok) throw new Error('Failed to get access token')
        const data = await response.json()
        setAccessToken(data.accessToken)
      } catch (err) {
        setError('Voice service unavailable. Please try again later.')
        console.error('Error getting Hume token:', err)
      }
    }
    getAccessToken()
  }, [session?.user])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300">Loading...</p>
      </div>
    )
  }

  // Require sign-in
  if (!session?.user) {
    return (
      <div className="text-center py-16">
        <div className="w-32 h-32 mx-auto mb-8 bg-slate-700/50 rounded-full flex items-center justify-center">
          <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          Sign in to use voice search
        </h2>
        <p className="text-slate-300 mb-8 max-w-md mx-auto">
          Create a free account to chat with our AI career advisor about fractional executive opportunities.
        </p>

        <a
          href="/auth/sign-in"
          className="inline-block px-8 py-4 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors"
        >
          Sign in to continue
        </a>

        <p className="text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <a href="/auth/sign-up" className="underline hover:text-white">
            Sign up free
          </a>
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-300">{error}</p>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="text-center py-20">
        <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300">Loading voice assistant...</p>
      </div>
    )
  }

  return (
    <VoiceProvider
      onError={(err) => console.error('[FQ Error]', err)}
      onClose={(e) => console.warn('[FQ Close]', e?.code, e?.reason)}
    >
      <VoiceInterface accessToken={accessToken} />
    </VoiceProvider>
  )
}
