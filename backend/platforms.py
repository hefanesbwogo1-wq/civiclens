from fastapi import APIRouter, Request

from .mentions import get_authenticated_supabase


router = APIRouter(
    prefix="/api/platforms",
    tags=["Platforms"],
)


PLATFORMS = [
    {
        "id": "x",
        "name": "X",
        "description": "Public conversations on X",
        "icon": "𝕏",
        "status": "available",
    },
    {
        "id": "facebook",
        "name": "Facebook",
        "description": "Monitoring is pending Meta API approval and integration",
        "icon": "f",
        "status": "coming_soon",
    },
    {
        "id": "instagram",
        "name": "Instagram",
        "description": "Public conversations on Instagram",
        "icon": "◎",
        "status": "coming_soon",
    },
    {
        "id": "youtube",
        "name": "YouTube",
        "description": "Public conversations on YouTube",
        "icon": "▶",
        "status": "coming_soon",
    },
]


def get_platform_counts(supabase, user_id: str) -> dict[str, int]:
    """Count this user's mentions by platform from Supabase."""

    response = (
        supabase.table("mentions")
        .select("platform")
        .eq("user_id", user_id)
        .execute()
    )

    counts: dict[str, int] = {}

    for row in response.data or []:
        platform = str(row.get("platform") or "").strip().lower()

        if platform:
            counts[platform] = counts.get(platform, 0) + 1

    return counts


@router.get("")
async def get_platforms(request: Request):
    supabase, user = get_authenticated_supabase(request)
    counts = get_platform_counts(supabase, user.id)

    return {
        "success": True,
        "platforms": [
            {
                **platform,
                "mention_count": counts.get(platform["id"], 0),
                "monitoring": platform["status"] == "available",
            }
            for platform in PLATFORMS
        ],
    }


@router.get("/stats")
async def platform_stats(request: Request):
    supabase, user = get_authenticated_supabase(request)
    counts = get_platform_counts(supabase, user.id)

    return {
        "success": True,
        "total_mentions": sum(counts.values()),
        "x_mentions": counts.get("x", 0),
        "facebook_mentions": counts.get("facebook", 0),
        "active_platforms": sum(
            platform["status"] == "available" for platform in PLATFORMS
        ),
    }
