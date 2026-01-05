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


# Define job search action
async def search_jobs_action(role: str = None, location: str = None, remote_only: bool = False, limit: int = 5):
    """Search for fractional executive jobs."""
    jobs = await search_jobs_db(
        role=role,
        location=location,
        remote_only=remote_only,
        limit=limit
    )

    if not jobs:
        return "No jobs found matching your criteria. Try broadening your search."

    # Format results for display
    results = []
    for job in jobs:
        job_info = f"**{job.get('title', 'Unknown Title')}** at {job.get('company', 'Unknown Company')}"

        details = []
        if job.get('location'):
            details.append(f"📍 {job['location']}")
        if job.get('remote'):
            details.append("🏠 Remote")
        if job.get('salary'):
            details.append(f"💰 {job['salary']}")

        if details:
            job_info += f"\n  {' | '.join(details)}"

        if job.get('url'):
            job_info += f"\n  🔗 [Apply Here]({job['url']})"

        results.append(job_info)

    return f"Found {len(jobs)} matching jobs:\n\n" + "\n\n".join(results)


async def get_stats_action():
    """Get job market statistics."""
    stats = await get_job_stats()

    result = f"**Job Market Overview**\n\n"
    result += f"📊 Total Jobs: {stats.get('total_jobs', 0)}\n"
    result += f"🏠 Remote Jobs: {stats.get('remote_jobs', 0)}\n\n"

    if stats.get('by_role'):
        result += "**By Role:**\n"
        for role, count in stats['by_role'].items():
            result += f"  • {role}: {count}\n"

    return result


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
