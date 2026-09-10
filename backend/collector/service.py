"""
CivicLens Mention Collection Service

Core pipeline responsible for:
1. Loading a user's tracked leaders
2. Matching incoming posts
3. Preventing duplicates
4. Saving matched mentions
"""

from typing import Any

from fastapi import HTTPException

from .matcher import match_leaders


# =========================================================
# LOAD TRACKED LEADERS
# =========================================================

def get_tracked_leaders(supabase, user_id: str) -> list[dict[str, Any]]:
    """
    Load all leaders belonging to the authenticated user.
    """

    response = (
        supabase
        .table("leaders")
        .select(
            """
            id,
            full_name,
            public_name,
            keywords,
            nicknames
            """
        )
        .eq("user_id", user_id)
        .eq("monitoring_enabled", True)
        .execute()
    )

    return response.data or []


# =========================================================
# DUPLICATE CHECK
# =========================================================

def mention_exists(
    supabase,
    user_id: str,
    platform: str,
    external_id: str | None
) -> bool:
    """
    Check whether this platform post has already
    been collected for this CivicLens user.
    """

    if not external_id:
        return False

    response = (
        supabase
        .table("mentions")
        .select("id")
        .eq("user_id", user_id)
        .eq("platform", platform)
        .eq("external_id", external_id)
        .limit(1)
        .execute()
    )

    return bool(response.data)


# =========================================================
# SAVE MENTION
# =========================================================

def save_mention(
    supabase,
    user_id: str,
    leader: dict[str, Any],
    post: dict[str, Any],
    matched_terms: list[str]
) -> dict[str, Any]:
    """
    Save a matched social-media post.
    """

    record = {
        "user_id": user_id,
        "leader_id": leader.get("leader_id"),
        "leader_name": leader.get("leader_name"),
        "platform": post["platform"],
        "author_name": post.get("author_name"),
        "author_handle": post.get("author_handle"),
        "content": post["content"],
        "post_url": post.get("post_url"),
        "sentiment": post.get("sentiment", "neutral"),
        "published_at": post.get("published_at"),
        "external_id": post.get("external_id"),
        "metadata": {
            "matched_terms": matched_terms,
            "source": "collector"
        }
    }

    response = (
        supabase
        .table("mentions")
        .insert(record)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Unable to save collected mention."
        )

    return response.data[0]


# =========================================================
# PROCESS ONE POST
# =========================================================

def process_post(
    supabase,
    user_id: str,
    post: dict[str, Any]
) -> dict[str, Any]:
    """
    Main collection pipeline.

    Incoming post
        ↓
    Duplicate check
        ↓
    Load leaders
        ↓
    Match leaders
        ↓
    Save mentions
    """

    platform = post["platform"]
    external_id = post.get("external_id")

    # -----------------------------------------------------
    # DUPLICATE PROTECTION
    # -----------------------------------------------------

    if mention_exists(
        supabase,
        user_id,
        platform,
        external_id
    ):
        return {
            "status": "duplicate",
            "saved": False,
            "matches": []
        }

    # -----------------------------------------------------
    # LOAD TRACKED LEADERS
    # -----------------------------------------------------

    leaders = get_tracked_leaders(
        supabase,
        user_id
    )

    # -----------------------------------------------------
    # MATCH POST
    # -----------------------------------------------------

    matches = match_leaders(
        post["content"],
        leaders
    )

    if not matches:
        return {
            "status": "no_match",
            "saved": False,
            "matches": []
        }

    # -----------------------------------------------------
    # SAVE MATCHES
    # -----------------------------------------------------

    saved_mentions = []

    for match in matches:

        saved = save_mention(
            supabase,
            user_id,
            match,
            post,
            match["matched_terms"]
        )

        saved_mentions.append(saved)

    return {
        "status": "collected",
        "saved": True,
        "matches": [
            {
                "leader_id": match["leader_id"],
                "leader_name": match["leader_name"],
                "matched_terms": match["matched_terms"]
            }
            for match in matches
        ],
        "mentions": saved_mentions
    }