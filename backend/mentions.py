from fastapi import APIRouter, Request, Query, HTTPException
from typing import Optional

import os
from supabase import create_client, Client


# =========================================================
# CIVICLENS MENTIONS ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/mentions",
    tags=["Mentions"]
)


# =========================================================
# SUPABASE CONFIGURATION
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()


# =========================================================
# SUPABASE CLIENT
# =========================================================

def get_supabase() -> Client:

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase configuration is missing."
        )

    return create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )


# =========================================================
# AUTHENTICATED SUPABASE CLIENT
# =========================================================

def get_authenticated_supabase(request: Request):

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

        # Make Supabase REST requests run as this user.
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


# =========================================================
# GET MENTION STATISTICS
# =========================================================

@router.get("/stats")
async def mention_stats(
    request: Request
):

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


# =========================================================
# GET MENTIONS
# =========================================================

@router.get("")
async def get_mentions(

    request: Request,

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
            .eq(
                "user_id",
                user.id
            )
            .order(
                "published_at",
                desc=True
            )
            .limit(100)
        )


        # =================================================
        # SEARCH
        # =================================================

        if search:

            value = search.strip()

            if value:

                query = query.or_(
                    "content.ilike.%{}%,"
                    "author_name.ilike.%{}%,"
                    "author_handle.ilike.%{}%,"
                    "leader_name.ilike.%{}%"
                    .format(
                        value,
                        value,
                        value,
                        value
                    )
                )


        # =================================================
        # LEADER
        # =================================================

        if leader:

            query = query.eq(
                "leader_name",
                leader
            )


        # =================================================
        # PLATFORM
        # =================================================

        if platform:

            query = query.eq(
                "platform",
                platform
            )


        # =================================================
        # SENTIMENT
        # =================================================

        if sentiment:

            query = query.ilike(
                "sentiment",
                sentiment
            )


        response = query.execute()

        mentions = response.data or []


        # =================================================
        # SORT WITH CREATED DATE FALLBACK
        # =================================================

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


# =========================================================
# GET AVAILABLE LEADERS
# =========================================================

@router.get("/leaders")
async def mention_leaders(
    request: Request
):

    supabase, user = get_authenticated_supabase(
        request
    )

    try:

        response = (
            supabase
            .table("mentions")
            .select("leader_name")
            .eq(
                "user_id",
                user.id
            )
            .not_.is_(
                "leader_name",
                "null"
            )
            .execute()
        )

        rows = response.data or []

        leaders = sorted(
            {
                str(row.get("leader_name")).strip()
                for row in rows
                if row.get("leader_name")
                and str(
                    row.get("leader_name")
                ).strip()
            },
            key=str.lower
        )

        return {
            "success": True,
            "leaders": leaders
        }

    except Exception as error:

        print(
            "CivicLens mention leaders error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load mention leaders."
        )


# =========================================================
# GET SINGLE MENTION
# =========================================================

@router.get("/{mention_id}")
async def get_mention(

    request: Request,

    mention_id: int

):

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