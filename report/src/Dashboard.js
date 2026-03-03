import React from 'react';
import { useNavigate } from 'react-router-dom';
import atomone from './image/atomone.jpg';
import './Dashboard.css';

const sections = [
  {
    id: 'raw-material',
    title: 'Raw Material',
    icon: 'bi bi-boxes',
    description: 'Raw material inspection & tracking',
    color: '#388e3c',
    bg: '#e8f5e9',
    border: '#a5d6a7',
    route: '/raw-material',
    enabled: true,
  },{
    id: 'setup-inspection',
    title: 'Setup & Patrol Inspection Report',
    icon: 'bi bi-clipboard2-pulse-fill',
    description: 'View & manage setup and patrol inspection reports',
    color: '#1976d2',
    bg: '#e3f2fd',
    border: '#90caf9',
    route: '/selection',
    enabled: true,
  },
 
  {
    id: 'incoming-quality',
    title: 'Incoming Quality Control',
    icon: 'bi bi-box-arrow-in-down',
    description: 'Incoming material quality check records',
    color: '#f57c00',
    bg: '#fff3e0',
    border: '#ffcc80',
    route: '/incoming-quality',
    enabled: true,
  },
  {
    id: 'final-inspection',
    title: 'Final Inspection',
    icon: 'bi bi-patch-check-fill',
    description: 'Final product inspection before dispatch',
    color: '#7b1fa2',
    bg: '#f3e5f5',
    border: '#ce93d8',
    route: '/final-inspection',
    enabled: true,
  },
  {
    id: 'process-audit',
    title: 'Process Audit',
    icon: 'bi bi-journal-text',
    description: 'Process audit reports and findings',
    color: '#c62828',
    bg: '#ffebee',
    border: '#ef9a9a',
    route: '/process-audit',
    enabled: true,
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    icon: 'bi bi-bar-chart-line-fill',
    description: 'Summary reports and quality analytics dashboard',
    color: '#00796b',
    bg: '#e0f2f1',
    border: '#80cbc4',
    route: '/reports',
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
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <img src={atomone} alt="ATOM ONE" className="dashboard-logo" />
        </div>
        <div className="dashboard-header-center">
          <h1 className="dashboard-title">Quality Management System</h1>
          <p className="dashboard-subtitle">Select a module to continue</p>
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-date">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>

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
            <div className="card-top-bar" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;