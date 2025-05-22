export interface AnalysisResult {
  id: string;
  status: string;
  timestamp: string;
  video_path: string;
  results_path: string | null;
  error: string | null;
  academic_metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusion_matrix: number[][];
    detection_metrics: {
      true_positives: number;
      false_positives: number;
      false_negatives: number;
    };
  };
  model_performance?: {
    inference_time: number;
    frames_processed: number;
    average_confidence: number;
  };
}

export const uploadVideo = async (formData: FormData): Promise<AnalysisResult> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Upload failed');
  }

  return response.json();
};

export const getAnalysisResults = async (videoId: string): Promise<AnalysisResult> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/analysis/${videoId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to get analysis results');
  }

  return response.json();
};

export function connectToWebSocket(
  onMessage: (result: AnalysisResult) => void,
  onError: (error: Error) => void
): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (event) => {
    try {
      const result = JSON.parse(event.data) as AnalysisResult;
      onMessage(result);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to parse WebSocket message'));
    }
  };
  ws.onerror = (error) => {
    onError(error instanceof Error ? error : new Error('WebSocket error occurred'));
  };
  return ws;
}

export async function startLiveAnalysis(): Promise<void> {
  try {
    const response = await fetch('/api/live-analysis/start', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to start live analysis');
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to start live analysis');
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export const sendFrame = async (imageData: string) => {
  try {
    const response = await fetch(`${API_URL}/live/frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process frame');
    }

    return await response.json();
  } catch (error) {
    console.error('Frame processing error:', error);
    throw error;
  }
};

export const getAcademicAnalysis = async (videoId: string): Promise<AnalysisResult> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/academic-analysis/${videoId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get academic analysis results');
    }

    return response.json();
  } catch (error) {
    console.error('Academic analysis error:', error);
    throw error;
  }
};

export const getDetailedAnalysis = async (videoId: string): Promise<{
  academic_metrics: AnalysisResult['academic_metrics'];
  model_performance: AnalysisResult['model_performance'];
  detection_summary: {
    total_detections: number;
    detection_by_class: Record<string, number>;
    confidence_distribution: number[];
  };
}> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/video/detailed-analysis/${videoId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get detailed analysis');
    }

    return response.json();
  } catch (error) {
    console.error('Detailed analysis error:', error);
    throw error;
  }
}; 
