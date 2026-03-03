import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Selection.css';

const ReportsAnalytics = () => {
  const navigate = useNavigate();

  return (
    <div className="selection-container">
      <div className="selection-header">
        <button onClick={() => navigate('/')} className="selection-back-btn">
          <i className="bi bi-arrow-left-circle-fill"></i> Back to Dashboard
        </button>
        <h2 className="selection-title">Reports & Analytics</h2>
        <p className="selection-subtitle">Summary reports and quality analytics dashboard</p>
      </div>

      <div className="selection-cards-wrapper">
        <div className="select-card fill-data-card" onClick={() => alert('Summary Reports — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-bar-chart-line-fill select-icon"></i>
          </div>
          <h3>Summary Reports</h3>
          <p>View overall quality summary and KPIs</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>

        <div className="select-card print-data-card" onClick={() => alert('Analytics Dashboard — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-graph-up-arrow select-icon"></i>
          </div>
          <h3>Analytics</h3>
          <p>Interactive charts and quality analytics dashboard</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
