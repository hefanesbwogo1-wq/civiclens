from fastapi import APIRouter
import os

router = APIRouter(prefix="/api/debug", tags=["Debug"])

@router.get("")
async def debug():
    url = os.getenv("SUPABASE_URL","NOT SET")
    anon = os.getenv("SUPABASE_ANON_KEY","NOT SET")
    service = os.getenv("SUPABASE_SERVICE_KEY","NOT SET")
    return {
        "supabase_url_set": url != "NOT SET",
        "supabase_url_prefix": url[:30] if url != "NOT SET" else "NOT SET",
        "anon_key_set": anon != "NOT SET",
        "anon_key_len": len(anon) if anon != "NOT SET" else 0,
        "service_key_set": service != "NOT SET",
        "env_keys": [k for k in os.environ.keys() if "SUPABASE" in k]
    }