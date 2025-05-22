import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, List
import uuid
import cv2
from datetime import datetime
from models.crime_detection_model import CrimeDetectionModel
from models.video_processor import VideoProcessor
from utils.gcp_connector import GCPConnector
import logging

# Logging ayarları
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
UPLOAD_DIR = "uploads"
analysis_tasks: Dict[str, Dict] = {}
ALLOWED_EXTENSIONS = {'.mp4', '.mov', '.avi'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Environment variable'dan bucket name'i al
BUCKET_NAME = os.getenv('GCP_BUCKET_NAME', 'crime-detection-data')  # String olarak tanımla
gcp = GCPConnector(bucket_name=BUCKET_NAME)  # Named parameter kullan

def process_video(video_id: str, video_path: str, gcp_path: str):
    try:
        # Initialize model and processor
        model = CrimeDetectionModel()
        processor = VideoProcessor(model)
        
        # Open video file
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception("Could not open video file")
        
        results = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Process frame
            frame_results = processor.process_frame(frame)
            results.append(frame_results)
            
        cap.release()
        
        # Save results to GCP
        results_path = gcp.save_results(video_id, {
            "video_path": gcp_path,
            "timestamp": datetime.utcnow().isoformat(),
            "frames": results
        })
        
        # Update task status
        analysis_tasks[video_id]["status"] = "completed"
        analysis_tasks[video_id]["results_path"] = results_path
        
        # Cleanup local file
        os.remove(video_path)
        
    except Exception as e:
        analysis_tasks[video_id]["status"] = "failed"
        analysis_tasks[video_id]["error"] = str(e)
        if os.path.exists(video_path):
            os.remove(video_path)

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...)
):
    try:
        # Dosya uzantısı kontrolü
        file_ext = os.path.splitext(video.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Dosya boyutu kontrolü
        content = await video.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum size is 500MB"
            )

        # Video işleme
        video_id = str(uuid.uuid4())
        temp_path = os.path.join(UPLOAD_DIR, f"{video_id}{file_ext}")
        
        try:
            with open(temp_path, "wb") as buffer:
                buffer.write(content)
            
            logger.info(f"Video saved temporarily: {temp_path}")
            
            # GCP'ye yükleme
            gcp_path = gcp.upload_video(temp_path)
            logger.info(f"Video uploaded to GCP: {gcp_path}")
            
            # Analiz task'ını başlat
            analysis_tasks[video_id] = {
                "status": "processing",
                "timestamp": datetime.utcnow(),
                "video_path": gcp_path,
                "results_path": None,
                "error": None
            }
            
            background_tasks.add_task(process_video, video_id, temp_path, gcp_path)
            
            return JSONResponse({
                "id": video_id,
                "message": "Video uploaded successfully and processing started"
            })
            
        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(status_code=500, detail=str(e))
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{video_id}")
async def get_analysis_results(video_id: str):
    if video_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="Analysis not found")
        
    task = analysis_tasks[video_id]
    
    if task["status"] == "failed":
        raise HTTPException(status_code=500, detail=task["error"])
        
    if task["status"] == "processing":
        return JSONResponse({
            "status": "processing",
            "message": "Video analysis is still in progress"
        })
    
    # Get results from GCP
    results = gcp.get_results(task["results_path"])
    
    # Generate temporary URL for video
    video_url = gcp.generate_signed_url(task["video_path"])
    
    return JSONResponse({
        "status": "completed",
        "video_url": video_url,
        "results": results
    }) 
