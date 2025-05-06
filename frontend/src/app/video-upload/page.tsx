'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { UploadCard } from '@/components/UploadCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AnalysisResult } from '@/utils/api';

const ProfessionalAnalysisView = dynamic(() => import('@/components/ProfessionalAnalysisView'), {
  loading: () => <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg" />
});

export default function VideoUploadPage() {
  const [analysisLevel, setAnalysisLevel] = useState<'basic' | 'advanced'>('basic');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);

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
            
            <UploadCard onUploadComplete={handleUploadComplete} />
            
            {analysisResults && (
              <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setAnalysisLevel('basic')}
                    className={`px-4 py-2 rounded-lg ${
                      analysisLevel === 'basic'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Basic Analysis
                  </button>
                  <button
                    onClick={() => setAnalysisLevel('advanced')}
                    className={`px-4 py-2 rounded-lg ${
                      analysisLevel === 'advanced'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Professional Analysis
                  </button>
                </div>
                
                {analysisLevel === 'advanced' ? (
                  <ProfessionalAnalysisView results={analysisResults} />
                ) : (
                  <div className="space-y-4">
                    {/* Basic analysis view */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
                      <p className="text-gray-600">
                        {`Video duration: ${analysisResults.video_info.duration}, 
                          Total frames: ${analysisResults.video_info.total_frames}, 
                          Processed frames: ${analysisResults.video_info.processed_frames}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 