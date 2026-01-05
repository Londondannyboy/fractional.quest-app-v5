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
        instructions="You are a helpful career coach for fractional executive roles. When users ask about jobs, use the get_job_count action to check how many jobs are available. Be friendly and helpful."
        labels={{
          title: "Career Coach",
          initial: "Hi! I'm your career coach. Ask me about fractional executive roles!",
          placeholder: "Ask me anything...",
        }}
        className="z-50"
      />
    </>
  )
}
