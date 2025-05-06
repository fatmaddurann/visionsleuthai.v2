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
    const pollIntervalMs = 2000; // Poll every 2 seconds
    const maxAttempts = 60; // Maximum 2 minutes of polling
    let attempts = 0;

    const poll = async () => {
      try {
        const results = await getAnalysisResults(videoId);
        setAnalysisResults(results);
        setIsAnalyzing(false);
        setSuccess(true);
        onUploadComplete(results); // <-- Burası önemli!
        return;
      } catch (err) {
        if (err instanceof Error && err.message === 'Analysis results not found') {
          attempts++;
          if (attempts >= maxAttempts) {
            setError('Analysis timed out. Please try again.');
            setIsAnalyzing(false);
            return;
          }
          setTimeout(poll, pollIntervalMs);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to get analysis results');
          setIsAnalyzing(false);
        }
      }
    };

    poll();
  }, [onUploadComplete]);

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
      onUploadComplete(response); // <-- Burası önemli!
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
  }, [videoPreview, onUploadComplete]);

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
      {/* ... (mevcut JSX kodun değişmeden kalabilir) ... */}
      {/* Kodun JSX kısmı senin gönderdiğin gibi kalabilir */}
      {/* ... */}
    </div>
  );
};

export default UploadCard;
