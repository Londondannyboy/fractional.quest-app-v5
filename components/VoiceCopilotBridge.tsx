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

  // Register search_jobs action with A2UI rendering
  useCopilotAction({
    name: 'search_jobs',
    description: 'Search for fractional executive jobs and display as cards',
    parameters: [
      { name: 'role', type: 'string', description: 'Job role (CFO, CMO, etc.)', required: false },
      { name: 'location', type: 'string', description: 'Job location', required: false },
      { name: 'remote_only', type: 'boolean', description: 'Remote only', required: false },
      { name: 'limit', type: 'number', description: 'Max results', required: false },
    ],
    render: ({ status, args, result }) => {
      if (status === 'inProgress') {
        return (
          <div className="p-4 bg-blue-50 rounded-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-700">
                Searching for {args?.role || 'executive'} opportunities...
              </span>
            </div>
          </div>
        )
      }

      if (status === 'complete' && result) {
        const { text, a2ui } = parseA2UIResponse(result as string)

        return (
          <div className="space-y-3">
            {text && <p className="text-gray-700">{text}</p>}
            {a2ui && (
              <A2UIRenderer
                response={a2ui}
                onAction={(action) => {
                  console.log('Job action:', action)
                  // Handle actions like save_job, not_interested
                }}
              />
            )}
          </div>
        )
      }

      return <></>
    },
  })

  // Register get_job_stats action with A2UI chart rendering
  useCopilotAction({
    name: 'get_job_stats',
    description: 'Get job market statistics and display as charts',
    parameters: [],
    render: ({ status, result }) => {
      if (status === 'inProgress') {
        return (
          <div className="p-4 bg-purple-50 rounded-lg animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-purple-700">Loading market statistics...</span>
            </div>
          </div>
        )
      }

      if (status === 'complete' && result) {
        const { text, a2ui } = parseA2UIResponse(result as string)

        return (
          <div className="space-y-3">
            {text && <p className="text-gray-700 whitespace-pre-line">{text}</p>}
            {a2ui && <A2UIRenderer response={a2ui} />}
          </div>
        )
      }

      return <></>
    },
  })

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
