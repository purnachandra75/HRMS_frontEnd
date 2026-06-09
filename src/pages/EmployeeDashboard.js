import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

function EmployeeDashboard({ userName, userId, onLogout }) {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate('/employee/profile');
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <div className="header-info">
          <span>Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-cards">
          <div className="dashboard-card clickable" onClick={handleViewProfile}>
            <h3>View/Edit My Profile</h3>
            <p>Manage your personal and professional information.</p>
          </div>
          <div className="dashboard-card clickable" onClick={() => navigate('/employee/attendance')}>
            <h3>Attendance Records</h3>
            <p>Track your daily attendance and work hours.</p>
          </div>
          <div className="dashboard-card clickable" onClick={() => navigate('/employee/leaves')}>
            <h3>Leave Requests</h3>
            <p>Submit, track, and manage your leave requests.</p>
          </div>
        </div>

        <div className="info-card">
          <h3>What can you do?</h3>
          <ul>
            <li>View your profile information</li>
            <li>Edit your personal details</li>
            <li>Check in and check out</li>
            <li>View your attendance records</li>
            <li>Submit leave requests</li>
            <li>Track your work hours</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
