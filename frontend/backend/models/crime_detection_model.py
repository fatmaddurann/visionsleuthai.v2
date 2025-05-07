import torch
import os
import logging
from typing import Dict, Any, Tuple, List
import numpy as np
from ultralytics import YOLO
from frontend.backend.utils.gcp_connector import GCPConnector
logger = logging.getLogger(__name__)

class CrimeDetectionModel:
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.confidence_threshold = float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", "0.75"))
        self.gcp = GCPConnector()

    def load_model(self) -> Dict[str, Any]:
        """Load the YOLOv8 model from local path or GCP"""
        try:
            # First try to load from local path
            model_path = "yolov8x.pt"  # Using the larger model for better accuracy
            if not os.path.exists(model_path):
                # If not found locally, try to download from GCP
                gcp_status = self.gcp.connect()
                if gcp_status["status"] == "connected":
                    download_status = self.gcp.download_file(
                        "models/yolov8x.pt",
                        model_path
                    )
                    if download_status["status"] != "success":
                        raise ValueError(f"Failed to download model: {download_status['message']}")
                else:
                    raise ValueError(f"GCP connection failed: {gcp_status['message']}")

            # Load the model
            self.model = YOLO(model_path)
            logger.info(f"Model loaded successfully on {self.device}")
            
            return {
                "status": "loaded",
                "model_path": model_path,
                "device": str(self.device),
                "confidence_threshold": self.confidence_threshold
            }

        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

    def process_frame(self, frame: np.ndarray) -> Tuple[List[Dict[str, Any]], np.ndarray]:
        """Process a single frame and return detections with annotated frame"""
        try:
            if self.model is None:
                raise ValueError("Model not loaded")

            # Run inference
            results = self.model(frame, conf=self.confidence_threshold)[0]
            
            # Process detections
            detections = []
            for r in results.boxes.data.tolist():
                x1, y1, x2, y2, conf, cls = r
                detections.append({
                    "class_name": results.names[int(cls)],
                    "confidence": float(conf),
                    "bbox": [float(x1), float(y1), float(x2), float(y2)]
                })

            # Get annotated frame
            annotated_frame = results.plot()

            return detections, annotated_frame

        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return [], frame

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and status"""
        return {
            "status": "loaded" if self.model is not None else "not_loaded",
            "device": str(self.device),
            "confidence_threshold": self.confidence_threshold,
            "model_type": "YOLOv8x" if self.model is not None else None
        } 
