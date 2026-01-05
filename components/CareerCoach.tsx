'use client'

import { CopilotPopup } from "@copilotkit/react-ui"
import { ReactNode } from "react"
import "@copilotkit/react-ui/styles.css"

interface CareerCoachProps {
  children: ReactNode
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

Format results nicely with job title, company, location, and any links.`}
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
