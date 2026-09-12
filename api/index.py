import traceback
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

try:
    from backend.main import app
    print("backend.main loaded successfully")
except Exception as e:
    print(f"FAILED to import backend.main: {e}")
    traceback.print_exc()
    
    app = FastAPI()
    
    @app.get("/{full_path:path}")
    async def show_error(full_path: str):
        error_text = traceback.format_exc()
        return PlainTextResponse(
            f"CIVICLENS IMPORT CRASH:\n\n{error_text}\n\nError: {e}",
            status_code=500
        )
