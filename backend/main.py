from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt
from api.websocket import router as websocket_router
from config import config
import uvicorn
import asyncio

app = FastAPI(title="SignBridge AI - Optimized")

# Auth Models
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
    return encoded_jwt

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

@app.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    # PLACEHOLDER AUTH: In production, verify against a database
    if request.username == "admin" and request.password == "password":
        access_token = create_access_token(data={"sub": request.username})
        return {"access_token": access_token, "token_type": "bearer"}
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

if __name__ == "__main__":
    uvicorn.run(app, host=config.HOST, port=config.PORT)
