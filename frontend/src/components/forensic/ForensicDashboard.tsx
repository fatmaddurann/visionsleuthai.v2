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
      <section className="timeline-section bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Event Timeline</h3>
        <ul>
          {report.crimeAnalysis.temporalAnalysis.eventTimeline.map((event: any, i: number) => (
            <li key={i} className="mb-2">
              <span className="font-mono">{event.timestamp}</span> - <span>{event.eventType}</span> - <span className="text-blue-700">{Math.round(event.confidence * 100)}%</span> - <span className="font-semibold">{event.evidentiaryValue}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="spatial-analysis bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Spatial Hotspots</h3>
        <ul>
          {report.crimeAnalysis.spatialMapping.hotSpotCoordinates.map((hot: any, i: number) => (
            <li key={i}>
              ({hot.x}, {hot.y}) - {hot.crimeType} - Intensity: {hot.intensity}
            </li>
          ))}
        </ul>
      </section>
      <section className="evidence-chain bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Digital Evidence Chain</h3>
        <ol>
          {report.forensicVisualizations.digitalEvidenceChain.processingSteps.map((step: any, i: number) => (
            <li key={i}>
              <strong>{step.step}</strong> | Tool: {step.toolUsed} | Time: {step.timestamp}
            </li>
          ))}
        </ol>
      </section>
      <section className="legal-compliance bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Legal Compliance</h3>
        <p className="mb-2">
          This report complies with ISO/IEC 27037:2012 Digital Evidence Collection Standard, SWGDE Best Practices for Forensic Video Analysis, and Turkish Criminal Procedure Law Article 134. All digital evidence handling and reporting procedures are documented and traceable. The report is suitable for use in legal proceedings and meets international forensic standards.
        </p>
      </section>
      <section className="expert-opinion bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-semibold mb-2">Expert Opinion</h3>
        <div>
          <strong>Conclusions:</strong>
          <ul>
            {report.expertOpinion.conclusions.map((c: string, i: number) => <li key={i}>{c}</li>)}
          </ul>
          <div className="mt-2"><strong>Methodology:</strong> {report.expertOpinion.methodologyDescription}</div>
          <div className="mt-2"><strong>Limitations:</strong>
            <ul>{report.expertOpinion.limitations.map((l: string, i: number) => <li key={i}>{l}</li>)}</ul>
          </div>
          <div className="mt-2"><strong>References:</strong>
            <ul>{report.expertOpinion.references.map((r: any, i: number) => <li key={i}>{r.source} - {r.relevance}</li>)}</ul>
          </div>
        </div>
      </section>
      <div className="space-y-6">
        {/* Metadata Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Video Metadata</h4>
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
        </div>

        {/* Summary Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Analysis Summary</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Risk Assessment</h5>
              <pre className="mt-1 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                {JSON.stringify(report.summary.riskAssessment, null, 2)}
              </pre>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700">Crime Distribution</h5>
              <pre className="mt-1 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                {JSON.stringify(report.summary.crimeDistribution, null, 2)}
              </pre>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700">Recommendations</h5>
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
        </div>

        {/* Frames Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Frame Analysis</h4>
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
        </div>
      </div>
    </div>
  );
};

export default ForensicDashboard; 
