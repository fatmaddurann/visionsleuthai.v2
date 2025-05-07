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
