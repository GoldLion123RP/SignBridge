from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from api.websocket import router as websocket_router
from config import config
import uvicorn
import asyncio

app = FastAPI(title="SignBridge AI - Optimized")

# Load CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the refactored WebSocket router
app.include_router(websocket_router)

@app.on_event("startup")
async def startup_event():
    print("="*60)
    print("🚀 SIGNBRIDGE ENGINE - INITIALIZING")
    
    # Warm up ML Pipeline in a separate thread to avoid blocking startup
    from core.ml_pipeline import SignLanguagePipeline
    pipeline = SignLanguagePipeline()
    await asyncio.to_thread(pipeline.warm_up)
    
    print("🚀 SIGNBRIDGE ENGINE - NEURAL LINK READY")
    print(f"📡 Interface: http://{config.HOST}:{config.PORT}")
    print(f"🔗 WebSocket: ws://{config.HOST}:{config.PORT}/ws/video")
    print(f"🔒 Allowed Origins: {config.ALLOWED_ORIGINS}")
    print("="*60)

@app.on_event("shutdown")
async def shutdown_event():
    from core.ml_pipeline import SignLanguagePipeline
    pipeline = SignLanguagePipeline()
    pipeline.close()
    print("[Engine] Shutdown complete.")

@app.get("/")
async def root():
    return HTMLResponse("""
        <h1>SignBridge AI Backend - Online</h1>
        <p>Neural Link Status: <span style="color: green;">ACTIVE</span></p>
        <p>Endpoint: <code>/ws/video</code></p>
    """)

if __name__ == "__main__":
    uvicorn.run(app, host=config.HOST, port=config.PORT)
