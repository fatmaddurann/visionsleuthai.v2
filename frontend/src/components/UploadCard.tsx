'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadVideo, getAnalysisResults, type AnalysisResult } from '@/utils/api';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import ForensicDashboard from './forensic/ForensicDashboard';

type UploadCardProps = {
  onUploadComplete: (results: AnalysisResult) => void;
};

const UploadCard = ({ onUploadComplete }: UploadCardProps): JSX.Element => {
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

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Dosya boyutu kontrolü
      if (file.size > 500 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 500MB');
      }

      // Dosya tipi kontrolü
      const allowedTypes = ['.mp4', '.mov', '.avi'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !allowedTypes.includes(`.${fileExt}`)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      }

      const formData = new FormData();
      formData.append('video', file);
      // Upload işlemi
      const analysisResult = await uploadVideo(file);
      
      setIsUploading(false);
      setSuccess(true);
      setIsAnalyzing(false);
      // Ensure analysisResult matches AnalysisResult type before setting
      if ('status' in analysisResult && 
          'timestamp' in analysisResult && 
          'video_path' in analysisResult &&
          'results_path' in analysisResult &&
          'error' in analysisResult &&
          'processingDate' in analysisResult &&
          'modelVersion' in analysisResult &&
          'summary' in analysisResult) {
        setAnalysisResults(analysisResult as AnalysisResult);
        onUploadComplete(analysisResult as AnalysisResult); 
      } else {
        throw new Error('Invalid analysis result format received from server');
      }
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

      // Create video preview
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);

      // Upload video
      await handleUpload(file);

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
    maxSize: 500 * 1024 * 1024, // 500MB
    disabled: isUploading
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {success ? (
          analysisResults && <ForensicDashboard report={analysisResults} />
        ) : (
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
              Supported formats: MP4, MOV (Max 500MB)
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
        )}
      </div>
    </div>
  );
};

export default UploadCard;
