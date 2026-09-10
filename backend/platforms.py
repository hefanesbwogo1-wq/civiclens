from fastapi import APIRouter

from .database import get_connection


# =========================================================
# CIVICLENS PLATFORMS ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/platforms",
    tags=["Platforms"]
)


# =========================================================
# PLATFORM CONFIGURATION
# =========================================================

PLATFORMS = [
    {
        "id": "x",
        "name": "X",
        "description": "Public conversations on X",
        "icon": "𝕏",
        "status": "available"
    },
    {
        "id": "facebook",
        "name": "Facebook",
        "description": "Public conversations on Facebook",
        "icon": "f",
        "status": "available"
    },
    {
        "id": "instagram",
        "name": "Instagram",
        "description": "Public conversations on Instagram",
        "icon": "◎",
        "status": "coming_soon"
    },
    {
        "id": "youtube",
        "name": "YouTube",
        "description": "Public conversations on YouTube",
        "icon": "▶",
        "status": "coming_soon"
    }
]


# =========================================================
# GET PLATFORMS
# =========================================================

@router.get("")
async def get_platforms():

    connection = get_connection()

    results = []

    for platform in PLATFORMS:

        try:
            row = connection.execute(
                """
                SELECT COUNT(*) AS count
                FROM mentions
                WHERE LOWER(platform) = LOWER(?)
                """,
                (platform["name"],)
            ).fetchone()

            mention_count = row["count"] if row else 0

        except Exception:
            mention_count = 0

        results.append({
            **platform,
            "mention_count": mention_count,
            "monitoring": (
                platform["status"] == "available"
            )
        })

    connection.close()

    return {
        "success": True,
        "platforms": results
    }


# =========================================================
# PLATFORM STATISTICS
# =========================================================

@router.get("/stats")
async def platform_stats():

    connection = get_connection()

    try:

        total_mentions = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM mentions
            """
        ).fetchone()["count"]

        x_mentions = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM mentions
            WHERE LOWER(platform) = 'x'
            """
        ).fetchone()["count"]

        facebook_mentions = connection.execute(
            """
            SELECT COUNT(*) AS count
            FROM mentions
            WHERE LOWER(platform) = 'facebook'
            """
        ).fetchone()["count"]

    except Exception:

        total_mentions = 0
        x_mentions = 0
        facebook_mentions = 0

    connection.close()

    return {
        "success": True,
        "total_mentions": total_mentions,
        "x_mentions": x_mentions,
        "facebook_mentions": facebook_mentions,
        "active_platforms": 2
    }