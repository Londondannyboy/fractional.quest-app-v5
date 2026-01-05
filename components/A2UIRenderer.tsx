'use client'

import { ReactNode } from 'react'
import { A2UIJobCard } from './A2UIJobCard'
import { A2UIChart } from './A2UIChart'

// A2UI delimiter used by the backend
const A2UI_DELIMITER = '---a2ui_JSON---'

// Types for A2UI components
interface A2UIAction {
  name: string
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  data?: Record<string, unknown>
}

interface A2UIBadge {
  label: string
  variant?: 'success' | 'info' | 'warning' | 'error'
}

interface A2UICardProps {
  title: string
  subtitle?: string
  description?: string
  badges?: A2UIBadge[]
  url?: string
}

interface A2UIChartProps {
  type: 'bar' | 'line' | 'pie'
  title: string
  data: Array<{ label: string; value: number }>
  xLabel?: string
  yLabel?: string
}

interface A2UISurfaceUpdate {
  id: string
  component: 'Card' | 'Chart' | 'Text' | 'Button' | 'Timeline'
  props: A2UICardProps | A2UIChartProps | Record<string, unknown>
  actions?: A2UIAction[]
}

interface A2UIMessage {
  surfaceUpdate?: A2UISurfaceUpdate
  dataModelUpdate?: Record<string, unknown>
  beginRendering?: boolean
  deleteSurface?: string
}

interface A2UIResponse {
  components: A2UIMessage[]
}

// Parse A2UI JSON from agent response
export function parseA2UIResponse(response: string): { text: string; a2ui: A2UIResponse | null } {
  if (!response.includes(A2UI_DELIMITER)) {
    return { text: response, a2ui: null }
  }

  const [textPart, jsonPart] = response.split(A2UI_DELIMITER)

  try {
    const a2ui = JSON.parse(jsonPart.trim()) as A2UIResponse
    return { text: textPart.trim(), a2ui }
  } catch (e) {
    console.error('Failed to parse A2UI JSON:', e)
    return { text: response, a2ui: null }
  }
}

// Action handler type
type ActionHandler = (action: A2UIAction) => void

// Render a single A2UI component
function renderA2UIComponent(
  message: A2UIMessage,
  onAction?: ActionHandler
): ReactNode {
  if (!message.surfaceUpdate) return null

  const { component, props, actions, id } = message.surfaceUpdate

  switch (component) {
    case 'Card':
      return (
        <A2UIJobCard
          key={id}
          {...(props as A2UICardProps)}
          actions={actions}
          onAction={onAction}
        />
      )

    case 'Chart':
      return (
        <A2UIChart
          key={id}
          {...(props as A2UIChartProps)}
        />
      )

    case 'Text':
      return (
        <div key={id} className="text-gray-700">
          {(props as { content?: string }).content}
        </div>
      )

    default:
      console.warn(`Unknown A2UI component: ${component}`)
      return null
  }
}

// Main A2UI Renderer component
interface A2UIRendererProps {
  response: A2UIResponse
  onAction?: ActionHandler
  className?: string
}

export function A2UIRenderer({ response, onAction, className = '' }: A2UIRendererProps) {
  if (!response?.components?.length) return null

  return (
    <div className={`a2ui-container space-y-3 ${className}`}>
      {response.components.map((message, index) => (
        <div key={message.surfaceUpdate?.id || index}>
          {renderA2UIComponent(message, onAction)}
        </div>
      ))}
    </div>
  )
}

// Hook to use A2UI in CopilotKit responses
export function useA2UIParser() {
  const parseResponse = (response: string) => parseA2UIResponse(response)

  return { parseResponse }
}
