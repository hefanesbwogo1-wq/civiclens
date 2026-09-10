from pathlib import Path
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

# =========================================================
# CIVICLENS BASE PATH
# =========================================================
BASE_DIR = Path(__file__).resolve().parent.parent

# =========================================================
# LOAD ENV - Works locally AND on Vercel
# =========================================================
# Try .env.local first, then .env, then Vercel Env Vars
for env_file in [BASE_DIR / ".env.local", BASE_DIR / ".env"]:
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)

# Vercel injects env vars directly, so os.getenv will still work
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()

print("=========================================================")
print(" CIVICLENS SERVER CONFIGURATION")
print("=========================================================")
print("SUPABASE_URL:", SUPABASE_URL if SUPABASE_URL else "NOT CONFIGURED")
print("SUPABASE_ANON_KEY:", "LOADED" if SUPABASE_ANON_KEY else "NOT CONFIGURED")
print("=========================================================")

# =========================================================
# ROUTERS
# =========================================================
from .auth import router as auth_router
from .leaders import router as leaders_router
from .mentions import router as mentions_router
from .platforms import router as platforms_router
from .reports import router as reports_router

# =========================================================
# FASTAPI APPLICATION
# =========================================================
app = FastAPI(
    title="CivicLens",
    description="Public Conversation Intelligence Platform",
    version="1.0.0"
)

# =========================================================
# STATIC FILES
# =========================================================
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# =========================================================
# API ROUTERS
# =========================================================
app.include_router(auth_router)
app.include_router(leaders_router)
app.include_router(mentions_router)
app.include_router(platforms_router)
app.include_router(reports_router)

# =========================================================
# FRONTEND SUPABASE CONFIG
# =========================================================
@app.get("/config.js")
async def frontend_config():
    javascript = f'''"use strict";
window.SUPABASE_URL = {SUPABASE_URL!r};
window.SUPABASE_ANON_KEY = {SUPABASE_ANON_KEY!r};
'''
    return Response(content=javascript, media_type="application/javascript")

# =========================================================
# FRONTEND PAGES
# =========================================================
@app.get("/")
async def home(): return FileResponse(BASE_DIR / "frontend" / "index.html")
@app.get("/register")
async def register_page(): return FileResponse(BASE_DIR / "frontend" / "register.html")
@app.get("/login")
async def login_page(): return FileResponse(BASE_DIR / "frontend" / "login.html")
@app.get("/dashboard")
async def dashboard_page(): return FileResponse(BASE_DIR / "frontend" / "dashboard.html")
@app.get("/leaders")
async def leaders_page(): return FileResponse(BASE_DIR / "frontend" / "leaders.html")
@app.get("/mentions")
async def mentions_page(): return FileResponse(BASE_DIR / "frontend" / "mentions.html")
@app.get("/platforms")
async def platforms_page(): return FileResponse(BASE_DIR / "frontend" / "platforms.html")
@app.get("/reports")
async def reports_page(): return FileResponse(BASE_DIR / "frontend" / "reports.html")
@app.get("/settings")
async def settings_page(): return FileResponse(BASE_DIR / "frontend" / "settings.html")

# =========================================================
# HEALTH CHECK
# =========================================================
@app.get("/health")
async def health():
    return {"system": "CivicLens", "status": "online", "message": "CivicLens is running successfully."}
from .debug import router as debug_router
app.include_router(debug_router)

