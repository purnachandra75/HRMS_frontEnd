import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useIsProjectManager from '../hooks/useIsProjectManager';
import '../styles/Dashboard.css';

const SIDEBAR_COLLAPSED_KEY = 'employee-sidebar-collapsed';

function EmployeeLayout({ userName, onLogout, activeItem, title, subtitle, children }) {
  const navigate = useNavigate();
  const isProjectManager = useIsProjectManager();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // localStorage unavailable (private mode, etc.) - collapse still works for this session
      }
      return next;
    });
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
        <aside className={`reports-sidebar${collapsed ? ' collapsed' : ''}`}>
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '»' : '«'}
          </button>

          {!collapsed && <h2>Dashboard</h2>}

          <nav>
            <button type="button" title="Overview" className={activeItem === 'dashboard' ? 'active' : ''} onClick={() => navigate('/employee')}>
              <span className="nav-icon">🏠</span>
              {!collapsed && <span className="nav-label">Overview</span>}
            </button>
            <button type="button" title="My Profile" className={activeItem === 'profile' ? 'active' : ''} onClick={() => navigate('/employee/profile')}>
              <span className="nav-icon">🧑‍💼</span>
              {!collapsed && <span className="nav-label">My Profile</span>}
            </button>
            <button type="button" title="Attendance" className={activeItem === 'attendance' ? 'active' : ''} onClick={() => navigate('/employee/attendance')}>
              <span className="nav-icon">✅</span>
              {!collapsed && <span className="nav-label">Attendance</span>}
            </button>
            <button type="button" title="Leave Requests" className={activeItem === 'leaves' ? 'active' : ''} onClick={() => navigate('/employee/leaves')}>
              <span className="nav-icon">🗓️</span>
              {!collapsed && <span className="nav-label">Leave Requests</span>}
            </button>
            {isProjectManager && (
              <button type="button" title="My Team" className={activeItem === 'my-team' ? 'active' : ''} onClick={() => navigate('/employee/my-team')}>
                <span className="nav-icon">🧭</span>
                {!collapsed && <span className="nav-label">My Team</span>}
              </button>
            )}
            <button type="button" title="Daily Timesheet" className={activeItem === 'timesheet' ? 'active' : ''} onClick={() => navigate('/employee/timesheet')}>
              <span className="nav-icon">📝</span>
              {!collapsed && <span className="nav-label">Daily Timesheet</span>}
            </button>
            <button type="button" title="Holidays" className={activeItem === 'holidays' ? 'active' : ''} onClick={() => navigate('/employee/holidays')}>
              <span className="nav-icon">🎉</span>
              {!collapsed && <span className="nav-label">Holidays</span>}
            </button>

            <hr className="reports-sidebar-divider" />

            <button type="button" title="Monthly Leave Report" className={activeItem === 'monthly-report' ? 'active' : ''} onClick={() => navigate('/employee/leaves/monthly-report')}>
              <span className="nav-icon">📊</span>
              {!collapsed && <span className="nav-label">Monthly Leave Report</span>}
            </button>
            <button type="button" title="Payslip" className={activeItem === 'payslip' ? 'active' : ''} onClick={() => navigate('/employee/payslip')}>
              <span className="nav-icon">📄</span>
              {!collapsed && <span className="nav-label">Payslip</span>}
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
