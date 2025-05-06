import React from 'react';
import React from 'react';
import './academic-report.css';
import type { AnalysisResult } from '@/utils/api';

export default function AcademicResults({ data }: { data: AnalysisResult }) {
  return (
    <div className="academic-report">
      {/* ... mevcut kodun ... */}
    </div>
  );
}

export default function AcademicResults({ data }) {
  return (
    <div className="academic-report">
      <section className="report-header">
        <h2>Forensic Video Analysis Report</h2>
        <div className="metadata-grid">
          <div>
            <span className="label">Analysis Date:</span>
            <span>{data.metadata.processingDate}</span>
          </div>
          <div>
            <span className="label">Model Version:</span>
            <span>{data.metadata.modelVersion}</span>
          </div>
        </div>
      </section>

      <section className="quantitative-section">
        <h3>Quantitative Analysis</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Precision</h4>
            <p>{data.quantitativeAnalysis.detectionMetrics.precision.toFixed(2)}</p>
            <small>TP/(TP+FP)</small>
          </div>
          <div className="metric-card">
            <h4>Recall</h4>
            <p>{data.quantitativeAnalysis.detectionMetrics.recall.toFixed(2)}</p>
            <small>TP/(TP+FN)</small>
          </div>
          <div className="metric-card">
            <h4>F1 Score</h4>
            <p>{data.quantitativeAnalysis.detectionMetrics.f1Score.toFixed(2)}</p>
            <small>2*P*R/(P+R)</small>
          </div>
          <div className="metric-card">
            <h4>True Positives</h4>
            <p>{data.quantitativeAnalysis.detectionMetrics.truePositives}</p>
          </div>
        </div>
      </section>

      <section className="temporal-analysis">
        <h3>Temporal Crime Distribution</h3>
        <table className="academic-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>Confidence</th>
              <th>Contextual Factors</th>
            </tr>
          </thead>
          <tbody>
            {data.qualitativeAnalysis.temporalPatterns.map((event, i) => (
              <tr key={i}>
                <td>{event.timestamp}</td>
                <td>{event.eventType}</td>
                <td>{event.confidence.toFixed(2)}</td>
                <td>{event.contextualFactors.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="risk-assessment">
        <h3>Risk Assessment</h3>
        <div className="risk-indicator">
          <span className={`risk-level ${data.riskAssessment.overallRisk.level.toLowerCase()}`}>
            {data.riskAssessment.overallRisk.level}
          </span>
          <span>(Score: {data.riskAssessment.overallRisk.score}/10)</span>
        </div>
        <div className="confidence-interval">
          Confidence Interval: {data.riskAssessment.overallRisk.confidenceInterval}
        </div>
      </section>

      <section className="conclusions">
        <h3>Conclusions & Recommendations</h3>
        <div className="recommendations">
          <h4>Immediate Actions:</h4>
          <ul>
            {data.recommendations.immediateActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
        <div className="references">
          <h4>Methodological References:</h4>
          <p>1. YOLOv7: Trainable bag-of-freebies sets new state-of-the-art for real-time object detectors (2022)</p>
          <p>2. Temporal Analysis of Surveillance Footage: Best Practices in Forensic Video Analysis</p>
        </div>
      </section>
    </div>
  );
} 
