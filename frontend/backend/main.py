import os
import base64

key_b64 = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
if key_b64:
    with open("/tmp/service-account.json", "wb") as f:
        f.write(base64.b64decode(key_b64))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/tmp/service-account.json"
from fastapi import FastAPI
from routes import video_analysis, live_analysis


app = FastAPI()

# Video analizi router'ı /video prefix'i ile
app.include_router(video_analysis.router, prefix="/video")

# Canlı analiz router'ı /live prefix'i ile
app.include_router(live_analysis.router, prefix="/live")

@app.get("/")
def read_root():
    return {"message": "VisionSleuth Backend is running!"}
