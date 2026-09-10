from fastapi import APIRouter, Request, Query, HTTPException
from typing import Optional
import os

from supabase import create_client, Client


router = APIRouter(
    prefix="/api/mentions",
    tags=["Mentions"]
)


# ============================================================
# SUPABASE CONFIGURATION
# ============================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()


def get_supabase() -> Client:
    """
    Create a Supabase client using the public/anon key.
    """
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration is missing."
        )

    return create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )


# ============================================================
# AUTHENTICATION
# ============================================================

def get_authenticated_supabase(request: Request):
    """
    Authenticate the current CivicLens user using the
    Supabase access token supplied by the frontend.
    """

    authorization = request.headers.get("Authorization", "")

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    access_token = authorization.replace(
        "Bearer ",
        "",
        1
    ).strip()

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    try:
        supabase = get_supabase()

        user_response = supabase.auth.get_user(
            access_token
        )

        user = user_response.user

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session."
            )

        # Important:
        # Run database queries using the authenticated user's
        # access token so Supabase RLS applies correctly.
        supabase.postgrest.auth(access_token)

        return supabase, user

    except HTTPException:
        raise

    except Exception as error:
        print(
            "CivicLens authentication error:",
            error
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )


# ============================================================
# MENTION STATISTICS
# ============================================================

@router.get("/stats")
async def mention_stats(request: Request):
    """
    Return total and sentiment statistics for the
    authenticated user's mentions.
    """

    supabase, user = get_authenticated_supabase(
        request
    )

    try:

        response = (
            supabase
            .table("mentions")
            .select("sentiment")
            .eq("user_id", user.id)
            .execute()
        )

        rows = response.data or []

        total = len(rows)

        positive = sum(
            1
            for row in rows
            if str(
                row.get("sentiment") or ""
            ).lower() == "positive"
        )

        neutral = sum(
            1
            for row in rows
            if str(
                row.get("sentiment") or ""
            ).lower() == "neutral"
        )

        negative = sum(
            1
            for row in rows
            if str(
                row.get("sentiment") or ""
            ).lower() == "negative"
        )

        return {
            "success": True,
            "total": total,
            "positive": positive,
            "neutral": neutral,
            "negative": negative
        }

    except Exception as error:

        print(
            "CivicLens mention statistics error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load mention statistics."
        )


# ============================================================
# GET ALL MENTIONS
# ============================================================

@router.get("")
async def get_mentions(
    request: Request,
    search: Optional[str] = Query(default=None),
    leader: Optional[str] = Query(default=None),
    platform: Optional[str] = Query(default=None),
    sentiment: Optional[str] = Query(default=None)
):
    """
    Return mentions belonging to the authenticated user.

    Optional filters:
        search
        leader
        platform
        sentiment
    """

    supabase, user = get_authenticated_supabase(
        request
    )

    try:

        query = (
            supabase
            .table("mentions")
            .select(
                """
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
                """
            )
            .eq("user_id", user.id)
            .order(
                "published_at",
                desc=True
            )
            .limit(100)
        )

        # ----------------------------------------------------
        # SEARCH
        # ----------------------------------------------------

        if search:

            value = search.strip()

            if value:

                query = query.or_(
                    (
                        "content.ilike.%{0}%,"
                        "author_name.ilike.%{0}%,"
                        "author_handle.ilike.%{0}%,"
                        "leader_name.ilike.%{0}%"
                    ).format(value)
                )

        # ----------------------------------------------------
        # LEADER FILTER
        # ----------------------------------------------------

        if leader:

            leader_value = leader.strip()

            if leader_value:

                query = query.eq(
                    "leader_name",
                    leader_value
                )

        # ----------------------------------------------------
        # PLATFORM FILTER
        # ----------------------------------------------------

        if platform:

            platform_value = (
                platform
                .strip()
                .lower()
            )

            if platform_value:

                query = query.eq(
                    "platform",
                    platform_value
                )

        # ----------------------------------------------------
        # SENTIMENT FILTER
        # ----------------------------------------------------

        if sentiment:

            sentiment_value = (
                sentiment
                .strip()
                .lower()
            )

            if sentiment_value:

                query = query.ilike(
                    "sentiment",
                    sentiment_value
                )

        response = query.execute()

        mentions = response.data or []

        # ----------------------------------------------------
        # SAFETY SORT
        # ----------------------------------------------------

        def sort_key(item):

            return (
                item.get("published_at")
                or item.get("created_at")
                or ""
            )

        mentions.sort(
            key=sort_key,
            reverse=True
        )

        return {
            "success": True,
            "count": len(mentions),
            "mentions": mentions
        }

    except Exception as error:

        print(
            "CivicLens mentions error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load mentions."
        )


# ============================================================
# REGISTERED LEADERS
# ============================================================

@router.get("/leaders")
async def mention_leaders(request: Request):
    """
    Return ALL leaders registered by the authenticated user.

    IMPORTANT:
    This endpoint intentionally reads from the `leaders`
    table rather than the `mentions` table.

    Therefore a newly registered leader will appear on the
    Mentions page even when that leader currently has ZERO
    mentions.
    """

    supabase, user = get_authenticated_supabase(
        request
    )

    try:

        response = (
            supabase
            .table("leaders")
            .select(
                """
                id,
                full_name,
                public_name,
                position,
                organization,
                monitoring_enabled
                """
            )
            .eq("user_id", user.id)
            .order(
                "full_name",
                desc=False
            )
            .execute()
        )

        rows = response.data or []

        leaders = []

        for row in rows:

            full_name = (
                str(
                    row.get("full_name") or ""
                ).strip()
            )

            public_name = (
                str(
                    row.get("public_name") or ""
                ).strip()
            )

            # Prefer public name when available.
            display_name = (
                public_name
                or full_name
            )

            if not display_name:
                continue

            leaders.append(
                {
                    "id": row.get("id"),
                    "full_name": full_name,
                    "public_name": public_name,
                    "display_name": display_name,
                    "position": row.get("position"),
                    "organization": row.get("organization"),
                    "monitoring_enabled": (
                        row.get("monitoring_enabled")
                        if row.get("monitoring_enabled")
                        is not None
                        else True
                    )
                }
            )

        return {
            "success": True,
            "count": len(leaders),
            "leaders": leaders
        }

    except Exception as error:

        print(
            "CivicLens registered leaders error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load registered leaders."
        )


# ============================================================
# SINGLE MENTION
# ============================================================

@router.get("/{mention_id}")
async def get_mention(
    request: Request,
    mention_id: int
):
    """
    Return one mention belonging to the authenticated user.
    """

    supabase, user = get_authenticated_supabase(
        request
    )

    try:

        response = (
            supabase
            .table("mentions")
            .select(
                """
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
                """
            )
            .eq(
                "id",
                mention_id
            )
            .eq(
                "user_id",
                user.id
            )
            .maybe_single()
            .execute()
        )

        mention = response.data

        if not mention:

            raise HTTPException(
                status_code=404,
                detail="Mention not found."
            )

        return {
            "success": True,
            "mention": mention
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "CivicLens single mention error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load mention."
        )