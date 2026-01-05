"""
Pydantic models for the Fractional Quest Career Coach Agent.
These models ensure data validation and type safety throughout the agent.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class SkillLevel(str, Enum):
    """Skill proficiency levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class Skill(BaseModel):
    """A user's skill with proficiency level."""
    name: str = Field(description="Name of the skill")
    category: str = Field(description="Category: finance, marketing, technology, operations, hr, etc.")
    level: SkillLevel = Field(default=SkillLevel.INTERMEDIATE)
    years_experience: Optional[int] = Field(default=None, description="Years of experience with this skill")


class WorkExperience(BaseModel):
    """A work experience entry."""
    company: str
    role: str
    is_executive: bool = Field(default=False, description="Was this an executive-level role?")
    start_year: int
    end_year: Optional[int] = Field(default=None, description="None means current role")
    key_achievements: list[str] = Field(default_factory=list)


class JobPreferences(BaseModel):
    """User's job search preferences."""
    target_roles: list[str] = Field(default_factory=list, description="Target roles: CFO, CMO, CTO, etc.")
    locations: list[str] = Field(default_factory=list, description="Preferred locations")
    remote_preference: Optional[str] = Field(default=None, description="remote, hybrid, onsite, or flexible")
    day_rate_min: Optional[int] = Field(default=None, description="Minimum day rate in GBP")
    day_rate_max: Optional[int] = Field(default=None, description="Maximum day rate in GBP")
    industries: list[str] = Field(default_factory=list, description="Preferred industries")
    availability_days_per_week: Optional[int] = Field(default=None, ge=1, le=5)


class UserProfile(BaseModel):
    """Complete user profile for career matching."""
    user_id: str = Field(default="anonymous")
    name: Optional[str] = None
    email: Optional[str] = None
    skills: list[Skill] = Field(default_factory=list)
    experiences: list[WorkExperience] = Field(default_factory=list)
    preferences: Optional[JobPreferences] = None
    onboarding_complete: bool = False
    onboarding_step: int = Field(default=0, ge=0, le=5)


class JobMatch(BaseModel):
    """A job matched to the user's profile."""
    job_id: str
    title: str
    company: str
    location: Optional[str] = None
    remote: bool = False
    match_score: float = Field(ge=0, le=1, description="Match score from 0 to 1")
    match_reasons: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    day_rate: Optional[str] = None
    url: Optional[str] = None


class CareerCoachState(BaseModel):
    """
    Main state for the Career Coach agent.
    This is synchronized with the frontend via AG-UI.
    """
    # User profile
    user_profile: UserProfile = Field(default_factory=UserProfile)

    # Current job matches
    job_matches: list[JobMatch] = Field(default_factory=list)

    # Onboarding progress
    onboarding_step: int = Field(default=0, ge=0, le=5)
    onboarding_complete: bool = False

    # UI state
    show_jobs_panel: bool = False
    show_profile_panel: bool = False
    show_skills_graph: bool = False

    # Recent search context
    last_search_query: Optional[str] = None
    last_search_role: Optional[str] = None
    last_search_location: Optional[str] = None

    # Tool execution logs (for UI feedback)
    tool_logs: list[dict] = Field(default_factory=list)
