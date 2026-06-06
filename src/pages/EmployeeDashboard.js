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
        <div className="employee-welcome">
          <h2>Welcome to Your Dashboard</h2>
          <p>Employee ID: {userId}</p>
          <p>You can manage your profile information and view your attendance records here.</p>
          
          <div className="action-buttons">
            <button className="primary-btn" onClick={handleViewProfile}>
              View/Edit My Profile
            </button>
            <button className="primary-btn" onClick={() => navigate('/employee/attendance')}>
              Attendance Records
            </button>
            <button className="primary-btn" onClick={() => navigate('/employee/leaves')}>
              Leave Requests
            </button>
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
        </div>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
