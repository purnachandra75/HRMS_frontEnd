import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaveReportCard from '../components/LeaveReportCard';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

function MonthlyLeaveReportPage({ userName, userId, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/employee/leaves');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Monthly Leave Report</h1>
          <p className="dashboard-subtitle">View your yearly leave usage and monthly breakdown</p>
        </div>

        <div className="header-info">
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <button 
          className="secondary-button" 
          onClick={handleBackToDashboard}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Dashboard
        </button>

        {/* Leave Report Section */}
        <LeaveReportCard userId={userId} />
      </main>
    </div>
  );
}

export default MonthlyLeaveReportPage;
