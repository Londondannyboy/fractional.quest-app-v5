"""
Pydantic AI Career Coach Agent for Fractional Quest.
This agent helps users find fractional executive opportunities.
"""

import os
from textwrap import dedent
from pydantic_ai import Agent, RunContext
from pydantic_ai.ui import StateDeps

from models import (
    CareerCoachState,
    UserProfile,
    JobMatch,
    JobPreferences,
    Skill,
    SkillLevel,
    WorkExperience,
)

# Initialize the agent with Google Gemini (or OpenAI)
MODEL = os.getenv("AGENT_MODEL", "google-gla:gemini-2.0-flash")

agent = Agent(
    MODEL,
    deps_type=StateDeps[CareerCoachState],
    instructions=dedent("""
        You are an expert career coach specializing in fractional executive roles in the UK.

        Your job is to:
        1. Help users discover and articulate their skills and executive experience
        2. Understand their career goals and job preferences
        3. Search for and match them with relevant fractional opportunities
        4. Provide coaching on applications and career strategy

        **Onboarding Flow** (if user hasn't completed onboarding):
        - Step 0: Welcome and understand their goals
        - Step 1: Learn about their executive experience
        - Step 2: Assess their key skills
        - Step 3: Understand their preferences (location, rate, availability)
        - Step 4: Show initial job matches
        - Step 5: Onboarding complete

        **Key Behaviors**:
        - Be warm, professional, and encouraging
        - Ask one question at a time during onboarding
        - Use the search_jobs tool to find relevant opportunities
        - Update the user's profile progressively as you learn about them
        - Show job matches with clear reasoning
        - Offer specific, actionable advice

        **Available Roles**: CFO, CMO, CTO, COO, CHRO, CRO, CISO, CPO, and other C-suite positions.
        **Focus**: UK-based and remote fractional/part-time executive opportunities.
    """),
)


@agent.tool
async def search_jobs(
    ctx: RunContext[StateDeps[CareerCoachState]],
    role: str | None = None,
    location: str | None = None,
    remote_only: bool = False,
    limit: int = 5,
) -> list[dict]:
    """
    Search for fractional executive jobs in the database.

    Args:
        role: Target role (CFO, CMO, CTO, etc.). If None, uses profile preferences.
        location: Location filter (e.g., "London", "Manchester"). If None, searches all.
        remote_only: If True, only return remote opportunities.
        limit: Maximum number of results to return.

    Returns:
        List of matching jobs with details.
    """
    import asyncio
    from db import search_jobs_db

    state = ctx.deps.state

    # Update state with search context
    state.last_search_role = role
    state.last_search_location = location
    state.last_search_query = f"{role or 'any role'} in {location or 'any location'}"

    # Add tool log
    state.tool_logs.append({
        "tool": "search_jobs",
        "status": "searching",
        "params": {"role": role, "location": location, "remote_only": remote_only}
    })

    # Query the database
    jobs = await search_jobs_db(
        role=role,
        location=location,
        remote_only=remote_only,
        limit=limit
    )

    # Convert to JobMatch objects with match scoring
    matches = []
    for job in jobs:
        # Calculate simple match score based on profile
        score = calculate_match_score(job, state.user_profile)

        match = JobMatch(
            job_id=str(job.get("id", "")),
            title=job.get("title", ""),
            company=job.get("company", "Unknown"),
            location=job.get("location"),
            remote=job.get("remote", False),
            match_score=score,
            match_reasons=get_match_reasons(job, state.user_profile),
            day_rate=job.get("salary"),
            url=job.get("url"),
        )
        matches.append(match)

    # Update state with matches
    state.job_matches = matches
    state.show_jobs_panel = True

    # Update tool log
    state.tool_logs[-1]["status"] = "complete"
    state.tool_logs[-1]["results_count"] = len(matches)

    return [m.model_dump() for m in matches]


@agent.tool
async def update_user_profile(
    ctx: RunContext[StateDeps[CareerCoachState]],
    name: str | None = None,
    target_roles: list[str] | None = None,
    locations: list[str] | None = None,
    remote_preference: str | None = None,
    day_rate_min: int | None = None,
    day_rate_max: int | None = None,
    availability_days: int | None = None,
) -> dict:
    """
    Update the user's profile with new information.
    Call this as you learn about the user during conversation.

    Args:
        name: User's name
        target_roles: List of target roles (CFO, CMO, CTO, etc.)
        locations: Preferred locations
        remote_preference: remote, hybrid, onsite, or flexible
        day_rate_min: Minimum day rate in GBP
        day_rate_max: Maximum day rate in GBP
        availability_days: Days per week available (1-5)

    Returns:
        Updated profile summary.
    """
    state = ctx.deps.state
    profile = state.user_profile

    if name:
        profile.name = name

    # Update or create preferences
    if profile.preferences is None:
        profile.preferences = JobPreferences()

    if target_roles:
        profile.preferences.target_roles = target_roles
    if locations:
        profile.preferences.locations = locations
    if remote_preference:
        profile.preferences.remote_preference = remote_preference
    if day_rate_min:
        profile.preferences.day_rate_min = day_rate_min
    if day_rate_max:
        profile.preferences.day_rate_max = day_rate_max
    if availability_days:
        profile.preferences.availability_days_per_week = availability_days

    return {
        "status": "updated",
        "profile_summary": {
            "name": profile.name,
            "target_roles": profile.preferences.target_roles if profile.preferences else [],
            "locations": profile.preferences.locations if profile.preferences else [],
            "remote_preference": profile.preferences.remote_preference if profile.preferences else None,
        }
    }


