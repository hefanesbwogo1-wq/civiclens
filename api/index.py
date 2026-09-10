import sys
from pathlib import Path
import traceback

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

try:
    from backend.main import app
    print("Backend imported OK")
except Exception as e:
    print("CRASH ON IMPORT:")
    traceback.print_exc()
    # Create a dummy app to show the error in browser
    from fastapi import FastAPI
    app = FastAPI()
    @app.get("/{full_path:path}")
    async def crash_report(full_path: str):
        return {"crash": str(e), "trace": traceback.format_exc()}
