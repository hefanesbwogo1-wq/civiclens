from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from .mentions import get_authenticated_supabase


router = APIRouter(prefix="/api/profile", tags=["Profile"])


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    organization: Optional[str] = Field(default=None, max_length=150)
    notification_preferences: Optional[dict[str, bool]] = None


@router.get("")
async def get_profile(request: Request):
    supabase, user = get_authenticated_supabase(request)
    response = (
        supabase.table("profiles")
        .select(
            "id,email,full_name,phone,organization,role,subscription_plan,notification_preferences"
        )
        .eq("id", user.id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found.")

    return {"success": True, "profile": response.data}


@router.put("")
async def update_profile(request: Request, payload: ProfileUpdate):
    supabase, user = get_authenticated_supabase(request)
    data = payload.model_dump(exclude_unset=True)

    if not data:
        raise HTTPException(status_code=400, detail="No profile changes were supplied.")

    for field in ("full_name", "phone", "organization"):
        if field in data and data[field] is not None:
            data[field] = data[field].strip()

    response = (
        supabase.table("profiles")
        .update(data)
        .eq("id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found.")

    return {"success": True, "profile": response.data[0]}
