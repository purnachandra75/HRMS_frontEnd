import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

function EmployeeLayout({ userName, onLogout, activeItem, title, subtitle, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container employee-layout-shell">
      <header className="dashboard-header employee-fixed-header">
        <h1>Employee Portal</h1>
        <div className="header-info">
          <span>Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="reports-layout admin-dashboard-layout">
        <aside className="reports-sidebar">
          <h2>Dashboard</h2>
          <nav>
            <button type="button" className={activeItem === 'dashboard' ? 'active' : ''} onClick={() => navigate('/employee')}>
              Overview
            </button>
            <button type="button" className={activeItem === 'profile' ? 'active' : ''} onClick={() => navigate('/employee/profile')}>
              My Profile
            </button>
            <button type="button" className={activeItem === 'attendance' ? 'active' : ''} onClick={() => navigate('/employee/attendance')}>
              Attendance
            </button>
            <button type="button" className={activeItem === 'leaves' ? 'active' : ''} onClick={() => navigate('/employee/leaves')}>
              Leave Requests
            </button>
            <hr className="reports-sidebar-divider" />
            <button type="button" className={activeItem === 'monthly-report' ? 'active' : ''} onClick={() => navigate('/employee/leaves/monthly-report')}>
              Monthly Leave Report
            </button>
          </nav>
        </aside>

        <main className="reports-main employee-layout-main">
          {(title || subtitle) && (
            <div className="reports-content-header">
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default EmployeeLayout;
