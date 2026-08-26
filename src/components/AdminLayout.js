import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import '../styles/Dashboard.css';

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

const EMPLOYEE_REPORT_ITEMS = [
  { type: 'all', label: 'All Employees' },
  { type: 'status', label: 'Employee Exit Report' },
  { type: 'employment', label: 'Employment Type Report' },
  { type: 'newJoiners', label: 'New Joiners' },
  { type: 'probation', label: 'Probation Period' },
];

export default function AdminLayout({ userName, onLogout, activeItem, title, subtitle, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [reportsOpen, setReportsOpen] = useState(activeItem === 'reports');
  const [employeeReportsOpen, setEmployeeReportsOpen] = useState(true);

  useEffect(() => {
    if (activeItem === 'reports') {
      setReportsOpen(true);
    }
  }, [activeItem]);

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

  const sidebarTitles = {
    dashboard: 'Employee Details',
    leaves: 'Leave Management',
    reports: 'Reports',
    holidays: 'Holidays',
    attendance: 'Attendance',
    'team-structure': 'Team Structure',
    timesheets: 'HR Timesheets',
    payroll: 'Payroll',
    'payroll-report': 'Payroll Report',
    'salary-report': 'Salary Report',
  };

  const sidebarTitle = sidebarTitles[activeItem] || 'Admin Portal';

  const reportParams = new URLSearchParams(location.search);
  const currentReport = activeItem === 'reports' ? reportParams.get('report') || 'salary' : null;
  const currentReportType = activeItem === 'reports' ? reportParams.get('type') || '' : '';

  const isReportActive = (report, type) =>
    currentReport === report && (!type || currentReportType === type);

  return (
    <div className="dashboard-container admin-layout-shell">
      <AdminHeader userName={userName} onLogout={onLogout} title={title} />

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

          {!collapsed && <h2>{sidebarTitle}</h2>}

          <nav>
            <button type="button" title="Employee Details" className={activeItem === 'dashboard' ? 'active' : ''} onClick={() => navigate('/admin')}>
              <span className="nav-icon">🧑‍💼</span>
              {!collapsed && <span className="nav-label">Employee Details</span>}
            </button>

            <button type="button" title="Leave Management" className={activeItem === 'leaves' ? 'active' : ''} onClick={() => navigate('/admin/leaves')}>
              <span className="nav-icon">🗓️</span>
              {!collapsed && <span className="nav-label">Leave Management</span>}
            </button>

            <div className="nav-group">
              <div className={`menu-row${activeItem === 'reports' ? ' active' : ''}`}>
                <button type="button" title="Reports" className="menu-row-label" onClick={() => navigate('/admin/reports')}>
                  <span className="nav-icon">📊</span>
                  {!collapsed && <span className="nav-label">Reports</span>}
                </button>
                {!collapsed && (
                  <button
                    type="button"
                    className="menu-row-caret"
                    aria-label={reportsOpen ? 'Collapse report sections' : 'Expand report sections'}
                    onClick={() => setReportsOpen((prev) => !prev)}
                  >
                    <span className={`nav-caret${reportsOpen ? ' expanded' : ''}`}>▶</span>
                  </button>
                )}
              </div>

              {!collapsed && reportsOpen && (
                <div className="nav-submenu">
                  <button
                    type="button"
                    className={isReportActive('salary') ? 'active' : ''}
                    onClick={() => navigate('/admin/reports?report=salary')}
                  >
                    Salary Report
                  </button>

                  <div className="nav-subgroup">
                    <button
                      type="button"
                      className={`nav-subgroup-toggle${isReportActive('employee') ? ' active' : ''}`}
                      onClick={() => setEmployeeReportsOpen((prev) => !prev)}
                    >
                      <span>Employee Reports</span>
                      <span className={`nav-caret${employeeReportsOpen ? ' expanded' : ''}`}>▶</span>
                    </button>

                    {employeeReportsOpen && (
                      <div className="nav-subgroup-children">
                        {EMPLOYEE_REPORT_ITEMS.map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            className={isReportActive('employee', item.type) ? 'active' : ''}
                            onClick={() => navigate(`/admin/reports?report=employee&type=${item.type}`)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className={isReportActive('leaves') ? 'active' : ''}
                    onClick={() => navigate('/admin/reports?report=leaves')}
                  >
                    Leave Report
                  </button>

                  <button
                    type="button"
                    className={isReportActive('attendance') ? 'active' : ''}
                    onClick={() => navigate('/admin/reports?report=attendance')}
                  >
                    Attendance Report
                  </button>
                </div>
              )}
            </div>

            <button type="button" title="Holidays" className={activeItem === 'holidays' ? 'active' : ''} onClick={() => navigate('/admin/holidays')}>
              <span className="nav-icon">🎉</span>
              {!collapsed && <span className="nav-label">Holidays</span>}
            </button>

            <button type="button" title="Attendance" className={activeItem === 'attendance' ? 'active' : ''} onClick={() => navigate('/admin/attendance')}>
              <span className="nav-icon">✅</span>
              {!collapsed && <span className="nav-label">Attendance</span>}
            </button>

            <button type="button" title="Team Structure" className={activeItem === 'team-structure' ? 'active' : ''} onClick={() => navigate('/admin/team-structure')}>
              <span className="nav-icon">🧭</span>
              {!collapsed && <span className="nav-label">Team Structure</span>}
            </button>

            <button type="button" title="HR Timesheets" className={activeItem === 'timesheets' ? 'active' : ''} onClick={() => navigate('/admin/timesheets')}>
              <span className="nav-icon">📝</span>
              {!collapsed && <span className="nav-label">HR Timesheets</span>}
            </button>

            <button type="button" title="Payroll" className={activeItem === 'payroll' ? 'active' : ''} onClick={() => navigate('/admin/payroll')}>
              <span className="nav-icon">💰</span>
              {!collapsed && <span className="nav-label">Payroll</span>}
            </button>

            <button type="button" title="Payroll Report" className={activeItem === 'payroll-report' ? 'active' : ''} onClick={() => navigate('/admin/payroll-report')}>
              <span className="nav-icon">📄</span>
              {!collapsed && <span className="nav-label">Payroll Report</span>}
            </button>

            <button type="button" title="Essentials" className={activeItem === 'essentials' ? 'active' : ''} onClick={() => navigate('/admin/essentials')}>
              <span className="nav-icon">🧰</span>
              {!collapsed && <span className="nav-label">Essentials</span>}
            </button>

            <hr className="reports-sidebar-divider" />
            <button type="button" title="Create Employee" onClick={() => navigate('/admin/employee/new')}>
              <span className="nav-icon">➕</span>
              {!collapsed && <span className="nav-label">Create Employee</span>}
            </button>
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
