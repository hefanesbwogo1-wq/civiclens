from fastapi import APIRouter
from .database import get_connection

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)


@router.get("/summary")
async def report_summary():

    connection = get_connection()

    try:
        total = connection.execute(
            "SELECT COUNT(*) AS count FROM mentions"
        ).fetchone()["count"]

        positive = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM mentions
            WHERE LOWER(sentiment) = 'positive'
            """
        ).fetchone()["count"]

        neutral = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM mentions
            WHERE LOWER(sentiment) = 'neutral'
            """
        ).fetchone()["count"]

        negative = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM mentions
            WHERE LOWER(sentiment) = 'negative'
            """
        ).fetchone()["count"]

        leaders = connection.execute(
            """
            SELECT COUNT(DISTINCT leader_name) AS count
            FROM mentions
            WHERE leader_name IS NOT NULL
            AND TRIM(leader_name) != ''
            """
        ).fetchone()["count"]

        platforms = connection.execute(
            """
            SELECT COUNT(DISTINCT platform) AS count
            FROM mentions
            WHERE platform IS NOT NULL
            AND TRIM(platform) != ''
            """
        ).fetchone()["count"]

    except Exception:
        total = 0
        positive = 0
        neutral = 0
        negative = 0
        leaders = 0
        platforms = 0

    connection.close()

    return {
        "success": True,
        "total_mentions": total,
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "tracked_leaders": leaders,
        "active_platforms": platforms
    }


@router.get("/platforms")
async def platform_report():

    connection = get_connection()

    rows = connection.execute(
        """
        SELECT
            platform,
            COUNT(*) AS mentions
        FROM mentions
        WHERE platform IS NOT NULL
        AND TRIM(platform) != ''
        GROUP BY platform
        ORDER BY mentions DESC
        """
    ).fetchall()

    connection.close()

    return {
        "success": True,
        "platforms": [
            {
                "platform": row["platform"],
                "mentions": row["mentions"]
            }
            for row in rows
        ]
    }


@router.get("/leaders")
async def leader_report():

    connection = get_connection()

    rows = connection.execute(
        """
        SELECT
            leader_name,
            COUNT(*) AS mentions
        FROM mentions
        WHERE leader_name IS NOT NULL
        AND TRIM(leader_name) != ''
        GROUP BY leader_name
        ORDER BY mentions DESC
        """
    ).fetchall()

    connection.close()

    return {
        "success": True,
        "leaders": [
            {
                "leader_name": row["leader_name"],
                "mentions": row["mentions"]
            }
            for row in rows
        ]
    }