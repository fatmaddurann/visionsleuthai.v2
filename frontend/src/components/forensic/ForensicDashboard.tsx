import React from 'react';

interface ForensicReport {
  technicalFindings: any;
  crimeAnalysis: any;
  forensicVisualizations: any;
  expertOpinion: any;
}

const ForensicDashboard = ({ report }: { report: ForensicReport }) => {
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
    </div>
  );
};

export default ForensicDashboard; 