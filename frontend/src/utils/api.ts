export type AnalysisResult = {
  technicalFindings: string[];
  crimeAnalysis: Record<string, any>;
  forensicVisualizations: string[];
  expertOpinion: string;
  metadata: {
    duration: string;
    resolution: string;
    processingDate: string;
    modelVersion: string;
  };
  frames: Array<{
    frameNumber: number;
    timestamp: string;
    detections: Array<{
      type: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
    temporalFeatures: any;
    riskScore: number;
    contextualFactors: string[];
  }>;
  summary: {
    riskAssessment: any;
    crimeDistribution: Array<{ type: string; count: number; percentage: string }>;
    recommendations: {
      immediateActions: string[];
      longTermSuggestions: string[];
    };
    totalFrames: number;
    duration: string;
  };
};

export async function uploadVideo(
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload video');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to upload video');
  }
}

export async function getAnalysisResults(videoId: string): Promise<AnalysisResult> {
  try {
    const response = await fetch(`/api/analysis/${videoId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Analysis results not found');
      }
      throw new Error('Failed to get analysis results');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to get analysis results');
  }
}

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
