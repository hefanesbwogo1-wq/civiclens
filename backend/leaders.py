from fastapi import APIRouter, HTTPException
import os
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
import traceback

router = APIRouter(prefix="/api/leaders", tags=["Leaders"])

def get_sb():
    url = (os.getenv("SUPABASE_URL") or "").strip()
    # Accept both naming conventions
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_SERVICE_KEY") or 
        os.getenv("SUPABASE_ANON_KEY") or ""
    ).strip()
    if not url or not key:
        raise HTTPException(status_code=500, detail=f"Supabase env missing. URL set={bool(url)} key set={bool(key)} Found keys: {[k for k in os.environ.keys() if 'SUPABASE' in k]}")
    return create_client(url, key)

class LeaderCreate(BaseModel):
    full_name: str
    public_name: Optional[str] = ""
    position: Optional[str] = ""
    organization: Optional[str] = ""
    keywords: Optional[str] = ""
    nicknames: Optional[str] = ""
    monitoring_enabled: Optional[bool] = True

@router.get("")
async def get_leaders():
    sb = get_sb()
    try:
        result = sb.table("leaders").select("*").order("created_at", desc=True).execute()
        return {"leaders": result.data or [], "success": True}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def add_leader(payload: LeaderCreate):
    sb = get_sb()
    try:
        if not payload.full_name.strip():
            raise HTTPException(status_code=400, detail="full_name required")
        res = sb.table("leaders").insert({
            "full_name": payload.full_name.strip(),
            "public_name": (payload.public_name or payload.full_name).strip(),
            "position": payload.position or "",
            "organization": payload.organization or "",
            "keywords": payload.keywords or "",
            "nicknames": payload.nicknames or "",
            "monitoring_enabled": True if payload.monitoring_enabled is None else payload.monitoring_enabled
        }).execute()
        return {"success": True, "leader": res.data[0] if res.data else None}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"DB Error: {str(e)}")

@router.put("/{leader_id}")
async def update_leader(leader_id: str, payload: LeaderCreate):
    sb = get_sb()
    try:
        res = sb.table("leaders").update({
            "full_name": payload.full_name.strip(),
            "public_name": payload.public_name,
            "position": payload.position,
            "organization": payload.organization,
            "keywords": payload.keywords,
            "nicknames": payload.nicknames,
            "monitoring_enabled": payload.monitoring_enabled
        }).eq("id", leader_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{leader_id}")
async def delete_leader(leader_id: str):
    sb = get_sb()
    try:
        sb.table("leaders").delete().eq("id", leader_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{leader_id}/monitoring")
async def toggle_monitoring(leader_id: str):
    sb = get_sb()
    try:
        cur = sb.table("leaders").select("monitoring_enabled").eq("id", leader_id).single().execute()
        current = cur.data.get("monitoring_enabled", True) if cur.data else True
        sb.table("leaders").update({"monitoring_enabled": not current}).eq("id", leader_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))