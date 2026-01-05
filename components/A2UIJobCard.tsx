'use client'

import { useState } from 'react'

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

interface A2UIJobCardProps {
  title: string
  subtitle?: string
  description?: string
  badges?: A2UIBadge[]
  url?: string
  actions?: A2UIAction[]
  onAction?: (action: A2UIAction) => void
}

const badgeStyles: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
}

const buttonStyles: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-500 hover:bg-gray-100',
}

export function A2UIJobCard({
  title,
  subtitle,
  description,
  badges = [],
  url,
  actions = [],
  onAction,
}: A2UIJobCardProps) {
  const [actionState, setActionState] = useState<string | null>(null)

  const handleAction = (action: A2UIAction) => {
    setActionState(action.name)
    onAction?.(action)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header with company initial */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0">
          {subtitle?.split(' - ')[0]?.charAt(0) || title.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-gray-700">{description}</p>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {badges.map((badge, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                badgeStyles[badge.variant || 'info']
              }`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Details
          </a>
        )}

        {actions.map((action) => {
          const isActive = actionState === action.name
          const style = buttonStyles[action.variant || 'secondary']

          // Special styling for active states
          if (isActive && action.name === 'save_job') {
            return (
              <button
                key={action.name}
                disabled
                className="px-4 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700"
              >
                Saved
              </button>
            )
          }

          if (isActive && action.name === 'not_interested') {
            return (
              <button
                key={action.name}
                disabled
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-400"
              >
                Skipped
              </button>
            )
          }

          return (
            <button
              key={action.name}
              onClick={() => handleAction(action)}
              disabled={actionState !== null}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${style} ${
                actionState ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
