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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
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

  const reportDetails = {
    salary: {
      title: 'Salary Related Records',
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
      hasDownload: false,
      hasYearFilter: true,
    },
    status: {
      title: 'Inactive Employees',
      description: 'See employees with inactive status (resigned, terminated, or inactive).',
      rows: statusEmployees.map((employee, index) => ({
        id: employee.id || index,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        status: employee.employeeStatus || 'N/A',
        department: employee.department || 'N/A',
      })),
      columns: ['#', 'Employee Name', 'Status', 'Department'],
      hasDownload: false,
    },
    type: {
      title: 'Employment Type Records',
      description: 'Filter active employees by part-time or full-time employment.',
      rows: [...fullTimeEmployees, ...partTimeEmployees].map((employee, index) => ({
        id: employee.id || index,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
        type: employee.employeeType || 'N/A',
        department: employee.department || 'N/A',
      })),
      columns: ['#', 'Employee Name', 'Employment Type', 'Department'],
      hasDownload: false,
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
      hasDownload: false,
    },
    probation: {
      title: 'Probation Period Employees',
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
      hasDownload: false,
    },
  };

  const selected = reportDetails[selectedReport];

  const downloadSalaryReport = () => {
    const headers = ['Employee Name', 'Department', 'Salary'];
    const rows = salaryEmployees.map((employee) => [
      `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
      employee.department || 'N/A',
      employee.ctc || employee.basicSalary || '0',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'employee-salary-report.csv');
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
            <button 
              className={`${selectedReport === 'salary' ? 'active' : ''}`}
              onClick={() => setSelectedReport('salary')}
            >
              Salary Related
            </button>
            <button 
              className={`${selectedReport === 'status' ? 'active' : ''}`}
              onClick={() => setSelectedReport('status')}
            >
              Inactive Employees
            </button>
            <button 
              className={`${selectedReport === 'type' ? 'active' : ''}`}
              onClick={() => setSelectedReport('type')}
            >
              Part-Time / Full-Time
            </button>
            <button 
              className={`${selectedReport === 'newJoiners' ? 'active' : ''}`}
              onClick={() => setSelectedReport('newJoiners')}
            >
              New Joiners
            </button>
            <button 
              className={`${selectedReport === 'probation' ? 'active' : ''}`}
              onClick={() => setSelectedReport('probation')}
            >
              Probation Period
            </button>
            <button 
              className={`${selectedReport === 'leaves' ? 'active' : ''}`}
              onClick={() => setSelectedReport('leaves')}
            >
              Leave Report
            </button>
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
            {selected.hasDownload && (
              <button type="button" className="create-btn" onClick={downloadSalaryReport}>
                Download Salary CSV
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading report data...</p>
          ) : error ? (
            <p style={{ padding: '24px', textAlign: 'center', color: '#dc2626' }}>{error}</p>
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
