import cv2
import numpy as np
from datetime import datetime

class LiveAnalyzer:
    def __init__(self):
        self.frame_count = 0
        self.last_analysis_time = None

    def analyze_frame(self, frame):
        """
        OpenCV ile tehlikeli nesne tespiti (silah, bıçak, tüfek, çakı, bomba, bazuka vs) yapar.
        Basit bir renk, şekil ve kenar tabanlı analiz uygular.
        """
        try:
            result = {
                "dangerous_objects": [],
                "risk_score": 0.0,
                "detections": []
            }

            # Griye çevir ve kenarları bul
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blurred, 50, 150)
            
            # Kontur bul
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area < 500:  # çok küçük konturları atla
                    continue
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = w / float(h)
                # Uzun ince şekiller: bıçak, tüfek, çakı
                if aspect_ratio > 2.5 or aspect_ratio < 0.4:
                    result["dangerous_objects"].append({
                        "type": "knife/gun-like shape",
                        "bbox": [int(x), int(y), int(w), int(h)],
                        "confidence": 0.6 + min(area/10000, 0.3)
                    })
                # Büyük yuvarlak şekiller: bomba
                elif 0.8 < aspect_ratio < 1.2 and 1000 < area < 10000:
                    result["dangerous_objects"].append({
                        "type": "bomb-like shape",
                        "bbox": [int(x), int(y), int(w), int(h)],
                        "confidence": 0.5 + min(area/10000, 0.4)
                    })

            # Renk tabanlı: metalik gri, siyah, koyu renkler
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            # Metalik gri/siyah için maske
            lower_gray = np.array([0, 0, 40])
            upper_gray = np.array([180, 50, 180])
            mask_gray = cv2.inRange(hsv, lower_gray, upper_gray)
            gray_pixels = cv2.countNonZero(mask_gray)
            if gray_pixels > 2000:
                result["dangerous_objects"].append({
                    "type": "metallic object",
                    "confidence": 0.5 + min(gray_pixels/10000, 0.4),
                    "bbox": [0, 0, 0, 0]  # bbox yoksa default
                })

            # Risk skoru: tespit edilen nesne sayısı ve güvenine göre
            if result["dangerous_objects"]:
                result["risk_score"] = min(1.0, sum([o["confidence"] for o in result["dangerous_objects"]]) / len(result["dangerous_objects"]))
            else:
                result["risk_score"] = 0.1  # düşük risk

            result["detections"] = result["dangerous_objects"]

            # Frontend ile uyumlu rapor formatı
            event_timeline = [
                {
                    "timestamp": "0.00s",  # Canlı analizde tek frame olduğu için timestamp 0
                    "eventType": obj["type"],
                    "confidence": obj["confidence"],
                    "evidentiaryValue": "high" if obj["confidence"] > 0.8 else "medium"
                }
                for obj in result["dangerous_objects"]
            ]

            # Hotspot koordinatları
            hot_spot_coordinates = [
                {
                    "x": obj["bbox"][0] + obj["bbox"][2] // 2,  # bbox'ın merkez x koordinatı
                    "y": obj["bbox"][1] + obj["bbox"][3] // 2,  # bbox'ın merkez y koordinatı
                    "intensity": obj["confidence"],
                    "crimeType": obj["type"]
                }
                for obj in result["dangerous_objects"]
            ]

            # Her dangerous_object için bbox zorunlu olsun
            for obj in result["dangerous_objects"]:
                if "bbox" not in obj:
                    obj["bbox"] = [0, 0, 0, 0]

            return {
                "crimeAnalysis": {
                    "temporalAnalysis": {
                        "eventTimeline": event_timeline
                    },
                    "spatialMapping": {
                        "hotSpotCoordinates": hot_spot_coordinates
                    }
                },
                "risk_score": result["risk_score"],
                "detections": result["detections"]
            }
        except Exception as e:
            print(f"Error in analyze_frame: {str(e)}")
            return {
                "crimeAnalysis": {
                    "temporalAnalysis": {
                        "eventTimeline": []
                    },
                    "spatialMapping": {
                        "hotSpotCoordinates": []
                    }
                },
                "risk_score": 0.0,
                "detections": []
            } 