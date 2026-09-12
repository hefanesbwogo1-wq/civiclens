from collections import Counter

from fastapi import APIRouter, HTTPException, Request

from .mentions import get_authenticated_supabase


router = APIRouter(prefix="/api/reports", tags=["Reports"])


def get_user_mentions(request: Request) -> list[dict]:
    """Load report fields only for the authenticated user's mentions."""

    supabase, user = get_authenticated_supabase(request)

    try:
        response = (
            supabase.table("mentions")
            .select("sentiment,leader_name,platform")
            .eq("user_id", user.id)
            .execute()
        )
    except Exception as error:
        print("CivicLens report query failed:", error)
        raise HTTPException(status_code=500, detail="Unable to load reports.") from error

    return response.data or []


def count_nonempty(rows: list[dict], field: str) -> Counter:
    return Counter(
        value
        for row in rows
        if (value := str(row.get(field) or "").strip())
    )


@router.get("/summary")
async def report_summary(request: Request):
    mentions = get_user_mentions(request)
    sentiments = count_nonempty(mentions, "sentiment")

    return {
        "success": True,
        "total_mentions": len(mentions),
        "positive": sentiments["positive"],
        "neutral": sentiments["neutral"],
        "negative": sentiments["negative"],
        "tracked_leaders": len(count_nonempty(mentions, "leader_name")),
        "active_platforms": len(count_nonempty(mentions, "platform")),
    }


@router.get("/platforms")
async def platform_report(request: Request):
    counts = count_nonempty(get_user_mentions(request), "platform")

    return {
        "success": True,
        "platforms": [
            {"platform": platform, "mentions": mentions}
            for platform, mentions in counts.most_common()
        ],
    }


@router.get("/leaders")
async def leader_report(request: Request):
    counts = count_nonempty(get_user_mentions(request), "leader_name")

    return {
        "success": True,
        "leaders": [
            {"leader_name": leader_name, "mentions": mentions}
            for leader_name, mentions in counts.most_common()
        ],
    }
