from fastapi import APIRouter, Query
from typing import Optional

from .database import get_connection


# =========================================================
# CIVICLENS MENTIONS ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/mentions",
    tags=["Mentions"]
)


# =========================================================
# DATABASE SETUP
# =========================================================

def ensure_mentions_table():

    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS mentions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            leader_id INTEGER,

            leader_name TEXT,

            platform TEXT NOT NULL,

            author_name TEXT,

            author_handle TEXT,

            content TEXT NOT NULL,

            post_url TEXT,

            sentiment TEXT DEFAULT 'neutral',

            published_at TEXT,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP

        )
        """
    )

    connection.commit()
    connection.close()


# =========================================================
# GET MENTION STATISTICS
# =========================================================

@router.get("/stats")
async def mention_stats():

    ensure_mentions_table()

    connection = get_connection()

    total = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM mentions
        """
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

    connection.close()

    return {
        "success": True,
        "total": total,
        "positive": positive,
        "neutral": neutral,
        "negative": negative
    }


# =========================================================
# GET MENTIONS
# =========================================================

@router.get("")
async def get_mentions(

    search: Optional[str] = Query(
        default=None
    ),

    leader: Optional[str] = Query(
        default=None
    ),

    platform: Optional[str] = Query(
        default=None
    ),

    sentiment: Optional[str] = Query(
        default=None
    )

):

    ensure_mentions_table()

    connection = get_connection()

    query = """
        SELECT
            id,
            leader_id,
            leader_name,
            platform,
            author_name,
            author_handle,
            content,
            post_url,
            sentiment,
            published_at,
            created_at
        FROM mentions
        WHERE 1 = 1
    """

    parameters = []

    # -----------------------------------------------------
    # SEARCH
    # -----------------------------------------------------

    if search:

        query += """
            AND (
                content LIKE ?
                OR author_name LIKE ?
                OR author_handle LIKE ?
                OR leader_name LIKE ?
            )
        """

        search_value = f"%{search}%"

        parameters.extend([
            search_value,
            search_value,
            search_value,
            search_value
        ])

    # -----------------------------------------------------
    # LEADER
    # -----------------------------------------------------

    if leader:

        query += """
            AND leader_name = ?
        """

        parameters.append(leader)

    # -----------------------------------------------------
    # PLATFORM
    # -----------------------------------------------------

    if platform:

        query += """
            AND platform = ?
        """

        parameters.append(platform)

    # -----------------------------------------------------
    # SENTIMENT
    # -----------------------------------------------------

    if sentiment:

        query += """
            AND LOWER(sentiment) = LOWER(?)
        """

        parameters.append(sentiment)

    # -----------------------------------------------------
    # ORDER
    # -----------------------------------------------------

    query += """
        ORDER BY
            COALESCE(published_at, created_at) DESC,
            id DESC
        LIMIT 100
    """

    rows = connection.execute(
        query,
        parameters
    ).fetchall()

    connection.close()

    mentions = []

    for row in rows:

        mentions.append(
            {
                "id": row["id"],
                "leader_id": row["leader_id"],
                "leader_name": row["leader_name"],
                "platform": row["platform"],
                "author_name": row["author_name"],
                "author_handle": row["author_handle"],
                "content": row["content"],
                "post_url": row["post_url"],
                "sentiment": row["sentiment"],
                "published_at": row["published_at"],
                "created_at": row["created_at"]
            }
        )

    return {
        "success": True,
        "count": len(mentions),
        "mentions": mentions
    }


# =========================================================
# GET AVAILABLE LEADERS
# =========================================================

@router.get("/leaders")
async def mention_leaders():

    ensure_mentions_table()

    connection = get_connection()

    rows = connection.execute(
        """
        SELECT DISTINCT leader_name
        FROM mentions
        WHERE leader_name IS NOT NULL
        AND TRIM(leader_name) != ''
        ORDER BY leader_name ASC
        """
    ).fetchall()

    connection.close()

    return {
        "success": True,
        "leaders": [
            row["leader_name"]
            for row in rows
        ]
    }


# =========================================================
# GET SINGLE MENTION
# =========================================================

@router.get("/{mention_id}")
async def get_mention(
    mention_id: int
):

    ensure_mentions_table()

    connection = get_connection()

    row = connection.execute(
        """
        SELECT
            id,
            leader_id,
            leader_name,
            platform,
            author_name,
            author_handle,
            content,
            post_url,
            sentiment,
            published_at,
            created_at
        FROM mentions
        WHERE id = ?
        """,
        (mention_id,)
    ).fetchone()

    connection.close()

    if not row:

        return {
            "success": False,
            "message": "Mention not found."
        }

    return {
        "success": True,
        "mention": dict(row)
    }