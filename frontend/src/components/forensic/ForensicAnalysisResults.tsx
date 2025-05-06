import React from 'react';
import { Detection } from './useForensicAnalysis';
import jsPDF from 'jspdf';

interface ForensicAnalysisResultsProps {
  results: DetectionWithTimestamp[];
  isAnalyzing: boolean;
  onDownloadPDF?: () => void;
}

// Detection tipini timestamp ile genişlet
export type DetectionWithTimestamp = Detection & { timestamp: string };

function getEvidentiaryValue(conf: number) {
  if (conf > 0.85) return 'High';
  if (conf > 0.6) return 'Medium';
  return 'Low';
}

function getAcademicExplanation(type: string, conf: number) {
  return `Detection of ${type} with ${Math.round(conf * 100)}% confidence using the COCO-SSD model.`;
}

export const ForensicAnalysisResults: React.FC<ForensicAnalysisResultsProps> = ({
  results,
  isAnalyzing,
  onDownloadPDF,
}) => {
  // Bar chart data
  const freq: Record<string, number> = {};
  results.forEach(r => {
    freq[r.type] = (freq[r.type] || 0) + 1;
  });
  const types = Object.keys(freq);

  // Hotspot for bbox centers
  const hotspots = results.map(r => ({
    x: r.bbox ? r.bbox[0] + r.bbox[2] / 2 : 0,
    y: r.bbox ? r.bbox[1] + r.bbox[3] / 2 : 0,
    type: r.type,
    conf: r.confidence,
  }));

  // PDF report
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Forensic Live Analysis Report', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Detections: ${results.length}`, 14, 38);
    doc.text('Event Timeline:', 14, 50);
    let y = 60;
    results.slice(0, 20).forEach((r, i) => {
      doc.text(
        `${i + 1}. [${r.timestamp}] ${r.type} (${Math.round(r.confidence * 100)}%) - Evidentiary Value: ${getEvidentiaryValue(r.confidence)}`,
        16,
        y
      );
      y += 7;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save('forensic-analysis-report.pdf');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Forensic Analysis Results</h2>
        <button
          onClick={onDownloadPDF || handleDownloadPDF}
          disabled={results.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Download PDF
        </button>
      </div>
      {/* Event Timeline */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Event Timeline</h3>
        <ul className="divide-y">
          {results.length === 0 ? (
            <li className="p-3 text-gray-500">{isAnalyzing ? 'Analyzing...' : 'Results will appear here.'}</li>
          ) : (
            results.slice(0, 10).map((r, i) => (
              <li key={i} className="p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{r.type}</span>
                  <span className="text-xs text-gray-500">{getEvidentiaryValue(r.confidence)} evidentiary value</span>
                </div>
                <div className="text-xs text-gray-500">Confidence: {Math.round(r.confidence * 100)}%</div>
                <div className="text-xs text-gray-500">Timestamp: {r.timestamp}</div>
                <div className="text-xs text-blue-700 mt-1">{getAcademicExplanation(r.type, r.confidence)}</div>
              </li>
            ))
          )}
        </ul>
      </div>
      {/* Bar Chart */}
      {types.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Detection Frequency</h3>
          <div className="h-32 bg-gray-50 rounded p-2 flex items-end gap-2">
            {types.map((type, i) => (
              <div key={type} className="flex-1 flex flex-col items-center">
                <div
                  className="w-6 rounded-t"
                  style={{
                    height: `${Math.min(freq[type] * 20, 100)}%`,
                    background: '#2563eb',
                  }}
                  title={`${type}: ${freq[type]} times`}
                ></div>
                <span className="text-xs mt-1 text-gray-700">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Hotspot Map */}
      {hotspots.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Hotspot Map</h3>
          <div className="relative w-full h-40 bg-gray-100 rounded">
            {hotspots.map((h, i) => (
              <div
                key={i}
                className="absolute rounded-full border-2 border-blue-600"
                style={{
                  left: `${Math.min(Math.max(h.x / 640 * 100, 0), 100)}%`,
                  top: `${Math.min(Math.max(h.y / 480 * 100, 0), 100)}%`,
                  width: 12,
                  height: 12,
                  background: h.conf > 0.8 ? '#ef4444' : h.conf > 0.6 ? '#f59e0b' : '#10b981',
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${h.type} (${Math.round(h.conf * 100)}%)`}
              ></div>
            ))}
          </div>
        </div>
      )}
      {/* Summary */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">Summary</h3>
        <div className="text-gray-700 text-sm">
          Total detections: <b>{results.length}</b> <br />
          Detected object types: {types.join(', ') || 'None'} <br />
          Average confidence: {results.length > 0 ? `${Math.round(results.reduce((a, b) => a + b.confidence, 0) / results.length * 100)}%` : '-'}
        </div>
      </div>
    </div>
  );
}; 