import React from 'react';
import { useNavigate } from 'react-router-dom';
import atomone from './image/atomone.jpg';
import './QMS_Portal.css';

const sections = [
  {
    id: 'raw-material',
    title: 'Raw Material',
    icon: 'bi bi-boxes',
    description: 'Raw material inspection & tracking',
    color: '#2e7d32', // Green
    bg: '#e8f5e9',
    border: '#a5d6a7',
    route: '/raw-material',
    enabled: true,
  },
  {
    id: 'setup-inspection',
    title: 'Setup & Patrol Inspection Report',
    icon: 'bi bi-clipboard2-pulse',
    description: 'View & manage setup and patrol inspection reports',
    color: '#1565c0', // Blue
    bg: '#e3f2fd',
    border: '#90caf9',
    route: '/selection',
    enabled: true,
  },
  {
    id: 'layout-report',
    title: 'Scrap Note',
    icon: 'bi bi-calculator',
    description: 'View and manage layout inspection reports',
    color: '#ef6c00', // Orange
    bg: '#fff3e0',
    border: '#ffcc80',
    route: '/layout-report',
    enabled: true,
  },
  {
    id: 'dispatch',
    title: 'Dispatch',
    icon: 'bi bi-truck',
    description: 'Final dispatch inspection and tracking',
    color: '#7b1fa2', // Purple
    bg: '#f3e5f5',
    border: '#ce93d8',
    route: '/dispatch',
    enabled: true,
  },
  {
    id: 'pdi-report',
    title: 'PDI Report',
    icon: 'bi bi-shield-check',
    description: 'Pre-Dispatch Inspection (PDI) records',
    color: '#c62828', // Red
    bg: '#ffebee',
    border: '#ef9a9a',
    route: '/pdi-report',
    enabled: true,
  },
  {
    id: 'sop-procedure',
    title: 'SOP & Procedure',
    icon: 'bi bi-book',
    description: 'Standard Operating Procedures and guidelines',
    color: '#00695c', // Teal
    bg: '#e0f2f1',
    border: '#80cbc4',
    route: '/sop-procedure',
    enabled: true,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const handleCardClick = (section) => {
    if (section.enabled) {
      navigate(section.route);
    }
  };

  return (
    <div className="dashboard-container">
      {/* ── Top Header Bar (Logo & Date only) ── */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={atomone} alt="ATOM ONE" className="dashboard-logo" />
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-date">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Main Heading (Now below the header) ── */}
      <div className="dashboard-main-heading">
        <h1 className="dashboard-title">Quality Management System</h1>
        <p className="dashboard-subtitle">Select a module to continue</p>
      </div>

      {/* ── Cards Grid ── */}
      <div className="dashboard-grid">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`dashboard-card ${section.enabled ? 'enabled' : 'disabled'}`}
            style={{
              '--card-color': section.color,
              '--card-bg': section.bg,
              '--card-border': section.border,
            }}
            onClick={() => handleCardClick(section)}
          >
            <div className="card-icon-wrap">
              <i className={section.icon} style={{ fontSize: '26px', color: '#fff' }}></i>
            </div>
            <div className="card-content">
              <h2 className="card-title">{section.title}</h2>
              <p className="card-desc">{section.description}</p>
            </div>
            {section.enabled ? (
              <div className="card-arrow">
                <i className="bi bi-arrow-right-circle-fill"></i>
              </div>
            ) : (
              <div className="card-badge">Coming Soon</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;