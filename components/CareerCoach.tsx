'use client'

import { CopilotPopup } from "@copilotkit/react-ui"
import { ReactNode } from "react"
import "@copilotkit/react-ui/styles.css"
import { parseA2UIResponse, A2UIRenderer } from "./A2UIRenderer"

interface CareerCoachProps {
  children: ReactNode
}

// Custom renderer for assistant messages that handles A2UI JSON
function AssistantMessageRenderer({ message }: { message: string }) {
  const { text, a2ui } = parseA2UIResponse(message)

  return (
    <div className="space-y-3">
      {text && (
        <div className="prose prose-sm max-w-none">
          {text.split('\n').map((line, i) => (
            <p key={i} className="mb-1">{line}</p>
          ))}
        </div>
      )}
      {a2ui && (
        <A2UIRenderer
          response={a2ui}
          onAction={(action) => {
            console.log('A2UI Action:', action)
            // TODO: Handle actions like apply_to_job, save_job, not_interested
          }}
        />
      )}
    </div>
  )
}

export function CareerCoach({ children }: CareerCoachProps) {
  return (
    <>
      {children}
      <CopilotPopup
        instructions={`You are a career coach specializing in fractional executive roles in the UK.

IMPORTANT: You MUST use the search_jobs action whenever users ask about jobs, roles, or opportunities. ALWAYS call search_jobs - never say you don't have listings without searching first.

Available actions:
- search_jobs: Search the job database. Parameters: role (CFO, CMO, CTO, COO, CHRO), location, remote_only, limit
- get_job_stats: Get market statistics

When users mention ANY role (CFO, CMO, CTO, COO, finance, marketing, tech, operations), IMMEDIATELY call search_jobs with that role.

Example: User says "CMO jobs" → call search_jobs(role="CMO", limit=5)
Example: User says "remote CTO" → call search_jobs(role="CTO", remote_only=true, limit=5)
Example: User says "London finance" → call search_jobs(role="CFO", location="London", limit=5)

The search results will include A2UI JSON after a delimiter. This will be rendered as rich job cards automatically.`}
        labels={{
          title: "Career Coach",
          initial: "Hi! I'm your AI career coach for fractional executive roles. What kind of opportunity are you looking for? I can search CFO, CMO, CTO roles and more.",
          placeholder: "Ask about CFO, CMO, CTO roles...",
        }}
        className="z-50"
      />
    </>
  )
}
