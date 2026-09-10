from fastapi import APIRouter
import os
from pydantic import BaseModel
from supabase import create_client

router = APIRouter(prefix="/api/leaders", tags=["Leaders"])

def get_sb():
    url = os.getenv("SUPABASE_URL","").strip()
    key = os.getenv("SUPABASE_ANON_KEY","").strip()
    if not url or not key: return None
    return create_client(url, key)

class LeaderCreate(BaseModel):
    name: str
    party: str = ""
    position: str = ""
    region: str = ""

@router.get("")
async def get_leaders():
    sb = get_sb()
    if not sb: return []
    try:
        data = sb.table("leaders").select("*").order("name").execute().data or []
        return data
    except Exception as e:
        print(f"leaders get error: {e}")
        return []

@router.post("")
async def add_leader(leader: LeaderCreate):
    sb = get_sb()
    if not sb:
        return {"success": False, "error": "Supabase not configured"}
    try:
        # check duplicate
        existing = sb.table("leaders").select("id").eq("name", leader.name.strip()).execute().data
        if existing:
            return {"success": False, "error": "Leader already exists"}

        res = sb.table("leaders").insert({
            "name": leader.name.strip(),
            "party": leader.party,
            "position": leader.position,
            "region": leader.region
        }).execute()

        if res.data:
            return {"success": True, "leader": res.data[0]}
        return {"success": True}
    except Exception as e:
        print(f"add leader error: {e}")
        return {"success": False, "error": str(e)}

@router.delete("/{leader_id}")
async def delete_leader(leader_id: str):
    sb = get_sb()
    if not sb: return {"success": False}
    try:
        sb.table("leaders").delete().eq("id", leader_id).execute()
        return {"success": True}
    except Exception as e:
        print(e)
        return {"success": False, "error": str(e)}