import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import '../styles/Dashboard.css';

export default function AdminLayout({ userName, onLogout, activeItem, title, subtitle, children }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container admin-layout-shell">
      <AdminHeader userName={userName} onLogout={onLogout} title={title} />

      <div className="reports-layout admin-dashboard-layout">
        <aside className="reports-sidebar">
          <h2>Dashboard</h2>
          <nav>
            <button type="button" className={activeItem === 'dashboard' ? 'active' : ''} onClick={() => navigate('/admin')}>
              Employee Details
            </button>
            <button type="button" className={activeItem === 'leaves' ? 'active' : ''} onClick={() => navigate('/admin/leaves')}>
              Leave Management
            </button>
            <button type="button" className={activeItem === 'reports' ? 'active' : ''} onClick={() => navigate('/admin/reports?openSub=1')}>
              Reports
            </button>
            <button type="button" className={activeItem === 'holidays' ? 'active' : ''} onClick={() => navigate('/admin/holidays')}>
              Holidays
            </button>
            <button type="button" className={activeItem === 'attendance' ? 'active' : ''} onClick={() => navigate('/admin/attendance')}>
              Attendance
            </button>
            <button type="button" className={activeItem === 'payroll' ? 'active' : ''} onClick={() => navigate('/admin/payroll')}>
              Payroll
            </button>
            <button type="button" className={activeItem === 'payroll-report' ? 'active' : ''} onClick={() => navigate('/admin/payroll-report')}>
              Payroll Report
            </button>
            <button type="button" className={activeItem === 'salary-report' ? 'active' : ''} onClick={() => navigate('/admin/salary-report')}>
              Salary Report
            </button>

            <hr className="reports-sidebar-divider" />
            <button type="button" onClick={() => navigate('/admin/employee/new')}>+ Create Employee</button>
          </nav>
        </aside>

        <main className="reports-main">
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
