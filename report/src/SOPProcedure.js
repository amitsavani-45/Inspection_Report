import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Selection.css';

const SOPProcedure = () => {
const navigate = useNavigate();

  return (
    <div className="selection-container">
      <div className="selection-header">
        <button onClick={() => navigate('/')} className="selection-back-btn">
          <i className="bi bi-arrow-left-circle-fill"></i> Back to Dashboard
        </button>
        <h2 className="selection-title">SOP & Procedure</h2>
        <p className="selection-subtitle">Standard Operating Procedures and guidelines</p>
      </div>

      <div className="selection-cards-wrapper">
        <div className="select-card fill-data-card" onClick={() => alert('Add SOP — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-journal-plus select-icon"></i>
          </div>
          <h3>Add SOP</h3>
          <p>Upload or create new standard operating procedures</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>

        <div className="select-card print-data-card" onClick={() => alert('View SOPs — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-book select-icon"></i>
          </div>
          <h3>View SOPs</h3>
          <p>Browse, read, and download existing procedures</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>
      </div>
    </div>
  );
};

export default SOPProcedure;