import { VoiceWidget } from '@/components/VoiceWidget'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Fractional Quest | AI Career Advisor for Part-Time Executive Roles",
  description: "Find fractional CFO, CMO, CTO and other part-time executive opportunities with our AI-powered voice assistant.",
  keywords: ["fractional executive", "part-time CFO", "fractional CMO", "fractional CTO", "executive jobs", "portfolio career"],
}

export default function HomePage() {
  return (
    <div className="bg-white text-black">
      {/* Hero Section - Voice First */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 text-center">
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-white">
            Fractional Quest
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-2xl mx-auto">
            Your AI career advisor for part-time executive roles
          </p>
          <p className="text-md text-slate-300 mb-12 max-w-xl mx-auto">
            Find CFO, CMO, CTO, and other fractional opportunities with voice-powered search
          </p>

          {/* Voice Widget */}
          <VoiceWidget />

          {/* Quick Search Suggestions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="text-slate-400 text-sm mr-2">Try asking:</span>
            <span className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
              "Show me CFO roles in London"
            </span>
            <span className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
              "Remote CMO opportunities"
            </span>
            <span className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
              "What CTO jobs are available?"
            </span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">200+</p>
              <p className="text-sm text-gray-500 mt-1">Active Roles</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">11</p>
              <p className="text-sm text-gray-500 mt-1">Executive Titles</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">UK</p>
              <p className="text-sm text-gray-500 mt-1">& Remote</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Types */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Explore by Role</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { title: 'CFO', desc: 'Chief Financial Officer', icon: '💰' },
              { title: 'CMO', desc: 'Chief Marketing Officer', icon: '📈' },
              { title: 'CTO', desc: 'Chief Technology Officer', icon: '💻' },
              { title: 'COO', desc: 'Chief Operating Officer', icon: '⚙️' },
              { title: 'CHRO', desc: 'Chief HR Officer', icon: '👥' },
              { title: 'CRO', desc: 'Chief Revenue Officer', icon: '🎯' },
              { title: 'CISO', desc: 'Chief Security Officer', icon: '🔒' },
              { title: 'More', desc: 'Browse all roles', icon: '🔍' },
            ].map((role) => (
              <div
                key={role.title}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              >
                <span className="text-2xl mb-2 block">{role.icon}</span>
                <h3 className="font-bold text-lg">{role.title}</h3>
                <p className="text-sm text-gray-500">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🎤</span>
              </div>
              <h3 className="font-bold mb-2">1. Talk to Our AI</h3>
              <p className="text-sm text-gray-600">
                Tell us what you're looking for - role type, location, remote preference
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="font-bold mb-2">2. Get Matched</h3>
              <p className="text-sm text-gray-600">
                Our AI searches 200+ fractional roles to find the best matches
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">✅</span>
              </div>
              <h3 className="font-bold mb-2">3. Apply Direct</h3>
              <p className="text-sm text-gray-600">
                Apply directly to opportunities that match your expertise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-6">About Fractional Quest</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            We help experienced executives find part-time, fractional opportunities at growing companies.
            Whether you're looking to build a portfolio career or add a new engagement,
            our AI-powered search makes it easy to find the right role.
          </p>
          <p className="text-sm text-slate-500">
            Built for the modern executive workforce
          </p>
        </div>
      </section>
    </div>
  )
}
