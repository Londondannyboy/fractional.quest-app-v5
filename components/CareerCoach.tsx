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

You have access to a database of 274 fractional and executive jobs. When users ask about jobs, use the search_jobs tool to find relevant opportunities.

Help users:
1. Discover fractional CFO, CMO, CTO, and other C-suite opportunities
2. Search for jobs by role, location, or remote preference
3. Provide career coaching and application advice

Be warm, professional, and encouraging. When showing job results, format them clearly with title, company, location, and link.`}
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
