from fastapi import FastAPI
try:
    from backend.main import app as backend_app
    app = backend_app
except Exception as e:
    print(f"Failed to import backend.main: {e}")
    app = FastAPI()
    @app.get("/")
    def root():
        return {"status": "fallback", "error": str(e)}
    @app.get("/api")
    def api_root():
        return {"message": "CivicLens API fallback"}
