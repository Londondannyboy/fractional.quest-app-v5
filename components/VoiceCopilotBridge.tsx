'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core'
import { useVoiceContext, useVoiceTranscript } from '@/context/VoiceContext'
import { A2UIRenderer, parseA2UIResponse } from './A2UIRenderer'

// Job intent detection patterns
const JOB_ROLE_PATTERNS = /\b(CFO|CMO|CTO|COO|CHRO|CRO|CISO|CPO|CEO|chief|executive|officer)\b/i
const JOB_ACTION_PATTERNS = /\b(job|jobs|role|roles|position|positions|opportunity|opportunities|hiring|career|work)\b/i
const JOB_SEARCH_PATTERNS = /\b(show|find|search|look|looking|get|give|list|display)\b/i
const STATS_PATTERNS = /\b(how many|count|number|total|stats|statistics|market|trend|trending|overview)\b/i

interface JobIntent {
  hasJobIntent: boolean
  hasStatsIntent: boolean
  role?: string
  location?: string
  isRemote?: boolean
}

function detectJobIntent(text: string): JobIntent {
  const lowerText = text.toLowerCase()

  // Check for stats/trends queries
  const hasStatsIntent = STATS_PATTERNS.test(lowerText)

  // Check for job-related queries
  const hasRoleMatch = JOB_ROLE_PATTERNS.test(text)
  const hasActionMatch = JOB_ACTION_PATTERNS.test(lowerText)
  const hasSearchMatch = JOB_SEARCH_PATTERNS.test(lowerText)

  const hasJobIntent = (hasRoleMatch && hasActionMatch) || (hasSearchMatch && (hasRoleMatch || hasActionMatch))

  // Extract role
  const roleMatch = text.match(/\b(CFO|CMO|CTO|COO|CHRO|CRO|CISO|CPO|CEO)\b/i)
  const role = roleMatch ? roleMatch[1].toUpperCase() : undefined

  // Extract location
  const locationMatch = text.match(/\b(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  const location = locationMatch ? locationMatch[1] : undefined

  // Check for remote
  const isRemote = /\bremote\b/i.test(lowerText)

  return { hasJobIntent, hasStatsIntent, role, location, isRemote }
}

// Debounce hook
function useDebounce(
  callback: (query: string) => void,
  delay: number
): (query: string) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(query)
      }, delay)
    },
    [delay]
  )

  return debouncedCallback
}

export function VoiceCopilotBridge() {
  const { messages, lastUserQuery, isConnected, lastJobQuery, setLastJobQuery } = useVoiceContext()
  const transcript = useVoiceTranscript()
  const processedQueriesRef = useRef<Set<string>>(new Set())

  // Make voice transcript readable by CopilotKit
  useCopilotReadable({
    description: 'Current voice conversation transcript with the career advisor',
    value: transcript || 'No conversation yet',
  })

  // Note: Backend already has search_jobs and get_job_stats actions.
  // The A2UI JSON in responses will be parsed and rendered by the
  // CareerCoach component's message renderer.

  // Detect job intent from voice and track for CopilotKit
  const processVoiceQuery = useDebounce((query: string) => {
    if (!query || processedQueriesRef.current.has(query)) return

    const intent = detectJobIntent(query)

    if (intent.hasJobIntent || intent.hasStatsIntent) {
      processedQueriesRef.current.add(query)
      setLastJobQuery({ query, timestamp: Date.now() })

      // Log for debugging
      console.log('[VoiceCopilotBridge] Detected job intent:', intent)
    }
  }, 300)

  // Watch for new user queries
  useEffect(() => {
    if (lastUserQuery && isConnected) {
      processVoiceQuery(lastUserQuery)
    }
  }, [lastUserQuery, isConnected, processVoiceQuery])

  // Clear processed queries when disconnected
  useEffect(() => {
    if (!isConnected) {
      processedQueriesRef.current.clear()
    }
  }, [isConnected])

  // This component doesn't render anything visible
  // It just bridges voice context to CopilotKit
  return null
}
