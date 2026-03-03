import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SelectionPage.css';

const SelectionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="selection-container">
      <div className="selection-header">
        <button onClick={() => navigate('/')} className="selection-back-btn">
          <i className="bi bi-arrow-left-circle-fill"></i> Back to Dashboard
        </button>
        <h2 className="selection-title">Setup & Patrol Inspection</h2>
        <p className="selection-subtitle">What would you like to do today?</p>
      </div>

      <div className="selection-cards-wrapper">
        {/* Fill Data Section */}
        <div 
          className="select-card fill-data-card" 
          onClick={() => navigate('/form?mode=new')}
        >
          <div className="select-icon-wrapper">
            <i className="bi bi-pencil-square select-icon"></i>
          </div>
          <h3>Fill Data</h3>
          <p>Create a brand new inspection report</p>
          <div className="select-arrow">
            <i className="bi bi-arrow-right"></i>
          </div>
        </div>

        {/* Print Data Section */}
        <div 
          className="select-card print-data-card" 
          onClick={() => navigate('/inspection')}
        >
          <div className="select-icon-wrapper">
            <i className="bi bi-printer-fill select-icon"></i>
          </div>
          <h3>Print Data</h3>
          <p>View, filter, and print existing inspection reports</p>
          <div className="select-arrow">
            <i className="bi bi-arrow-right"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionPage;