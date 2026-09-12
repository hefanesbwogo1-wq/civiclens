"""
CivicLens Collection API

Endpoints for testing and running the mention collection engine.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from .service import process_post
from .worker import run_collection
from .providers.registry import available_providers


router = APIRouter(
    prefix="/api/collector",
    tags=["Mention Collection"]
)


# =========================================================
# TEST POST MODEL
# =========================================================

class TestPost(BaseModel):
    platform: str
    external_id: Optional[str] = None
    author_name: Optional[str] = None
    author_handle: Optional[str] = None
    content: str
    post_url: Optional[str] = None
    sentiment: str = "neutral"
    published_at: Optional[datetime] = None


# =========================================================
# COLLECTION RUN MODEL
# =========================================================

class CollectionRequest(BaseModel):
    platforms: list[str] = ["x"]


# =========================================================
# AUTHENTICATION
# =========================================================

def get_authenticated_supabase(request: Request):
    """
    Validate the Supabase access token supplied by the browser.
    """

    authorization = request.headers.get("Authorization", "")

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    access_token = authorization[len("Bearer "):].strip()

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    try:
        from backend.mentions import get_supabase

        supabase = get_supabase()

        response = supabase.auth.get_user(access_token)

        user = response.user

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session."
            )

        # Make database queries run as the authenticated user.
        supabase.postgrest.auth(access_token)

        return supabase, user

    except HTTPException:
        raise

    except Exception as error:
        print(
            "CivicLens collector authentication error:",
            error
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )


# =========================================================
# TEST INGEST
# =========================================================

@router.post("/test-ingest")
async def test_ingest(
    request: Request,
    post: TestPost
):
    """
    Manually send a test social-media post
    through the CivicLens matching pipeline.
    """

    supabase, user = get_authenticated_supabase(request)

    post_data = post.model_dump()

    result = process_post(
        supabase,
        user.id,
        post_data
    )

    return {
        "success": True,
        "result": result
    }


# =========================================================
# RUN COLLECTION
# =========================================================

@router.post("/run")
async def run_collection_endpoint(
    request: Request,
    collection_request: CollectionRequest
):
    """
    Run the CivicLens collection worker for the
    currently authenticated user.
    """

    supabase, user = get_authenticated_supabase(request)

    # -----------------------------------------------------
    # Clean and validate requested platforms
    # -----------------------------------------------------

    platforms = []

    for platform in collection_request.platforms:

        platform_name = str(platform).strip().lower()

        if not platform_name:
            continue

        if platform_name not in platforms:
            platforms.append(platform_name)

    if not platforms:
        raise HTTPException(
            status_code=400,
            detail="At least one platform must be selected."
        )

    unsupported_platforms = set(platforms) - set(available_providers())

    if unsupported_platforms:
        names = ", ".join(sorted(unsupported_platforms))
        raise HTTPException(
            status_code=400,
            detail=f"Collection is not available for: {names}."
        )

    # -----------------------------------------------------
    # Run collection
    # -----------------------------------------------------

    try:

        result = await run_collection(
            supabase=supabase,
            user_id=user.id,
            platforms=platforms
        )

        return {
            "success": True,
            "message": "Collection completed successfully.",
            "result": result
        }

    except Exception as error:

        print(
            "CivicLens collection run error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Collection could not be completed."
        )
