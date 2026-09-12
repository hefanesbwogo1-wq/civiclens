"""Protected scheduled collection entry point for Vercel Cron."""

import hmac
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from supabase import create_client

from .providers.registry import available_providers
from .worker import run_collection


router = APIRouter(tags=["Scheduled Collection"])


def has_valid_cron_secret(authorization: str | None) -> bool:
    """Validate Vercel's Bearer token without exposing the configured secret."""
    expected_secret = os.getenv("CRON_SECRET", "").strip()
    if not expected_secret or not authorization:
        return False
    return hmac.compare_digest(authorization.strip(), f"Bearer {expected_secret}")


def get_service_supabase():
    url = os.getenv("SUPABASE_URL", "").strip()
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not service_key:
        raise HTTPException(status_code=503, detail="Scheduled collection is not configured.")
    return create_client(url, service_key)


def get_monitored_user_ids(supabase) -> list[str]:
    response = (
        supabase.table("leaders")
        .select("user_id")
        .eq("monitoring_enabled", True)
        .execute()
    )
    return sorted({str(row["user_id"]) for row in response.data or [] if row.get("user_id")})


def create_run(supabase, user_id: str) -> str:
    response = (
        supabase.table("collection_runs")
        .insert({"user_id": user_id, "status": "running"})
        .execute()
    )
    if not response.data:
        raise RuntimeError("Unable to create collection run record.")
    return response.data[0]["id"]


def complete_run(supabase, run_id: str, status: str, result: dict) -> None:
    (
        supabase.table("collection_runs")
        .update(
            {
                "status": status,
                "result": result,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", run_id)
        .execute()
    )


@router.get("/api/cron/collect", include_in_schema=False)
async def scheduled_collection(request: Request):
    if not has_valid_cron_secret(request.headers.get("Authorization")):
        raise HTTPException(status_code=401, detail="Unauthorized.")

    supabase = get_service_supabase()
    platforms = available_providers()
    user_ids = get_monitored_user_ids(supabase)
    results = []

    for user_id in user_ids:
        run_id = create_run(supabase, user_id)
        try:
            result = await run_collection(supabase, user_id, platforms)
            errors = sum(item.get("errors", 0) for item in result.get("platforms", []))
            status = "completed_with_errors" if errors else "completed"
            complete_run(supabase, run_id, status, result)
            results.append({"user_id": user_id, "status": status})
        except Exception as error:
            print("CivicLens scheduled collection failed for user:", user_id, error)
            complete_run(
                supabase,
                run_id,
                "failed",
                {"message": "Collection failed. Review server logs for details."},
            )
            results.append({"user_id": user_id, "status": "failed"})

    return {
        "success": True,
        "users_processed": len(results),
        "failed": sum(item["status"] == "failed" for item in results),
    }
