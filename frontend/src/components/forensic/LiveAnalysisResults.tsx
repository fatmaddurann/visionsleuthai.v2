import React from 'react';
import { Detection } from './useForensicAnalysis';

interface LiveAnalysisResultsProps {
  results: Detection[];
  isAnalyzing: boolean;
  onDownloadPDF: () => void;
}

export const LiveAnalysisResults: React.FC<LiveAnalysisResultsProps> = ({
  results,
  isAnalyzing,
  onDownloadPDF,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Live Analysis Results</h2>
        <button
          onClick={onDownloadPDF}
          disabled={results.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Download PDF
        </button>
      </div>
      <div className="h-64 overflow-y-auto border rounded-lg">
        {results.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {isAnalyzing ? 'Analyzing frames...' : 'Analysis results will appear here'}
          </div>
        ) : (
          <ul className="divide-y">
            {results.map((result, index) => (
              <li key={index} className="p-3 hover:bg-gray-50">
                <div className="flex justify-between">
                  <span className="font-medium">{result.type}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.confidence > 0.8 ? 'bg-red-100 text-red-800' :
                    result.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {Math.round(result.confidence * 100)}% confidence
                  </span>
                </div>
                {result.bbox && (
                  <div className="text-xs text-gray-500 mt-1">
                    BBox: [{result.bbox.map(Math.round).join(', ')}]
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Visualization Graph */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Detection Frequency</h3>
          <div className="h-40 bg-gray-50 rounded p-2">
            {/* Simple bar chart visualization */}
            <div className="flex h-full items-end gap-1">
              {results.slice(0, 10).map((result, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{
                    height: `${result.confidence * 80}%`,
                    backgroundColor: result.confidence > 0.8 ? '#ef4444' :
                                    result.confidence > 0.6 ? '#f59e0b' : '#10b981'
                  }}
                  title={`${result.type} (${Math.round(result.confidence * 100)}%)`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 