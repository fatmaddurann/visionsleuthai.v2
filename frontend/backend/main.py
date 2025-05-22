import os, base64
import logging
import time

key_b64 = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
if key_b64:
    with open("/tmp/service-account.json", "wb") as f:
        f.write(base64.b64decode(key_b64))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/tmp/service-account.json"

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes import video_analysis, live_analysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS ayarlarını güncelle
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.visionsleuth.com",
        "https://visionsleuth.com",
        "http://localhost:3000"  # geliştirme için
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload limiti için middleware
@app.middleware("http")
async def check_file_size(request: Request, call_next):
    if request.url.path == "/upload":
        content_length = request.headers.get("content-length")
        if content_length:
            if int(content_length) > 500 * 1024 * 1024:  # 500MB limit
                return JSONResponse(
                    status_code=413,
                    content={"detail": "File too large. Maximum size is 500MB"}
                )
    return await call_next(request)

# Rate limiting için basit bir middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Error handling middleware
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

app.include_router(video_analysis.router, prefix="/video")
app.include_router(live_analysis.router, prefix="/live")

@app.get("/")
def read_root():
    return {"message": "VisionSleuth Backend is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}
