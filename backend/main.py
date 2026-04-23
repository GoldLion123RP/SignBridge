from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from api.websocket import router as websocket_router
from config import config
import uvicorn

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

@app.get("/")
async def root():
    return HTMLResponse("<h1>SignBridge AI Backend - Optimized (512MB RAM Mode)</h1>")

if __name__ == "__main__":
    uvicorn.run(app, host=config.HOST, port=config.PORT)
