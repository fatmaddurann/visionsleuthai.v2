'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CameraCard } from '@/components/CameraCard';
import ForensicLiveAnalysisBox from '@/components/forensic/ForensicLiveAnalysisBox';
import jsPDF from 'jspdf';
import ForensicDashboard from '@/components/forensic/ForensicDashboard';
import { useForensicAnalysis } from '@/components/forensic/useForensicAnalysis';
import { LiveAnalysisResults } from '@/components/forensic/LiveAnalysisResults';
import { ForensicAnalysisResults, DetectionWithTimestamp } from '@/components/forensic/ForensicAnalysisResults';

// Tip tanımları
interface Detection {
  type: string;
  confidence: number;
  x: number;
  y: number;
}
interface AnalysisResult {
  timestamp: string;
  detections: Detection[];
}

// ForensicDashboard için veri dönüşüm fonksiyonu
type ForensicReport = {
  crimeAnalysis: {
    temporalAnalysis: { eventTimeline: any[] };
    spatialMapping: { hotSpotCoordinates: any[] };
  };
  forensicVisualizations: any;
  expertOpinion: any;
};

const transformResultsForDashboard = (results: AnalysisResult[]): ForensicReport => {
  const eventTimeline = results.flatMap(result =>
    result.detections.map(det => ({
      timestamp: result.timestamp,
      eventType: det.type,
      confidence: det.confidence / 100,
      evidentiaryValue: det.confidence > 80 ? 'high' : det.confidence > 60 ? 'medium' : 'low',
    }))
  );
  const hotSpotCoordinates = results.flatMap(result =>
    result.detections.map(det => ({
      x: det.x,
      y: det.y,
      crimeType: det.type,
      intensity: det.confidence / 100,
    }))
  );
  return {
    crimeAnalysis: {
      temporalAnalysis: { eventTimeline },
      spatialMapping: { hotSpotCoordinates },
    },
    forensicVisualizations: {},
    expertOpinion: {},
  };
};

function drawDetectionsOnCanvas(canvas: HTMLCanvasElement, detections: Detection[]) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  detections.forEach((det: Detection) => {
    ctx.strokeStyle = det.type === 'Gun' ? 'red' : det.type === 'Knife' ? 'orange' : 'yellow';
    ctx.lineWidth = 2;
    ctx.strokeRect(det.x, det.y, 50, 50); // bbox yerine örnek değer
    ctx.font = '14px Arial';
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(`${det.type} (${Math.round(det.confidence)}%)`, det.x, det.y - 5);
  });
}

export default function LiveAnalysisPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frameResults, setFrameResults] = useState<DetectionWithTimestamp[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Kamera başlat
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStarted(true);
      }
    } catch (err) {
      alert('Camera access denied or not available.');
    }
  };

  // Kamera durdur
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      setCameraStarted(false);
      setIsAnalyzing(false);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Her 500ms'de bir frame'i backend'e POST et
  useEffect(() => {
    if (!isAnalyzing || !cameraStarted) return;
    const sendFrame = async () => {
      if (!videoRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/live-analysis/frame`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
           },
          body: JSON.stringify({ image: imageData }),
        });
        const data = await response.json();
        const now = new Date().toLocaleString();
        // Her detection'a timestamp ve risk ekle
        const detections = (data.detections || []).map((det: any) => ({
          type: det.type || det.class_name,
          confidence: det.confidence,
          bbox: det.bbox || [0,0,0,0],
          timestamp: now,
          risk: ['knife','gun','weapon'].some(keyword => (det.type || det.class_name || '').toLowerCase().includes(keyword)) ? 'High' : 'Low',
        }));
        setFrameResults(prev => [
          ...detections,
          ...prev
        ].slice(0, 100));
      } catch (e) { /* ignore */ }
    };
    intervalRef.current = setInterval(sendFrame, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isAnalyzing, cameraStarted]);

  const handleDownloadPDF = () => {
    // PDF generation logic (isteğe bağlı)
    alert('PDF generation is not implemented in this demo.');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-white pt-20 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center">
          <div className="space-y-6 w-full flex flex-col items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Forensic Live Analysis
              </h1>
              <p className="text-xl text-gray-600">
                Real-time crime behavior detection through your camera
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex gap-4">
                <button
                  onClick={cameraStarted ? stopCamera : startCamera}
                  className={`px-6 py-2 rounded-lg font-bold transition-colors ${cameraStarted ? 'bg-gray-500 hover:bg-gray-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  disabled={isAnalyzing}
                >
                  {cameraStarted ? 'Stop Camera' : 'Start Camera'}
                </button>
                <button
                  onClick={() => setIsAnalyzing(!isAnalyzing)}
                  className={`px-6 py-2 rounded-lg font-bold transition-colors ${isAnalyzing ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'} text-white`}
                  disabled={!cameraStarted}
                >
                  {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
                </button>
              </div>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4 w-full max-w-xl flex items-center justify-center relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ background: '#000', minHeight: 320 }}
                />
              </div>
            </div>
            <div className="flex justify-center w-full">
              <ForensicAnalysisResults
                results={frameResults}
                isAnalyzing={isAnalyzing}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 