@agent.tool
async def add_skill(
    ctx: RunContext[StateDeps[CareerCoachState]],
    skill_name: str,
    category: str,
    level: str = "intermediate",
    years_experience: int | None = None,
) -> dict:
    """
    Add a skill to the user's profile.

    Args:
        skill_name: Name of the skill
        category: Category (finance, marketing, technology, operations, hr, strategy, etc.)
        level: Proficiency level (beginner, intermediate, advanced, expert)
        years_experience: Years of experience with this skill

    Returns:
        Confirmation of added skill.
    """
    state = ctx.deps.state

    skill = Skill(
        name=skill_name,
        category=category,
        level=SkillLevel(level),
        years_experience=years_experience,
    )

    # Check if skill already exists and update it
    existing_idx = next(
        (i for i, s in enumerate(state.user_profile.skills) if s.name.lower() == skill_name.lower()),
        None
    )

    if existing_idx is not None:
        state.user_profile.skills[existing_idx] = skill
    else:
        state.user_profile.skills.append(skill)

    return {
        "status": "added",
        "skill": skill.model_dump(),
        "total_skills": len(state.user_profile.skills)
    }


@agent.tool
async def add_experience(
    ctx: RunContext[StateDeps[CareerCoachState]],
    company: str,
    role: str,
    start_year: int,
    end_year: int | None = None,
    is_executive: bool = False,
    achievements: list[str] | None = None,
) -> dict:
    """
    Add work experience to the user's profile.

    Args:
        company: Company name
        role: Job title/role
        start_year: Year started
        end_year: Year ended (None if current)
        is_executive: Whether this was an executive-level role
        achievements: List of key achievements

    Returns:
        Confirmation of added experience.
    """
    state = ctx.deps.state

    experience = WorkExperience(
        company=company,
        role=role,
        start_year=start_year,
        end_year=end_year,
        is_executive=is_executive,
        key_achievements=achievements or [],
    )

    state.user_profile.experiences.append(experience)

    return {
        "status": "added",
        "experience": experience.model_dump(),
        "total_experiences": len(state.user_profile.experiences)
    }


@agent.tool
async def advance_onboarding(
    ctx: RunContext[StateDeps[CareerCoachState]],
    step: int,
) -> dict:
    """
    Advance the onboarding process to the next step.

    Steps:
    0 - Welcome (goals)
    1 - Experience discovery
    2 - Skills assessment
    3 - Preferences
    4 - First matches
    5 - Complete

    Args:
        step: The step to advance to (0-5)

    Returns:
        New onboarding state.
    """
    state = ctx.deps.state

    state.onboarding_step = min(step, 5)
    state.user_profile.onboarding_step = state.onboarding_step

    if step >= 5:
        state.onboarding_complete = True
        state.user_profile.onboarding_complete = True

    return {
        "step": state.onboarding_step,
        "complete": state.onboarding_complete,
    }


@agent.tool
async def show_visualization(
    ctx: RunContext[StateDeps[CareerCoachState]],
    visualization_type: str,
) -> dict:
    """
    Trigger a visualization in the UI.

    Args:
        visualization_type: Type of visualization to show:
            - "jobs" - Job matches panel
            - "profile" - User profile panel
            - "skills" - Skills radar graph

    Returns:
        Confirmation.
    """
    state = ctx.deps.state

    if visualization_type == "jobs":
        state.show_jobs_panel = True
    elif visualization_type == "profile":
        state.show_profile_panel = True
    elif visualization_type == "skills":
        state.show_skills_graph = True

    return {"showing": visualization_type}


# Helper functions

def calculate_match_score(job: dict, profile: UserProfile) -> float:
    """Calculate a match score between a job and user profile."""
    score = 0.5  # Base score

    if not profile.preferences:
        return score

    # Role match
    job_title = job.get("title", "").lower()
    for target_role in profile.preferences.target_roles:
        if target_role.lower() in job_title:
            score += 0.2
            break

    # Location match
    job_location = job.get("location", "").lower()
    for pref_location in profile.preferences.locations:
        if pref_location.lower() in job_location:
            score += 0.15
            break

    # Remote preference match
    if profile.preferences.remote_preference == "remote" and job.get("remote"):
        score += 0.15

    return min(score, 1.0)


def get_match_reasons(job: dict, profile: UserProfile) -> list[str]:
    """Generate human-readable match reasons."""
    reasons = []

    if not profile.preferences:
        return ["Matches your search criteria"]

    job_title = job.get("title", "").lower()
    for target_role in profile.preferences.target_roles:
        if target_role.lower() in job_title:
            reasons.append(f"Matches your target role: {target_role}")
            break

    job_location = job.get("location", "")
    for pref_location in profile.preferences.locations:
        if pref_location.lower() in job_location.lower():
            reasons.append(f"Located in {job_location}")
            break

    if profile.preferences.remote_preference == "remote" and job.get("remote"):
        reasons.append("Remote opportunity")

    if not reasons:
        reasons.append("Relevant fractional executive opportunity")

    return reasons
