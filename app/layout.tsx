import type { Metadata } from "next"
import "./globals.css"
import { authClient } from '@/lib/auth/client'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui'
import { CopilotProvider } from '@/components/CopilotProvider'
import { CareerCoach } from '@/components/CareerCoach'
import { VoiceContextProvider } from '@/context/VoiceContext'
import { VoiceCopilotBridge } from '@/components/VoiceCopilotBridge'

export const metadata: Metadata = {
  title: "Fractional Quest | Find Part-Time Executive Roles",
  description: "Discover fractional executive opportunities - CFO, CMO, CTO and more. AI-powered career advisor for part-time executive roles in the UK.",
  keywords: ["fractional executive", "part-time CFO", "fractional CMO", "fractional CTO", "executive jobs UK"],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    title: "Fractional Quest | Find Part-Time Executive Roles",
    description: "AI-powered career advisor for fractional executive opportunities",
    siteName: "Fractional Quest",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-gray-900" suppressHydrationWarning>
        <NeonAuthUIProvider
          authClient={authClient}
          redirectTo="/"
          social={{ providers: ['google'] }}
        >
          <VoiceContextProvider>
            <CopilotProvider>
              <CareerCoach>
                <VoiceCopilotBridge />
                <main className="flex-1">
                  {children}
                </main>
              </CareerCoach>
            </CopilotProvider>
          </VoiceContextProvider>
        </NeonAuthUIProvider>
      </body>
    </html>
  )
}
