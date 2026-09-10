from fastapi import APIRouter
import os
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
import traceback

router = APIRouter(prefix="/api/leaders", tags=["Leaders"])

def get_sb():
    url = os.getenv("SUPABASE_URL","").strip()
    key = os.getenv("SUPABASE_ANON_KEY","").strip() or os.getenv("SUPABASE_SERVICE_KEY","").strip()
    if not url or not key: 
        print("SUPABASE ENV MISSING")
        return None
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
    if not sb: 
        return {"leaders": [], "success": False, "message": "Supabase not configured - check Vercel env vars"}
    try:
        result = sb.table("leaders").select("*").order("created_at", desc=True).execute()
        print(f"GET leaders: {len(result.data) if result.data else 0} found")
        return {"leaders": result.data or [], "success": True}
    except Exception as e:
        print(f"GET LEADERS ERROR: {e}")
        traceback.print_exc()
        return {"leaders": [], "success": False, "message": str(e)}

@router.post("")
async def add_leader(payload: LeaderCreate):
    sb = get_sb()
    if not sb: 
        return {"success": False, "message": "Supabase env missing on Vercel"}
    try:
        print(f"Adding leader: {payload.full_name}")
        res = sb.table("leaders").insert({
            "full_name": payload.full_name.strip(),
            "public_name": payload.public_name.strip() if payload.public_name else payload.full_name.strip(),
            "position": payload.position or "",
            "organization": payload.organization or "",
            "keywords": payload.keywords or "",
            "nicknames": payload.nicknames or "",
            "monitoring_enabled": payload.monitoring_enabled if payload.monitoring_enabled is not None else True
        }).execute()
        print(f"Insert result: {res.data}")
        return {"success": True, "leader": res.data[0] if res.data else None}
    except Exception as e:
        print(f"ADD LEADER ERROR: {e}")
        traceback.print_exc()
        # Return error as JSON so frontend can show it
        return {"success": False, "message": f"DB Error: {str(e)}"}