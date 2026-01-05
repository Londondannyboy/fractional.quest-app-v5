"""
FastAPI server for the Fractional Quest Career Coach.
Uses CopilotKit SDK to expose job search actions.
"""

import os
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitRemoteEndpoint, Action

# Load environment variables
load_dotenv()

# Import database functions
from db import search_jobs_db, get_job_stats

# Create FastAPI app
app = FastAPI(
    title="Fractional Quest Career Coach",
    description="AI Career Coach for Fractional Executive Opportunities",
    version="1.0.0",
)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://fractional-quest-app.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# A2UI delimiter for rich UI components
A2UI_DELIMITER = "---a2ui_JSON---"


def generate_job_card_a2ui(job: dict, index: int) -> dict:
    """Generate A2UI Card component for a job."""
    return {
        "surfaceUpdate": {
            "id": f"job-card-{index}",
            "component": "Card",
            "props": {
                "title": job.get('title', 'Unknown Title'),
                "subtitle": f"{job.get('company', 'Unknown Company')} - {job.get('location', 'Location TBD')}",
                "description": job.get('salary') or "Day rate negotiable",
                "badges": [
                    {"label": "Remote", "variant": "success"} if job.get('remote') else None,
                    {"label": job.get('executive_title', ''), "variant": "info"} if job.get('executive_title') else None,
                ],
                "url": job.get('url'),
            },
            "actions": [
                {"name": "apply_to_job", "label": "Apply Now", "variant": "primary", "data": {"job_id": job.get('id')}},
                {"name": "save_job", "label": "Save", "variant": "secondary", "data": {"job_id": job.get('id')}},
                {"name": "not_interested", "label": "Skip", "variant": "ghost", "data": {"job_id": job.get('id')}},
            ]
        }
    }


# Define job search action
async def search_jobs_action(role: str = None, location: str = None, remote_only: bool = False, limit: int = 5):
    """Search for fractional executive jobs."""
    try:
        jobs = await search_jobs_db(
            role=role,
            location=location,
            remote_only=remote_only,
            limit=limit
        )

        if not jobs:
            return f"No {role or 'executive'} jobs found. We have 288 total jobs - try searching for CFO, CTO, or just ask 'show me all jobs'."

        # Generate simple text response with job details
        role_text = role.upper() if role else "executive"
        location_text = f" in {location}" if location else ""
        response = f"Found {len(jobs)} {role_text} opportunities{location_text}:\n\n"

        for i, job in enumerate(jobs[:5], 1):
            title = job.get('title', 'Unknown')
            company = job.get('company', 'Unknown')
            loc = job.get('location', 'Remote' if job.get('remote') else 'Location TBD')
            url = job.get('url', '')

            response += f"{i}. **{title}** at {company}\n"
            response += f"   Location: {loc}\n"
            if url:
                response += f"   Apply: {url}\n"
            response += "\n"

        return response
    except Exception as e:
        print(f"Search error: {e}")
        return f"Sorry, I encountered an error searching for jobs. Please try again."


async def get_stats_action():
    """Get job market statistics."""
    import json

    stats = await get_job_stats()

    # Conversational response
    text_response = f"Here's the current job market overview:\n"
    text_response += f"- Total Jobs: {stats.get('total_jobs', 0)}\n"
    text_response += f"- Remote Opportunities: {stats.get('remote_jobs', 0)}"

    # Generate A2UI chart component
    by_role = stats.get('by_role', {})
    chart_data = [{"label": role, "value": count} for role, count in by_role.items()]

    a2ui_component = {
        "surfaceUpdate": {
            "id": "stats-chart",
            "component": "Chart",
            "props": {
                "type": "bar",
                "title": "Jobs by Role",
                "data": chart_data,
                "xLabel": "Role",
                "yLabel": "Count",
            }
        }
    }

    a2ui_json = json.dumps({"components": [a2ui_component]}, indent=2)

    return f"{text_response}\n\n{A2UI_DELIMITER}\n{a2ui_json}"


# Create CopilotKit SDK with actions
sdk = CopilotKitRemoteEndpoint(
    actions=[
        Action(
            name="search_jobs",
            description="Search for fractional executive jobs. Use this when users ask about job opportunities, CFO roles, CMO positions, CTO jobs, etc.",
            handler=search_jobs_action,
            parameters=[
                {
                    "name": "role",
                    "description": "The role to search for (e.g., CFO, CMO, CTO, COO, CHRO, CRO, CISO). Leave empty to search all roles.",
                    "type": "string",
                    "required": False,
                },
                {
                    "name": "location",
                    "description": "Location filter (e.g., London, Manchester, Remote). Leave empty for all locations.",
                    "type": "string",
                    "required": False,
                },
                {
                    "name": "remote_only",
                    "description": "Set to true to only show remote opportunities.",
                    "type": "boolean",
                    "required": False,
                },
                {
                    "name": "limit",
                    "description": "Maximum number of results to return (default: 5, max: 10).",
                    "type": "number",
                    "required": False,
                },
            ],
        ),
        Action(
            name="get_job_stats",
            description="Get statistics about the job market - total jobs, remote jobs, jobs by role type.",
            handler=get_stats_action,
            parameters=[],
        ),
    ],
)

# Add CopilotKit endpoint
add_fastapi_endpoint(app, sdk, "/copilotkit")


@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ok", "service": "career_coach", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check for deployment platforms."""
    return {"status": "healthy"}


@app.get("/api/stats")
async def api_stats():
    """Get job statistics."""
    return await get_job_stats()


@app.get("/api/test-db")
async def test_db():
    """Test database connection."""
    try:
        jobs = await search_jobs_db(limit=3)
        return {
            "status": "ok",
            "jobs_found": len(jobs),
            "sample": jobs[:1] if jobs else [],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"Starting Career Coach on {host}:{port}")
    print(f"CopilotKit endpoint: http://{host}:{port}/copilotkit")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
    )
