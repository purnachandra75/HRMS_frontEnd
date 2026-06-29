import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees } from '../services/employeeService';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

function AdminReportsPage({ userName, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('salary');
  const [employeeReportType, setEmployeeReportType] = useState('status');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employmentFilter, setEmploymentFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState({
    payroll: true,
    employee: false,
    leave: false,
    attendance: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const data = await getAllEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load report data:', err);
        setError('Unable to load report data.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const parseDateOfJoining = (value) => {
    if (!value) return null;
    const normalized = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const [year, month, day] = normalized.split('-').map((part) => parseInt(part, 10));
      return new Date(year, month - 1, day);
    }
    if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(normalized)) {
      const parts = normalized.includes('/') ? normalized.split('/') : normalized.split('-');
      const [first, second, year] = parts.map((part) => parseInt(part, 10));
      return first > 12 ? new Date(year, second - 1, first) : new Date(year, first - 1, second);
    }
    return new Date(normalized);
  };

  const getJoiningDate = (employee) => {
   return parseDateOfJoining(employee.dateOfJoining || employee.jobDetails?.dateOfJoining || employee.jobDetails?.joinedDate);
  };

  const nonAdminEmployees = employees.filter((employee) => (employee.role || '').toLowerCase() !== 'admin');
  const activeEmployees = nonAdminEmployees.filter((employee) => {
    const status = (employee.employeeStatus || '').toLowerCase();
    return status !== 'inactive';
  });
  
  const salaryEmployees = activeEmployees.filter((employee) => employee.ctc !== '' || employee.basicSalary !== '');
  const statusEmployees = nonAdminEmployees.filter((employee) => {
    const status = (employee.employeeStatus || '').toLowerCase();
    return status === 'inactive';
  });
  const partTimeEmployees = activeEmployees.filter((employee) => (employee.employeeType || '').toLowerCase().includes('part'));
  const fullTimeEmployees = activeEmployees.filter((employee) => (employee.employeeType || '').toLowerCase().includes('full'));

  // Helper function to toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper function to select payroll reports
  const selectPayrollReport = (reportType) => {
    setSelectedReport(reportType);
    setExpandedSections((prev) => ({ ...prev, payroll: true }));
  };

  // Helper function to select employee reports
  const selectEmployeeReport = (reportType) => {
    setEmployeeReportType(reportType);
    setSelectedReport('employee');
    setExpandedSections((prev) => ({ ...prev, employee: true }));
  };

  // Prepare filtered rows for Employment Type report based on dropdown selection
  const allTypeEmployees = [...fullTimeEmployees, ...partTimeEmployees];
  const filteredTypeEmployees = employmentFilter === 'all'
    ? allTypeEmployees
    : employmentFilter === 'full'
      ? fullTimeEmployees
      : partTimeEmployees;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Employees within 6 months of joining are considered new joiners / probation (only active employees)
  const newJoiners = activeEmployees.filter((employee) => {
    const joinedDate = getJoiningDate(employee);
    if (!joinedDate || Number.isNaN(joinedDate.getTime())) return false;
    joinedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - joinedDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 180; // 6 months = ~180 days
  });
  
  // Probation period = same as new joiners (6 months from joining date)
  const probationEmployees = newJoiners;

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Build leaves report data month-wise for selected year
  const leavesReportRows = activeEmployees.map((employee, index) => {
    const monthlyLeaves = Array(12).fill(0);
    if (employee.leaveHistory && Array.isArray(employee.leaveHistory)) {
      employee.leaveHistory.forEach((leave) => {
        if (leave.leaveDate) {
          const leaveDate = new Date(leave.leaveDate);
          if (leaveDate.getFullYear() === selectedYear) {
            monthlyLeaves[leaveDate.getMonth()]++;
          }
        }
      });
    }
    return {
      id: employee.id || index,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
      department: employee.department || 'N/A',
      jan: monthlyLeaves[0],
      feb: monthlyLeaves[1],
      mar: monthlyLeaves[2],
      apr: monthlyLeaves[3],
      may: monthlyLeaves[4],
      jun: monthlyLeaves[5],
      jul: monthlyLeaves[6],
      aug: monthlyLeaves[7],
      sep: monthlyLeaves[8],
      oct: monthlyLeaves[9],
      nov: monthlyLeaves[10],
      dec: monthlyLeaves[11],
    };
  });

  // Build attendance report (attendance summary by employee)
  const attendanceReportRows = activeEmployees.map((employee, index) => ({
    id: employee.id || index,
    name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
    department: employee.department || 'N/A',
    status: employee.employeeStatus || 'Active',
  }));

  const reportDetails = {
    salary: {
      title: 'Salary Reports',
      description: 'Review salary records for active employees only.',
      rows: salaryEmployees.map((employee, index) => ({
        id: employee.id || index,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        department: employee.department || 'N/A',
        salary: employee.ctc || employee.basicSalary || '0',
      })),
      columns: ['#', 'Employee Name', 'Department', 'Salary'],
      hasDownload: true,
    },
    leaves: {
      title: `Leave Report (${selectedYear})`,
      description: 'View employee leaves month-wise for the selected year.',
      rows: leavesReportRows,
      columns: ['#', 'Employee Name', 'Department', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      hasDownload: true,
      hasYearFilter: true,
    },
    attendance: {
      title: 'Attendance Report',
      description: 'View attendance records for all active employees.',
      rows: attendanceReportRows,
      columns: ['#', 'Employee Name', 'Department', 'Status'],
      hasDownload: true,
    },
  };

  // Employee report sub-types
  const employeeReports = {
    status: {
      title: 'Employee Exit Report',
      description: 'See employees with inactive status (resigned, terminated, or inactive).',
      rows: statusEmployees.map((employee, index) => ({
        id: employee.id || index,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        status: employee.employeeStatus || 'N/A',
        department: employee.department || 'N/A',
      })),
      columns: ['#', 'Employee Name', 'Status', 'Department'],
      hasDownload: true,
    },
    fulltime: {
      title: 'Full-Time Employees',
      description: 'View all active full-time employees.',
      rows: fullTimeEmployees.map((employee, index) => ({
        id: employee.id || index,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        type: 'Full-Time',
        department: employee.department || 'N/A',
      })),
      columns: ['#', 'Employee Name', 'Employment Type', 'Department'],
      hasDownload: true,
    },
    parttime: {
      title: 'Part-Time Employees',
      description: 'View all active part-time employees.',
      rows: partTimeEmployees.map((employee, index) => ({
        id: employee.id || index,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        type: 'Part-Time',
        department: employee.department || 'N/A',
      })),
      columns: ['#', 'Employee Name', 'Employment Type', 'Department'],
      hasDownload: true,
    },
    newJoiners: {
      title: 'New Joiners',
      description: 'Active employees who joined within the last 6 months (probation period).',
      rows: newJoiners.map((employee, index) => {
        const joinedDate = getJoiningDate(employee);
        const joinedText = joinedDate && !Number.isNaN(joinedDate.getTime())
          ? joinedDate.toISOString().split('T')[0]
          : 'N/A';
        return {
          id: employee.id || index,
          name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
          joined: joinedText,
          department: employee.department || 'N/A',
        };
      }),
      columns: ['#', 'Employee Name', 'Date Joined', 'Department'],
      hasDownload: true,
    },
    probation: {
      title: 'Probation Period',
      description: 'Active employees within 6 months of joining date (probation period).',
      rows: probationEmployees.map((employee, index) => {
        const joinedDate = getJoiningDate(employee);
        const joinedText = joinedDate && !Number.isNaN(joinedDate.getTime())
          ? joinedDate.toISOString().split('T')[0]
          : 'N/A';
        return {
          id: employee.id || index,
          name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
          joined: joinedText,
          department: employee.department || 'N/A',
        };
      }),
      columns: ['#', 'Employee Name', 'Date Joined', 'Department'],
      hasDownload: true,
    },
  };

  // Department filtering helper
  const matchesDepartment = (dept) => {
    if (!departmentFilter || departmentFilter === 'all') return true;
    const d = String(dept || '').trim().toLowerCase();
    const filterLower = String(departmentFilter).trim().toLowerCase();
    // Normalize spaces in both for comparison (e.g., "non-it" -> "non it", "Non IT" -> "non it")
    const dNormalized = d.replace(/-/g, ' ');
    const filterNormalized = filterLower.replace(/-/g, ' ');
    return dNormalized === filterNormalized;
  };

  // Get the current report to display
  let selected;
  if (selectedReport === 'employee') {
    selected = employeeReports[employeeReportType];
  } else {
    selected = reportDetails[selectedReport];
  }

  // Apply department filter to report's rows
  if (selected && Array.isArray(selected.rows)) {
    selected = {
      ...selected,
      rows: selected.rows.filter((r) => matchesDepartment(r.department)),
    };
  }

  const downloadReport = (report) => {
    const headers = report.columns;
    const rows = report.rows.map((row, index) => [
      index + 1,
      ...Object.keys(row)
        .filter((key) => key !== 'id')
        .map((cellKey) => row[cellKey]),
    ]);

    const escapeHtml = (value) => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const headerRow = headers
      .map((header) => `<th style="font-weight:bold; text-align:left; padding:6px;">${escapeHtml(header)}</th>`)
      .join('');

    const bodyRows = rows
      .map((row) => `
        <tr>
          ${row.map((cell) => `<td style="padding:6px;">${escapeHtml(cell)}</td>`).join('')}
        </tr>
      `)
      .join('');

    const tableHtml = `
      <table border="1" style="border-collapse:collapse;">
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8" />
          <!--[if gte mso 9]>
            <xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>${escapeHtml(report.title)}</x:Name>
                    <x:WorksheetOptions>
                      <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml>
          <![endif]-->
        </head>
        <body>${tableHtml}</body>
      </html>
    `;

    const fileName = `${report.title.replace(/\s+/g, '-').toLowerCase()}.xls`;
    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Reports</h1>
        <div className="header-info">
          <span>Welcome, {userName}!</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="reports-layout">
        {/* Left Sidebar */}
        <aside className="reports-sidebar">
          <h2>Reports</h2>
          <nav>
            {/* Payroll Section */}
            <div style={{ marginBottom: '12px' }}>
              <button 
                onClick={() => toggleSection('payroll')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1e3a8a',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                💰 Payroll
                <span>{expandedSections.payroll ? '▼' : '▶'}</span>
              </button>
              {expandedSections.payroll && (
                <div style={{ paddingLeft: '12px', marginTop: '8px' }}>
                  <button 
                    className={`${selectedReport === 'salary' ? 'active' : ''}`}
                    onClick={() => selectPayrollReport('salary')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: selectedReport === 'salary' ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    Salary Report
                  </button>
                </div>
              )}
            </div>

            {/* Employee Reports Section */}
            <div style={{ marginBottom: '12px' }}>
              <button 
                onClick={() => toggleSection('employee')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1e3a8a',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                👥 Employee Reports
                <span>{expandedSections.employee ? '▼' : '▶'}</span>
              </button>
              {expandedSections.employee && (
                <div style={{ paddingLeft: '12px', marginTop: '8px' }}>
                  <button 
                    onClick={() => selectEmployeeReport('status')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: (selectedReport === 'employee' && employeeReportType === 'status') ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    • Employee Exit Report
                  </button>
                  <button 
                    onClick={() => selectEmployeeReport('fulltime')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: (selectedReport === 'employee' && employeeReportType === 'fulltime') ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    • Full-Time Employees
                  </button>
                  <button 
                    onClick={() => selectEmployeeReport('parttime')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: (selectedReport === 'employee' && employeeReportType === 'parttime') ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    • Part-Time Employees
                  </button>
                  <button 
                    onClick={() => selectEmployeeReport('newJoiners')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: (selectedReport === 'employee' && employeeReportType === 'newJoiners') ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    • New Joiners
                  </button>
                  <button 
                    onClick={() => selectEmployeeReport('probation')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: (selectedReport === 'employee' && employeeReportType === 'probation') ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    • Probation Period
                  </button>
                </div>
              )}
            </div>

            {/* Leave Report Section */}
            <div style={{ marginBottom: '12px' }}>
              <button 
                onClick={() => toggleSection('leave')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1e3a8a',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                📅 Leave Report
                <span>{expandedSections.leave ? '▼' : '▶'}</span>
              </button>
              {expandedSections.leave && (
                <div style={{ paddingLeft: '12px', marginTop: '8px' }}>
                  <button 
                    className={`${selectedReport === 'leaves' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedReport('leaves');
                      setExpandedSections((prev) => ({ ...prev, leave: true }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: selectedReport === 'leaves' ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    View Leave Report
                  </button>
                </div>
              )}
            </div>

            {/* Attendance Report Section */}
            <div style={{ marginBottom: '12px' }}>
              <button 
                onClick={() => toggleSection('attendance')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#1e3a8a',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '600',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                ✓ Attendance Report
                <span>{expandedSections.attendance ? '▼' : '▶'}</span>
              </button>
              {expandedSections.attendance && (
                <div style={{ paddingLeft: '12px', marginTop: '8px' }}>
                  <button 
                    className={`${selectedReport === 'attendance' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedReport('attendance');
                      setExpandedSections((prev) => ({ ...prev, attendance: true }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      marginBottom: '4px',
                      background: selectedReport === 'attendance' ? '#3b82f6' : 'transparent',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    View Attendance Report
                  </button>
                </div>
              )}
            </div>
           
            <hr style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '12px 0' }} />
            <button 
              onClick={() => navigate('/admin')}
              style={{ opacity: 0.7 }}
            >
              ← Back to Dashboard
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="reports-main">
          <div className="reports-content-header">
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
          </div>

          {/* Controls */}
          <div className="report-controls-top">
            {selected.hasYearFilter && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginRight: '4px' }}>Year:</label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginRight: '4px' }}>Department:</label>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Non IT">Non IT</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            {selected && selected.hasDownload && (
              <button type="button" className="create-btn" onClick={() => downloadReport(selected)}>
                Download
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading report data...</p>
          ) : error ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>{error}</p>
          ) : !selected ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Please select a report.</p>
          ) : selected.rows.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>No records found for this report.</p>
          ) : (
            <div className="reports-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    {selected.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.rows.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{index + 1}</td>
                      {Object.keys(row).filter((key) => key !== 'id').map((field) => (
                        <td key={field}>{row[field]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminReportsPage;
