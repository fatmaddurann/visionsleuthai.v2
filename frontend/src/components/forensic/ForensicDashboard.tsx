import React from 'react';
import { type AnalysisResult } from '@/utils/api';

type Props = {
  report: AnalysisResult;
};

const ForensicDashboard: React.FC<Props> = ({ report }) => {
  const handleDownloadPDF = async () => {
    if (typeof window !== 'undefined') {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById('forensic-report-pdf');
      const button = document.getElementById('download-pdf-btn');
      if (button) button.style.display = 'none';
      if (element) {
        html2pdf().from(element).set({
          margin: 0.5,
          filename: 'forensic_report.pdf',
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        }).save().then(() => {
          if (button) button.style.display = '';
        });
      }
    }
  };

  return (
    <div className="forensic-dashboard space-y-8 bg-white text-black" id="forensic-report-pdf" style={{ color: '#111', background: '#fff' }}>
      <div className="flex justify-end">
        <button id="download-pdf-btn" onClick={handleDownloadPDF} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
      </div>

      {/* Technical Findings */}
      <section className="technical-findings bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Technical Findings</h3>
        <ul>
          {report.technicalFindings.map((finding, i) => (
            <li key={i} className="mb-2">{finding}</li>
          ))}
        </ul>
      </section>

      {/* Crime Analysis */}
      <section className="crime-analysis bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Crime Analysis</h3>
        <pre className="text-sm">{JSON.stringify(report.crimeAnalysis, null, 2)}</pre>
      </section>

      {/* Forensic Visualizations */}
      <section className="forensic-visualizations bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Forensic Visualizations</h3>
        <ul>
          {report.forensicVisualizations.map((visualization, i) => (
            <li key={i} className="mb-2">{visualization}</li>
          ))}
        </ul>
      </section>

      {/* Expert Opinion */}
      <section className="expert-opinion bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Expert Opinion</h3>
        <p>{report.expertOpinion}</p>
      </section>

      {/* Metadata */}
      <section className="metadata bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Video Metadata</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="text-gray-800">{report.metadata.duration}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Resolution</p>
            <p className="text-gray-800">{report.metadata.resolution}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Processing Date</p>
            <p className="text-gray-800">{report.metadata.processingDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Model Version</p>
            <p className="text-gray-800">{report.metadata.modelVersion}</p>
          </div>
        </div>
      </section>

      {/* Frames Analysis */}
      <section className="frames-analysis bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Frame Analysis</h3>
        <div className="space-y-4">
          {report.frames.map((frame, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700">Frame {frame.frameNumber}</p>
                <p className="text-sm text-gray-500">{frame.timestamp}</p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Detections:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {frame.detections.map((detection, dIndex) => (
                      <li key={dIndex}>
                        {detection.type} (Confidence: {detection.confidence.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Risk Score:</p>
                  <p className="text-sm text-gray-600">{frame.riskScore.toFixed(2)}</p>
                </div>
                {frame.contextualFactors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contextual Factors:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {frame.contextualFactors.map((factor, fIndex) => (
                        <li key={fIndex}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Summary */}
      <section className="summary bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Analysis Summary</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Risk Assessment</h4>
            <pre className="mt-1 text-sm text-gray-600 bg-gray-100 p-2 rounded">
              {JSON.stringify(report.summary.riskAssessment, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Crime Distribution</h4>
            <div className="mt-1 space-y-2">
              {report.summary.crimeDistribution.map((crime, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{crime.type}</span>
                  <span>{crime.count} ({crime.percentage})</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Recommendations</h4>
            <div className="mt-1 space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-600">Immediate Actions:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {report.summary.recommendations.immediateActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Long-term Suggestions:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {report.summary.recommendations.longTermSuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForensicDashboard;
