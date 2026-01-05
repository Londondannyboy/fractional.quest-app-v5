"""
Database functions for querying the Neon jobs database.
"""

import os
import asyncio
from typing import Optional

# Use psycopg for async PostgreSQL
import psycopg


async def get_db_connection():
    """Get async database connection."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    return await psycopg.AsyncConnection.connect(database_url)


async def search_jobs_db(
    role: Optional[str] = None,
    location: Optional[str] = None,
    remote_only: bool = False,
    limit: int = 10,
) -> list[dict]:
    """
    Search jobs in the Neon database.

    Args:
        role: Role filter (CFO, CMO, CTO, etc.)
        location: Location filter
        remote_only: Only return remote jobs
        limit: Maximum results

    Returns:
        List of job dictionaries.
    """
    try:
        conn = await get_db_connection()

        # Build query with filters
        query = """
            SELECT
                id,
                title,
                company_name as company,
                location,
                is_remote as remote,
                compensation as salary,
                url,
                description_snippet as description,
                posted_date,
                is_fractional,
                is_interim,
                executive_title,
                role_category
            FROM jobs
            WHERE is_active = true
        """
        params = []

        if role:
            # Match common executive role patterns
            role_patterns = {
                "CFO": ["CFO", "Chief Financial", "Finance Director", "FD"],
                "CMO": ["CMO", "Chief Marketing", "Marketing Director", "VP Marketing"],
                "CTO": ["CTO", "Chief Technology", "Tech Director", "VP Engineering"],
                "COO": ["COO", "Chief Operating", "Operations Director"],
                "CHRO": ["CHRO", "Chief HR", "HR Director", "People Director", "Chief People"],
                "CRO": ["CRO", "Chief Revenue", "Revenue Director", "Sales Director"],
                "CISO": ["CISO", "Chief Security", "Security Director", "InfoSec"],
                "CPO": ["CPO", "Chief Product", "Product Director", "VP Product"],
            }

            patterns = role_patterns.get(role.upper(), [role])
            pattern_conditions = " OR ".join(["title ILIKE %s" for _ in patterns])
            query += f" AND ({pattern_conditions})"
            params.extend([f"%{p}%" for p in patterns])

        if location:
            query += " AND (location ILIKE %s OR location ILIKE %s)"
            params.extend([f"%{location}%", f"%{location}%"])

        if remote_only:
            query += " AND is_remote = true"

        query += " ORDER BY posted_date DESC NULLS LAST LIMIT %s"
        params.append(limit)

        async with conn.cursor() as cur:
            await cur.execute(query, params)
            rows = await cur.fetchall()

            # Get column names
            columns = [desc[0] for desc in cur.description]

            jobs = []
            for row in rows:
                job = dict(zip(columns, row))
                # Convert any non-serializable types
                if job.get("posted_date"):
                    job["posted_date"] = str(job["posted_date"])
                jobs.append(job)

            return jobs

    except Exception as e:
        print(f"Database error: {e}")
        # Return empty list on error to not break the agent
        return []

    finally:
        if conn:
            await conn.close()


async def get_job_by_id(job_id: str) -> Optional[dict]:
    """Get a single job by ID."""
    try:
        conn = await get_db_connection()

        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT * FROM jobs WHERE id = %s",
                [job_id]
            )
            row = await cur.fetchone()

            if row:
                columns = [desc[0] for desc in cur.description]
                return dict(zip(columns, row))

            return None

    except Exception as e:
        print(f"Database error: {e}")
        return None

    finally:
        if conn:
            await conn.close()


async def get_job_stats() -> dict:
    """Get statistics about available jobs."""
    try:
        conn = await get_db_connection()

        async with conn.cursor() as cur:
            # Total jobs
            await cur.execute("SELECT COUNT(*) FROM jobs")
            total = (await cur.fetchone())[0]

            # Jobs by role type (approximate)
            await cur.execute("""
                SELECT
                    CASE
                        WHEN title ILIKE '%CFO%' OR title ILIKE '%Chief Financial%' THEN 'CFO'
                        WHEN title ILIKE '%CMO%' OR title ILIKE '%Chief Marketing%' THEN 'CMO'
                        WHEN title ILIKE '%CTO%' OR title ILIKE '%Chief Technology%' THEN 'CTO'
                        WHEN title ILIKE '%COO%' OR title ILIKE '%Chief Operating%' THEN 'COO'
                        WHEN title ILIKE '%CHRO%' OR title ILIKE '%Chief HR%' OR title ILIKE '%Chief People%' THEN 'CHRO'
                        ELSE 'Other'
                    END as role_type,
                    COUNT(*) as count
                FROM jobs
                GROUP BY role_type
                ORDER BY count DESC
            """)
            role_counts = {row[0]: row[1] for row in await cur.fetchall()}

            # Remote jobs
            await cur.execute("SELECT COUNT(*) FROM jobs WHERE is_remote = true")
            remote_count = (await cur.fetchone())[0]

            return {
                "total_jobs": total,
                "by_role": role_counts,
                "remote_jobs": remote_count,
            }

    except Exception as e:
        print(f"Database error: {e}")
        return {"total_jobs": 0, "by_role": {}, "remote_jobs": 0}

    finally:
        if conn:
            await conn.close()
