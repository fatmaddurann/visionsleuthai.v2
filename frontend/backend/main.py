import os, base64

key_b64 = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
if key_b64:
    with open("/tmp/service-account.json", "wb") as f:
        f.write(base64.b64decode(key_b64))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/tmp/service-account.json"

from fastapi import FastAPI
from routes import video_analysis, live_analysis
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS ayarını app TANIMLANDIKTAN SONRA ekle!
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://visionsleuth.com",
        "https://www.visionsleuth.com",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(video_analysis.router, prefix="/video")
app.include_router(live_analysis.router, prefix="/live")

@app.get("/")
def read_root():
    return {"message": "VisionSleuth Backend is running!"}
