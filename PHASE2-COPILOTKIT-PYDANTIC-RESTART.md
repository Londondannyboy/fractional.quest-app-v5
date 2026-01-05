# Fractional Quest Phase 2: CopilotKit + Pydantic AI Career Coach

## Current State (Working)

### Deployed Infrastructure
- **Frontend App**: https://fractional-quest-app.vercel.app
  - GitHub: https://github.com/Londondannyboy/fractional.quest-app-v5
  - Local: `/Users/dankeegan/fractional-quest-app`

- **CLM Backend**: https://fractional-quest-clm.vercel.app
  - GitHub: https://github.com/Londondannyboy/fractional.quest-clm-v5
  - Local: `/Users/dankeegan/fractional-quest-clm`

### Databases
- **Jobs Database**: Neon "Quest" project (calm-sky-93252412)
  - 215 active fractional executive jobs
  - Connection: `ep-green-smoke-ab3vtnw9-pooler.eu-west-2.aws.neon.tech`

- **Auth Database**: Neon "Fractional" project (plain-glade-34229418)
  - Neon Auth with Google provider
  - Connection: `ep-wandering-darkness-abiq57ia`

- **Knowledge Graph**: Zep Cloud
  - Graph ID: `fractional-jobs-graph`
  - User graphs for personalization

### Current Features
- Voice interface via Hume EVI
- Job search via PostgreSQL
- Google Gemini for LLM responses
- Zep knowledge graph enrichment
- Neon Auth for user authentication

---

## Phase 2 Vision: AI Career Coach Platform

### Core Concept
Transform from a simple job search voice assistant into a **full AI career coaching platform** that:
1. Onboards users through conversational discovery
2. Builds a rich profile of their skills, experience, and goals
3. Proactively matches them to relevant opportunities
4. Coaches them through the application process
5. Provides beautiful, interactive visualizations

### Technology Stack

#### CopilotKit (Frontend)
- **Purpose**: Rich interactive UI components that respond to AI actions
- **Features to implement**:
  - `useCopilotReadable` - Share user profile state with AI
  - `useCopilotAction` - AI can update UI, show job cards, trigger modals
  - `CopilotTextarea` - AI-assisted cover letter writing
  - `CopilotSidebar` - Persistent chat with career coach
  - Custom visualizations triggered by AI (skill graphs, job matches, career paths)

#### Pydantic AI (Backend Orchestrator)
- **Purpose**: Structured agent that validates and controls all data flow
- **Features to implement**:
  - `UserProfile` model - Validated user data (skills, experience, preferences)
  - `JobMatch` model - Structured job recommendations with match scores
  - `OnboardingState` model - Track onboarding progress
  - `CareerGoal` model - User's target roles and timeline
  - Agent tools for:
    - `search_jobs` - Query database with filters
    - `update_profile` - Validate and store user info
    - `generate_recommendations` - AI-powered job matching
    - `create_application_draft` - Help with applications

---

## Implementation Plan

### 1. Pydantic AI Agent Architecture

