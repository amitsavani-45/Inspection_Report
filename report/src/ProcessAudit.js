import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Selection.css';

const ProcessAudit = () => {
  const navigate = useNavigate();

  return (
    <div className="selection-container">
      <div className="selection-header">
        <button onClick={() => navigate('/')} className="selection-back-btn">
          <i className="bi bi-arrow-left-circle-fill"></i> Back to Dashboard
        </button>
        <h2 className="selection-title">Process Audit</h2>
        <p className="selection-subtitle">Process audit reports and findings</p>
      </div>

      <div className="selection-cards-wrapper">
        <div className="select-card fill-data-card" onClick={() => alert('Process Audit Entry — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-pencil-square select-icon"></i>
          </div>
          <h3>Fill Data</h3>
          <p>Enter new process audit report</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>

        <div className="select-card print-data-card" onClick={() => alert('Process Audit Reports — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-printer-fill select-icon"></i>
          </div>
          <h3>View Reports</h3>
          <p>View, filter and print process audit reports</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>
      </div>
    </div>
  );
};

export default ProcessAudit;
