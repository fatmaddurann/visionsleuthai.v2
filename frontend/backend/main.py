import os, base64
import logging

key_b64 = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
if key_b64:
    with open("/tmp/service-account.json", "wb") as f:
        f.write(base64.b64decode(key_b64))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/tmp/service-account.json"

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes import video_analysis, live_analysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

origins = [
    "https://www.visionsleuth.com",
    "https://visionsleuth.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(video_analysis.router, prefix="/video")
app.include_router(live_analysis.router, prefix="/live")

@app.get("/")
def read_root():
    return {"message": "VisionSleuth Backend is running!"}

@app.post("/live/frame")
async def live_analysis_frame(request: Request):
    ...
