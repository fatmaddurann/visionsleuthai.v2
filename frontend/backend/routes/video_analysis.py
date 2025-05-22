import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional
import uuid
import cv2
from datetime import datetime
from models.crime_detection_model import CrimeDetectionModel
from models.video_processor import VideoProcessor
from utils.gcp_connector import GCPConnector
import logging
import numpy as np
import time

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
        
        # Video özelliklerini al
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        video_format = os.path.splitext(video_path)[1][1:].upper()
        
        results = []
        processed_frames = 0
        start_time = time.time()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Process frame
            frame_results = processor.process_frame(frame)
            results.append(frame_results)
            processed_frames += 1
            
        cap.release()
        
        # Performans metriklerini hesapla
        inference_time = (time.time() - start_time) * 1000 / processed_frames  # ms per frame
        
        # Sonuçları hazırla
        analysis_data = {
            "video_path": gcp_path,
            "timestamp": datetime.utcnow().isoformat(),
            "summary": {
                "duration": duration,
                "totalFrames": total_frames,
                "processedFrames": processed_frames,
                "videoSize": os.path.getsize(video_path),
                "format": video_format
            },
            "frames": results,
            "model_performance": {
                "inference_time": inference_time,
                "frames_processed": processed_frames,
                "average_confidence": sum(r.get("confidence", 0) for r in results) / len(results) if results else 0
            }
        }
        
        # Save results to GCP
        results_path = gcp.save_results(video_id, analysis_data)
        
        # Update task status
        analysis_tasks[video_id].update({
            "status": "completed",
            "results_path": results_path,
            "summary": analysis_data["summary"],
            "model_performance": analysis_data["model_performance"]
        })
        
        # Cleanup local file
        os.remove(video_path)
        
    except Exception as e:
        analysis_tasks[video_id]["status"] = "failed"
        analysis_tasks[video_id]["error"] = str(e)
        if os.path.exists(video_path):
            os.remove(video_path)

@router.post("/video/upload")
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
                "error": None,
                "summary": None,
                "model_performance": None
            }
            
            background_tasks.add_task(process_video, video_id, temp_path, gcp_path)
            
            return JSONResponse({
                "status": "success",
                "id": video_id
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

@router.get("/video/academic-analysis/{video_id}")
async def get_academic_analysis(video_id: str):
    try:
        # Analiz sonuçlarını veritabanından veya dosya sisteminden al
        analysis_data = get_analysis_data(video_id)
        
        if not analysis_data:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        # Akademik metrikleri hesapla
        academic_metrics = calculate_academic_metrics(analysis_data)
        
        return {
            "id": video_id,
            "status": "completed",
            "timestamp": datetime.utcnow().isoformat(),
            "academic_metrics": academic_metrics,
            "model_performance": calculate_model_performance(analysis_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_academic_metrics(analysis_data: Dict) -> Dict:
    """Akademik metrikleri hesapla"""
    try:
        # Örnek metrik hesaplamaları
        true_positives = analysis_data.get("true_positives", 0)
        false_positives = analysis_data.get("false_positives", 0)
        false_negatives = analysis_data.get("false_negatives", 0)
        
        # Temel metrikleri hesapla
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "accuracy": (true_positives + false_positives) / (true_positives + false_positives + false_negatives),
            "precision": precision,
            "recall": recall,
            "f1_score": f1_score,
            "confusion_matrix": analysis_data.get("confusion_matrix", []),
            "detection_metrics": {
                "true_positives": true_positives,
                "false_positives": false_positives,
                "false_negatives": false_negatives
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating metrics: {str(e)}")

def calculate_model_performance(analysis_data: Dict) -> Dict:
    """Model performans metriklerini hesapla"""
    return {
        "inference_time": analysis_data.get("inference_time", 0),
        "frames_processed": analysis_data.get("frames_processed", 0),
        "average_confidence": analysis_data.get("average_confidence", 0)
    } 
