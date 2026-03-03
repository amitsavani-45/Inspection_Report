import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Selection.css';

const RawMaterial = () => {
  const navigate = useNavigate();

  return (
    <div className="selection-container">
      <div className="selection-header">
        <button onClick={() => navigate('/')} className="selection-back-btn">
          <i className="bi bi-arrow-left-circle-fill"></i> Back to Dashboard
        </button>
        <h2 className="selection-title">Raw Material</h2>
        <p className="selection-subtitle">Raw material inspection & tracking</p>
      </div>

      <div className="selection-cards-wrapper">
        <div className="select-card fill-data-card" onClick={() => alert('Raw Material Entry form — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-pencil-square select-icon"></i>
          </div>
          <h3>Fill Data</h3>
          <p>Enter new raw material inspection record</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>

        <div className="select-card print-data-card" onClick={() => alert('Raw Material Reports — Coming Soon!')}>
          <div className="select-icon-wrapper">
            <i className="bi bi-printer-fill select-icon"></i>
          </div>
          <h3>View Reports</h3>
          <p>View, filter and print raw material inspection records</p>
          <div className="select-arrow"><i className="bi bi-arrow-right"></i></div>
        </div>
      </div>
    </div>
  );
};

export default RawMaterial;
