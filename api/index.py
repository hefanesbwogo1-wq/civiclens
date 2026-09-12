from pathlib import Path
import os
from fastapi import FastAPI
from fastapi.responses import FileResponse, Response, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="CivicLens")

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/config.js")
async def config_js():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_ANON_KEY", "")
    js = f'"use strict";\nwindow.SUPABASE_URL = {url!r};\nwindow.SUPABASE_ANON_KEY = {key!r};\n'
    return Response(content=js, media_type="application/javascript")

@app.get("/health")
async def health():
    return {"system": "CivicLens", "status": "online"}

def serve_page(name: str):
    file = FRONTEND_DIR / name
    if file.exists():
        return FileResponse(file)
    return JSONResponse({"error": f"{name} not found"}, status_code=404)

@app.get("/")
async def home(): return serve_page("index.html")
@app.get("/register")
async def reg(): return serve_page("register.html")
@app.get("/login")
async def login(): return serve_page("login.html")
@app.get("/dashboard")
async def dash(): return serve_page("dashboard.html")
@app.get("/leaders")
async def leaders(): return serve_page("leaders.html")
@app.get("/mentions")
async def mentions(): return serve_page("mentions.html")
@app.get("/platforms")
async def platforms(): return serve_page("platforms.html")
@app.get("/reports")
async def reports(): return serve_page("reports.html")
@app.get("/settings")
async def settings(): return serve_page("settings.html")
