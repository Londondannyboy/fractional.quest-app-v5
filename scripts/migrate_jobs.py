"""
Migrate jobs from Quest DB to Fractional DB.
"""
import asyncio
import os
import psycopg

# Source: Quest DB
QUEST_DB = "postgresql://neondb_owner:npg_LjBNF17HSTix@ep-green-smoke-ab3vtnw9-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

# Target: Fractional DB
FRACTIONAL_DB = "postgresql://neondb_owner:npg_9mG4aJRxgtpz@ep-wandering-darkness-abiq57ia-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"

async def migrate_jobs():
    print("Connecting to Quest DB...")
    quest_conn = await psycopg.AsyncConnection.connect(QUEST_DB)

    print("Connecting to Fractional DB...")
    frac_conn = await psycopg.AsyncConnection.connect(FRACTIONAL_DB)

    # Fetch all jobs from Quest
    print("Fetching jobs from Quest...")
    async with quest_conn.cursor() as cur:
        await cur.execute("""
            SELECT
                id, board_id, external_id, company_name, title, department, team,
                location, locations, employment_type, workplace_type, url, compensation,
                posted_date, updated_date, description_snippet, is_active, first_seen_at,
                last_seen_at, raw_data, salary_min, salary_max, salary_currency,
                application_deadline, full_description, requirements, responsibilities,
                benefits, qualifications, nice_to_have, about_team, about_company,
                skills_required, seniority_level, role_category, location_id, is_fractional,
                classification_confidence, classification_reasoning, hours_per_week,
                is_remote, site_tags, slug, industry, city, company_domain, is_interim,
                job_source, is_syndicated, company_type, validated_job_post,
                description_word_count, normalized_title, appeal_summary,
                estimated_hourly_rate_min, estimated_hourly_rate_max, key_deliverables,
                country, executive_title
            FROM jobs
        """)
        jobs = await cur.fetchall()
        columns = [desc[0] for desc in cur.description]

    print(f"Found {len(jobs)} jobs to migrate")

    # Insert into Fractional
    print("Inserting jobs into Fractional...")
    async with frac_conn.cursor() as cur:
        insert_sql = f"""
            INSERT INTO jobs ({', '.join(columns)})
            VALUES ({', '.join(['%s'] * len(columns))})
            ON CONFLICT (slug) DO NOTHING
        """

        inserted = 0
        for job in jobs:
            try:
                await cur.execute(insert_sql, job)
                inserted += 1
                if inserted % 50 == 0:
                    print(f"  Inserted {inserted}/{len(jobs)} jobs...")
            except Exception as e:
                print(f"  Error inserting job: {e}")

        await frac_conn.commit()

    print(f"Migration complete! Inserted {inserted} jobs.")

    # Verify
    async with frac_conn.cursor() as cur:
        await cur.execute("SELECT COUNT(*) FROM jobs")
        count = (await cur.fetchone())[0]
        print(f"Total jobs in Fractional DB: {count}")

    await quest_conn.close()
    await frac_conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_jobs())
