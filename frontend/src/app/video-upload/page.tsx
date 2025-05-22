'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import UploadCard from '@/components/UploadCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AnalysisResult } from '@/utils/api';
import AcademicResults from '@/components/AcademicResults';

const ProfessionalAnalysisView = dynamic(() => import('@/components/ProfessionalAnalysisView'), {
  loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg" />
});

export default function VideoUploadPage() {
  const [analysisLevel, setAnalysisLevel] = useState<'basic' | 'advanced'>('basic');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (results: AnalysisResult) => {
    setAnalysisResults(results);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Video Analysis</h1>
            {!analysisResults ? (
              <UploadCard onUploadComplete={handleUploadComplete} />
            ) : (
              <div className="space-y-6">
                {/* Video Analysis Summary */}
                {analysisResults.summary && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="text-lg font-semibold">
                          {analysisResults.summary.duration.toFixed(2)}s
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Frames</p>
                        <p className="text-lg font-semibold">
                          {analysisResults.summary.totalFrames}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Processed Frames</p>
                        <p className="text-lg font-semibold">
                          {analysisResults.summary.processedFrames}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Video Format</p>
                        <p className="text-lg font-semibold">
                          {analysisResults.summary.format}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Academic Results */}
                {analysisResults.academic_metrics && (
                  <AcademicResults data={analysisResults} />
                )}

                {/* Model Performance */}
                {analysisResults.model_performance && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-2">Model Performance</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Inference Time</p>
                        <p className="text-lg font-semibold">
                          {analysisResults.model_performance.inference_time.toFixed(2)}ms
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Frames Processed</p>
                        <p className="text-lg font-semibold">
                          {analysisResults.model_performance.frames_processed}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Average Confidence</p>
                        <p className="text-lg font-semibold">
                          {(analysisResults.model_performance.average_confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 
