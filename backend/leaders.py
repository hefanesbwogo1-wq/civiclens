from fastapi import APIRouter, HTTPException
import os
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
import traceback

router = APIRouter(prefix="/api/leaders", tags=["Leaders"])

def get_sb():
    url = os.getenv("SUPABASE_URL","").strip()
    # Support both naming conventions
    key = os.getenv("SUPABASE_ANON_KEY","").strip() or os.getenv("SUPABASE_SERVICE_ROLE_KEY","").strip() or os.getenv("SUPABASE_SERVICE_KEY","").strip()
    if not url or not key: 
        raise HTTPException(status_code=500, detail=f"SUPABASE URL or KEY missing. URL set={bool(url)} KEY set={bool(key)}")
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
    result = sb.table("leaders").select("*").order("created_at", desc=True).execute()
    return {"leaders": result.data or [], "success": True}

@router.post("")
async def add_leader(payload: LeaderCreate):
    sb = get_sb()
    try:
        if not payload.full_name or not payload.full_name.strip():
            raise HTTPException(status_code=400, detail="full_name required")
        data = {
            "full_name": payload.full_name.strip(),
            "public_name": (payload.public_name or payload.full_name).strip(),
            "position": payload.position or "",
            "organization": payload.organization or "",
            "keywords": payload.keywords or "",
            "nicknames": payload.nicknames or "",
            "monitoring_enabled": True if payload.monitoring_enabled is None else payload.monitoring_enabled
        }
        print(f"Inserting: {data}")
        res = sb.table("leaders").insert(data).execute()
        print(f"Insert OK: {res.data}")
        return {"success": True, "leader": res.data[0] if res.data else None}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        print(f"INSERT FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Insert failed: {str(e)}")