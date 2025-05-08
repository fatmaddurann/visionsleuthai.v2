'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadVideo, getAnalysisResults, type AnalysisResult } from '@/utils/api';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import ForensicDashboard from './forensic/ForensicDashboard';

type UploadCardProps = {
  onUploadComplete: (results: AnalysisResult) => void;
};

const UploadCard: React.FC<UploadCardProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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
        onUploadComplete(results);
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
  }, [onUploadComplete]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const analysisResult = await uploadVideo(formData, setProgress);
      setIsUploading(false);
      setSuccess(true);
      setAnalysisResults(analysisResult);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setError(null);
      setSuccess(false);
      setIsUploading(true);
      setProgress(0);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Create video preview
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      
      // Upload video with progress tracking
      const response = await uploadVideo(formData, (progress) => {
        const normalizedProgress = Math.min(Math.max(progress, 0), 100);
        setProgress(Math.round(normalizedProgress * 10) / 10);
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
  }, []);

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
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {!success ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the video here'
                : 'Drag and drop a video file here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: MP4, MOV (Max 4GB)
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {isAnalyzing ? 'Analyzing video...' : 'Uploading...'} {progress}%
                </p>
              </div>
            )}
          </div>
        ) : analysisResults && (
          <ForensicDashboard report={analysisResults} />
        )}
      </div>
    </div>
  );
};

export default UploadCard;