```python
# api/career_agent.py
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from typing import Optional, List
from enum import Enum

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class Skill(BaseModel):
    name: str
    category: str  # finance, marketing, technology, operations, etc.
    level: SkillLevel
    years_experience: Optional[int] = None

class WorkExperience(BaseModel):
    company: str
    role: str
    is_executive: bool
    start_year: int
    end_year: Optional[int] = None  # None = current
    key_achievements: List[str] = []

class JobPreferences(BaseModel):
    target_roles: List[str]  # CFO, CMO, CTO, etc.
    locations: List[str] = []
    remote_preference: Optional[str] = None  # remote, hybrid, onsite
    day_rate_min: Optional[int] = None
    day_rate_max: Optional[int] = None
    industries: List[str] = []
    availability_days_per_week: Optional[int] = None

class UserProfile(BaseModel):
    user_id: str
    name: Optional[str] = None
    skills: List[Skill] = []
    experiences: List[WorkExperience] = []
    preferences: Optional[JobPreferences] = None
    onboarding_complete: bool = False
    onboarding_step: int = 0

class JobMatch(BaseModel):
    job_id: str
    title: str
    company: str
    match_score: float = Field(ge=0, le=1)
    match_reasons: List[str]
    missing_skills: List[str] = []
    salary_range: Optional[str] = None

class CareerCoachResponse(BaseModel):
    message: str
    suggested_actions: List[str] = []
    profile_updates: Optional[dict] = None
    job_matches: List[JobMatch] = []
    ui_actions: List[dict] = []  # For CopilotKit to render

# The main career coach agent
career_agent = Agent(
    'google-gla:gemini-2.0-flash',
    deps_type=UserProfile,
    result_type=CareerCoachResponse,
    system_prompt="""You are an expert career coach specializing in fractional executive roles.

Your job is to:
1. Help users discover and articulate their skills and experience
2. Understand their career goals and preferences
3. Match them with relevant fractional opportunities
4. Coach them through applications and interviews

Be warm, encouraging, and professional. Ask clarifying questions.
Always validate user input and update their profile progressively."""
)
```

### 2. CopilotKit Integration

```typescript
// app/components/CareerCoach.tsx
'use client'

import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
  CopilotSidebar
} from '@copilotkit/react-core'
import { CopilotTextarea } from '@copilotkit/react-textarea'

export function CareerCoachProvider({ children }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([])

  // Share user profile with AI
  useCopilotReadable({
    description: "The user's career profile including skills, experience, and preferences",
    value: userProfile,
  })

  // AI can show job matches
  useCopilotAction({
    name: "showJobMatches",
    description: "Display matched jobs to the user",
    parameters: [
      { name: "jobs", type: "object[]", description: "Array of matched jobs" }
    ],
    handler: async ({ jobs }) => {
      setJobMatches(jobs)
      // Trigger animation/modal
    }
  })

  // AI can update profile
  useCopilotAction({
    name: "updateProfile",
    description: "Update user's profile with new information",
    parameters: [
      { name: "updates", type: "object", description: "Profile updates" }
    ],
    handler: async ({ updates }) => {
      // Call Pydantic AI to validate and store
      const validated = await fetch('/api/profile/update', {
        method: 'POST',
        body: JSON.stringify(updates)
      })
      setUserProfile(await validated.json())
    }
  })

  // AI can show skill visualization
  useCopilotAction({
    name: "showSkillGraph",
    description: "Display interactive skill visualization",
    handler: async () => {
      // Trigger skill graph component
    }
  })

  return (
    <CopilotKit runtimeUrl="/api/copilot">
      <CopilotSidebar defaultOpen={true}>
        {children}
      </CopilotSidebar>
    </CopilotKit>
  )
}
```

### 3. Onboarding Flow

```
Step 1: Welcome & Goals
├── "What brings you to fractional work?"
├── "What executive roles interest you?" (CFO, CMO, CTO, etc.)
└── AI extracts: target_roles, motivation

Step 2: Experience Discovery
├── "Tell me about your most recent executive role"
├── "What were your key achievements?"
├── AI validates and creates WorkExperience objects
└── Shows experience timeline visualization

Step 3: Skills Assessment
├── "Based on your experience, I see skills in X, Y, Z"
├── "How would you rate your expertise in each?"
├── AI creates validated Skill objects
└── Shows skill radar chart

Step 4: Preferences
├── "Where would you like to work?" (location/remote)
├── "What's your target day rate?"
├── "How many days per week are you available?"
└── AI creates JobPreferences

Step 5: First Matches
├── AI searches jobs database with profile
├── Shows top 5 matches with scores
├── "Here are roles that match your profile"
└── User can save/dismiss/apply
```

### 4. Key Visualizations (CopilotKit Actions)

