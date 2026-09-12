from pathlib import Path
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent

for env_file in [BASE_DIR / ".env.local", BASE_DIR / ".env"]:
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=False)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()

print("=========================================================")
print(" CIVICLENS SERVER CONFIGURATION")
print("=========================================================")
print("SUPABASE_URL:", SUPABASE_URL if SUPABASE_URL else "NOT CONFIGURED")
print("SUPABASE_ANON_KEY:", "LOADED" if SUPABASE_ANON_KEY else "NOT CONFIGURED")
print("=========================================================")

app = FastAPI(title="CivicLens", description="Public Conversation Intelligence Platform", version="1.0.0")

# Static
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# SAFE ROUTER IMPORTS - won't crash if one fails
def safe_include(module_path, router_name="router"):
    try:
        module = __import__(module_path, fromlist=[router_name])
        router = getattr(module, router_name)
        app.include_router(router)
        print(f"✅ Loaded {module_path}")
    except Exception as e:
        print(f"⚠️ Failed to load {module_path}: {e}")

safe_include("backend.auth")
safe_include("backend.leaders")
safe_include("backend.mentions")
safe_include("backend.platforms")
safe_include("backend.reports")
safe_include("backend.profiles")
safe_include("backend.collector.routes")
safe_include("backend.collector.cron")

@app.get("/config.js")
async def frontend_config():
    javascript = f'"use strict";\nwindow.SUPABASE_URL = {SUPABASE_URL!r};\nwindow.SUPABASE_ANON_KEY = {SUPABASE_ANON_KEY!r};\n'
    return Response(content=javascript, media_type="application/javascript")

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

@app.get("/health")
async def health():
    return {"system": "CivicLens", "status": "online", "message": "CivicLens is running successfully."}