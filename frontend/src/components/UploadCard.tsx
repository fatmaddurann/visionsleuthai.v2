'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadVideo, getAnalysisResults, type AnalysisResult } from '@/utils/api';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import ForensicDashboard from './forensic/ForensicDashboard';
import { UploadCard } from '@/components/UploadCard';

export function UploadCard() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  // Poll for analysis results
  const startPolling = useCallback(async (videoId: string) => {
    const pollInterval = 2000; // Poll every 2 seconds
    const maxAttempts = 60; // Maximum 2 minutes of polling
    let attempts = 0;

    const poll = async () => {
      try {
        const results = await getAnalysisResults(videoId);
        setAnalysisResults(results);
        setIsAnalyzing(false);
        setSuccess(true);
        return;
      } catch (err) {
        if (err instanceof Error && err.message === 'Analysis results not found') {
          attempts++;
          if (attempts >= maxAttempts) {
            setError('Analysis timed out. Please try again.');
            setIsAnalyzing(false);
            return;
          }
          setTimeout(poll, pollInterval);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to get analysis results');
          setIsAnalyzing(false);
        }
      }
    };

    poll();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setError(null);
      setSuccess(false);
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Create video preview
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      
      // Upload video with progress tracking
      const response = await uploadVideo(formData, (progress) => {
        const normalizedProgress = Math.min(Math.max(progress, 0), 100);
        setUploadProgress(Math.round(normalizedProgress * 10) / 10);
      });
      
      setIsUploading(false);
      setAnalysisResults(response);
      setSuccess(true);
      setIsAnalyzing(false);
    } catch (err) {
      setIsUploading(false);
      setError(err instanceof Error ? 
        err.message : 
        'An unexpected error occurred. Please try again later.'
      );
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      }
    }
  }, [videoPreview]);

  // Update dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024 * 1024, // 4GB
    disabled: isUploading
  });

  return (
    <div className="flex flex-col space-y-4">
      <div 
        {...getRootProps()} 
        className={`
          flex flex-col items-center justify-center p-8 
          border-2 border-dashed rounded-xl
          ${isDragActive ? 'border-blue-500 bg-blue-50/10' : 'border-gray-300/30'}
          transition-all duration-300 ease-in-out
          hover:border-blue-500/50 hover:bg-blue-50/10
          min-h-[200px]
          ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="w-full max-w-md">
              <div className="flex justify-between mb-2">
                <p className="text-blue-400 font-medium">Uploading video...</p>
                <p className="text-blue-400 font-medium">{uploadProgress.toFixed(1)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2 text-center">Please don't close this window while uploading</p>
            </div>
          </div>
        ) : (
          <>
            <CloudArrowUpIcon className="w-16 h-16 text-blue-500/70 mb-4" />
            <p className="text-gray-600 text-center">
              Drag & drop your video here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports MP4 and MOV formats up to 4GB
            </p>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-red-400 font-medium">Upload Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {videoPreview && (
        <div className="aspect-video bg-black/40 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoPreview}
            className="w-full h-full object-contain"
            controls
            playsInline
          />
        </div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-400">Analyzing video...</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && !isAnalyzing && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 font-medium">Video analysis completed successfully!</p>
        </div>
      )}

      {/* Analysis Results */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h3 className="text-xl font-semibold text-gray-800">Forensic Analysis Report</h3>
        {!analysisResults ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mt-4">No forensic report available yet</p>
            <p className="text-gray-400 text-sm mt-2">Upload a video to see the forensic analysis report</p>
          </div>
        ) : (
          <ForensicDashboard report={analysisResults} />
        )}
      </div>
    </div>
  );
}

export default UploadCard;