1. **Skill Radar Chart** - Shows user's skills vs job requirements
2. **Career Path Tree** - Visual progression from current to target roles
3. **Job Match Cards** - Rich cards with match percentage, key reasons
4. **Application Tracker** - Kanban-style board of applications
5. **Market Insights** - Charts showing demand for their skills

---

## API Endpoints Needed

### Pydantic AI Endpoints
- `POST /api/career/chat` - Main conversation endpoint
- `POST /api/profile/update` - Validate and update profile
- `GET /api/profile/{user_id}` - Get current profile
- `POST /api/jobs/match` - Get personalized job matches
- `POST /api/applications/draft` - Generate application materials

### CopilotKit Endpoints
- `POST /api/copilot` - CopilotKit runtime endpoint
- WebSocket for real-time UI updates

---

## Environment Variables Needed

```env
# Existing
GEMINI_API_KEY=...
DATABASE_URL=...
ZEP_API_KEY=...
NEON_AUTH_BASE_URL=...
NEXT_PUBLIC_HUME_API_KEY=...
NEXT_PUBLIC_HUME_CONFIG_ID=...

# New for Phase 2
COPILOTKIT_API_KEY=...  # If using cloud
```

---

## File Structure

```
fractional-quest-app/
├── app/
│   ├── api/
│   │   ├── career/
│   │   │   └── chat/route.ts      # Pydantic AI conversation
│   │   ├── profile/
│   │   │   ├── route.ts           # Get profile
│   │   │   └── update/route.ts    # Update profile
│   │   ├── jobs/
│   │   │   └── match/route.ts     # Job matching
│   │   └── copilot/
│   │       └── route.ts           # CopilotKit runtime
│   ├── onboarding/
│   │   └── page.tsx               # Onboarding flow
│   ├── dashboard/
│   │   └── page.tsx               # Main dashboard with visualizations
│   └── page.tsx                   # Landing with voice + sidebar
├── components/
│   ├── CareerCoach/
│   │   ├── Provider.tsx           # CopilotKit provider
│   │   ├── Sidebar.tsx            # Chat sidebar
│   │   └── Actions.tsx            # Copilot actions
│   ├── Visualizations/
│   │   ├── SkillRadar.tsx
│   │   ├── CareerPath.tsx
│   │   ├── JobMatchCard.tsx
│   │   └── MarketInsights.tsx
│   └── Onboarding/
│       ├── WelcomeStep.tsx
│       ├── ExperienceStep.tsx
│       ├── SkillsStep.tsx
│       └── PreferencesStep.tsx
├── lib/
│   ├── pydantic-client.ts         # Client for Pydantic AI backend
│   └── profile-schema.ts          # TypeScript types matching Pydantic
└── hooks/
    ├── useProfile.ts
    └── useJobMatches.ts
```

---

## Success Metrics

1. **Onboarding Completion Rate** - % who finish all steps
2. **Profile Completeness** - Average fields filled
3. **Job Match Quality** - User ratings of recommendations
4. **Application Rate** - % who apply to matched jobs
5. **Return Visits** - Users coming back for coaching

---

## Next Steps

1. [ ] Install CopilotKit: `npm install @copilotkit/react-core @copilotkit/react-textarea @copilotkit/react-ui`
2. [ ] Set up Pydantic AI models in CLM
3. [ ] Create onboarding flow with steps
4. [ ] Build profile storage (extend Neon DB)
5. [ ] Implement job matching algorithm
6. [ ] Add visualizations (recharts/d3)
7. [ ] Connect CopilotKit actions to Pydantic AI
8. [ ] Test end-to-end flow

---

## Reference: Working Examples

- **Lost London** (voice + auth): `/Users/dankeegan/lost.london-app`
- **Fractional.quest** (jobs + Zep): `/Users/dankeegan/fractional.quest`
- **CopilotKit docs**: https://docs.copilotkit.ai
- **Pydantic AI docs**: https://ai.pydantic.dev
