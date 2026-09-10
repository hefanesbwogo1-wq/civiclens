from fastapi import APIRouter
import os
from supabase import create_client, Client

router = APIRouter(prefix="/api/reports", tags=["Reports"])

def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    if not url or not key:
        return None
    return create_client(url, key)

@router.get("/summary")
async def report_summary():
    sb = get_supabase()
    if not sb:
        return {"success": True, "total_mentions": 0, "positive": 0, "neutral": 0, "negative": 0, "tracked_leaders": 0, "active_platforms": 0}
    try:
        # total
        total = sb.table("mentions").select("id", count="exact").execute().count or 0
        pos = sb.table("mentions").select("id", count="exact").ilike("sentiment","positive").execute().count or 0
        neu = sb.table("mentions").select("id", count="exact").ilike("sentiment","neutral").execute().count or 0
        neg = sb.table("mentions").select("id", count="exact").ilike("sentiment","negative").execute().count or 0
        
        # distinct counts - fetch and dedupe (Supabase doesn't have count distinct easily)
        leaders_data = sb.table("mentions").select("leader_name").not_.is_("leader_name","null").execute().data or []
        platforms_data = sb.table("mentions").select("platform").not_.is_("platform","null").execute().data or []
        tracked_leaders = len(set([r["leader_name"].strip() for r in leaders_data if r.get("leader_name") and r["leader_name"].strip()]))
        active_platforms = len(set([r["platform"].strip() for r in platforms_data if r.get("platform") and r["platform"].strip()]))

        return {"success": True, "total_mentions": total, "positive": pos, "neutral": neu, "negative": neg, "tracked_leaders": tracked_leaders, "active_platforms": active_platforms}
    except Exception as e:
        print(f"Report summary error: {e}")
        return {"success": True, "total_mentions": 0, "positive": 0, "neutral": 0, "negative": 0, "tracked_leaders": 0, "active_platforms": 0}

@router.get("/platforms")
async def platform_report():
    sb = get_supabase()
    if not sb: return {"success": True, "platforms": []}
    try:
        data = sb.table("mentions").select("platform").not_.is_("platform","null").execute().data or []
        counts = {}
        for r in data:
            p = (r.get("platform") or "").strip()
            if not p: continue
            counts[p] = counts.get(p, 0) + 1
        platforms = [{"platform": k, "mentions": v} for k, v in sorted(counts.items(), key=lambda x: x[1], reverse=True)]
        return {"success": True, "platforms": platforms}
    except Exception as e:
        print(e)
        return {"success": True, "platforms": []}

@router.get("/leaders")
async def leader_report():
    sb = get_supabase()
    if not sb: return {"success": True, "leaders": []}
    try:
        data = sb.table("mentions").select("leader_name").not_.is_("leader_name","null").execute().data or []
        counts = {}
        for r in data:
            l = (r.get("leader_name") or "").strip()
            if not l: continue
            counts[l] = counts.get(l, 0) + 1
        leaders = [{"leader_name": k, "mentions": v} for k, v in sorted(counts.items(), key=lambda x: x[1], reverse=True)]
        return {"success": True, "leaders": leaders}
    except Exception as e:
        print(e)
        return {"success": True, "leaders": []}