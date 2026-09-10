from fastapi import APIRouter
import os
from pydantic import BaseModel
from typing import Optional
from supabase import create_client

router = APIRouter(prefix="/api/leaders", tags=["Leaders"])

def get_sb():
    url = os.getenv("SUPABASE_URL","").strip()
    key = os.getenv("SUPABASE_ANON_KEY","").strip()
    if not url or not key: return None
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
    if not sb: return {"leaders": []}
    try:
        data = sb.table("leaders").select("*").order("created_at", desc=True).execute().data or []
        return {"leaders": data, "success": True}
    except Exception as e:
        print(f"get leaders error: {e}")
        return {"leaders": [], "success": False, "error": str(e)}

@router.post("")
async def add_leader(payload: LeaderCreate):
    sb = get_sb()
    if not sb: return {"success": False, "message": "Supabase not configured"}
    try:
        res = sb.table("leaders").insert({
            "full_name": payload.full_name.strip(),
            "public_name": payload.public_name.strip() if payload.public_name else payload.full_name.strip(),
            "position": payload.position,
            "organization": payload.organization,
            "keywords": payload.keywords,
            "nicknames": payload.nicknames,
            "monitoring_enabled": payload.monitoring_enabled
        }).execute()
        return {"success": True, "leader": res.data[0] if res.data else None}
    except Exception as e:
        print(f"add leader error: {e}")
        return {"success": False, "message": str(e)}

@router.put("/{leader_id}")
async def update_leader(leader_id: str, payload: LeaderCreate):
    sb = get_sb()
    if not sb: return {"success": False, "message": "No supabase"}
    try:
        res = sb.table("leaders").update({
            "full_name": payload.full_name.strip(),
            "public_name": payload.public_name.strip(),
            "position": payload.position,
            "organization": payload.organization,
            "keywords": payload.keywords,
            "nicknames": payload.nicknames,
            "monitoring_enabled": payload.monitoring_enabled
        }).eq("id", leader_id).execute()
        return {"success": True, "leader": res.data[0] if res.data else None}
    except Exception as e:
        print(e)
        return {"success": False, "message": str(e)}

@router.delete("/{leader_id}")
async def delete_leader(leader_id: str):
    sb = get_sb()
    try:
        sb.table("leaders").delete().eq("id", leader_id).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.patch("/{leader_id}/monitoring")
async def toggle_monitoring(leader_id: str):
    sb = get_sb()
    try:
        cur = sb.table("leaders").select("monitoring_enabled").eq("id", leader_id).single().execute()
        current = cur.data.get("monitoring_enabled", True) if cur.data else True
        sb.table("leaders").update({"monitoring_enabled": not current}).eq("id", leader_id).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "message": str(e)}