from fastapi import APIRouter, HTTPException, Request
import os
import traceback
from typing import Optional
from pydantic import BaseModel
from supabase import create_client

router = APIRouter(prefix="/api/leaders", tags=["Leaders"])

def get_supabase():
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase configuration is missing.")
    return create_client(url, key)

async def get_authenticated_supabase(request: Request):
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required.")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication header.")
    access_token = authorization[7:].strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="Access token missing.")
    try:
        sb = get_supabase()
        user_response = sb.auth.get_user(access_token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session.")
        sb.postgrest.auth(access_token)
        return sb, user
    except HTTPException:
        raise
    except Exception as e:
        print("CivicLens authentication error:", e)
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

class LeaderCreate(BaseModel):
    full_name: str
    public_name: Optional[str] = ""
    position: Optional[str] = ""
    organization: Optional[str] = ""
    keywords: Optional[str] = ""
    nicknames: Optional[str] = ""
    monitoring_enabled: Optional[bool] = True

@router.get("")
async def get_leaders(request: Request):
    try:
        sb, user = await get_authenticated_supabase(request)
        result = sb.table("leaders").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return {"leaders": result.data or [], "success": True}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Unable to load leaders: {str(e)}")

@router.post("")
async def add_leader(request: Request, payload: LeaderCreate):
    try:
        sb, user = await get_authenticated_supabase(request)
        if not payload.full_name or not payload.full_name.strip():
            raise HTTPException(status_code=400, detail="Full name is required.")
        data = {
            "user_id": user.id,
            "full_name": payload.full_name.strip(),
            "public_name": (payload.public_name or payload.full_name).strip(),
            "position": (payload.position or "").strip(),
            "organization": (payload.organization or "").strip(),
            "keywords": (payload.keywords or "").strip(),
            "nicknames": (payload.nicknames or "").strip(),
            "monitoring_enabled": True if payload.monitoring_enabled is None else payload.monitoring_enabled
        }
        result = sb.table("leaders").insert(data).execute()
        return {"success": True, "message": "Leader added successfully.", "leader": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Insert failed: {str(e)}")

@router.put("/{leader_id}")
async def update_leader(request: Request, leader_id: str, payload: LeaderCreate):
    try:
        sb, user = await get_authenticated_supabase(request)
        if not leader_id.strip():
            raise HTTPException(status_code=400, detail="Leader ID is required.")
        if not payload.full_name or not payload.full_name.strip():
            raise HTTPException(status_code=400, detail="Full name is required.")
        data = {
            "full_name": payload.full_name.strip(),
            "public_name": (payload.public_name or payload.full_name).strip(),
            "position": (payload.position or "").strip(),
            "organization": (payload.organization or "").strip(),
            "keywords": (payload.keywords or "").strip(),
            "nicknames": (payload.nicknames or "").strip(),
            "monitoring_enabled": True if payload.monitoring_enabled is None else payload.monitoring_enabled
        }
        result = sb.table("leaders").update(data).eq("id", leader_id).eq("user_id", user.id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Leader not found.")
        return {"success": True, "message": "Leader updated successfully.", "leader": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.delete("/{leader_id}")
async def delete_leader(request: Request, leader_id: str):
    try:
        sb, user = await get_authenticated_supabase(request)
        if not leader_id.strip():
            raise HTTPException(status_code=400, detail="Leader ID is required.")
        existing = sb.table("leaders").select("id, full_name").eq("id", leader_id).eq("user_id", user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Leader not found.")
        leader_name = existing.data[0].get("full_name") or "Leader"
        sb.table("leaders").delete().eq("id", leader_id).eq("user_id", user.id).execute()
        return {"success": True, "message": f"{leader_name} deleted successfully.", "leader_id": leader_id}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")