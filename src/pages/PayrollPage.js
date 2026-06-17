import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees } from '../services/employeeService';
import { runPayroll } from '../services/payrollService';
import '../styles/Dashboard.css';
import '../styles/Payroll.css';

const parseCsvLine = (line) => {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
};

const parsePayrollReport = (text) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });

  return { headers, rows };
};

function PayrollPage({ userName, onLogout }) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [includedEmployeeIds, setIncludedEmployeeIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [excludedSearchQuery, setExcludedSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [runError, setRunError] = useState('');
  const [reportPreview, setReportPreview] = useState({ headers: [], rows: [] });

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const data = await getAllEmployees();
        const activeEmployees = data.filter(
          (employee) => (employee.role || '').toLowerCase() !== 'admin'
            && (employee.employeeStatus || '').toLowerCase() !== 'inactive'
        );

        setEmployees(activeEmployees);
        setIncludedEmployeeIds(activeEmployees.map((employee) => String(employee.id)));
        setError('');
      } catch (err) {
        console.error('Failed to load payroll employees:', err);
        setError('Unable to load payroll employees at this time.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleToggleEmployee = (employeeId) => {
    const key = String(employeeId);
    setIncludedEmployeeIds((current) =>
      current.includes(key)
        ? current.filter((id) => id !== key)
        : [...current, key]
    );
  };

  const handleRunPayroll = async () => {
    const payload = {
      employees: includedEmployees.map((employee) => ({
        employeeId: employee.id,
        employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A',
      })),
      month: selectedMonth,
      year: selectedYear,
    };

    setRunning(true);
    setRunError('');
    setDownloadMessage('');
    setReportPreview({ headers: [], rows: [] });

    try {
      const { reportText } = await runPayroll(payload);
      const parsedReport = parsePayrollReport(reportText);
      setReportPreview(parsedReport);

      const csvBlob = new Blob([reportText], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `payroll-${selectedMonth}-${selectedYear}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      setDownloadMessage('Payroll report generated and downloaded as CSV.');
    } catch (err) {
      console.error('Failed to run payroll:', err);
      setRunError(err.message || 'Failed to run payroll');
    } finally {
      setRunning(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return employees;

    return employees.filter((employee) => {
      const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
      return [
        employee.id,
        fullName,
        employee.email,
        employee.phone,
        employee.department,
        employee.designation,
      ].some((field) => field?.toString().toLowerCase().includes(query));
    });
  }, [employees, searchQuery]);

  const includedEmployees = filteredEmployees.filter((employee) =>
    includedEmployeeIds.includes(String(employee.id))
  );

  const excludedEmployees = filteredEmployees.filter((employee) =>
    !includedEmployeeIds.includes(String(employee.id))
  );

  const filteredExcludedEmployees = useMemo(() => {
    const query = excludedSearchQuery.trim().toLowerCase();
    if (!query) return excludedEmployees;

    return excludedEmployees.filter((employee) => {
      const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
      return [
        employee.id,
        fullName,
        employee.email,
        employee.phone,
        employee.department,
        employee.designation,
      ].some((field) => field?.toString().toLowerCase().includes(query));
    });
  }, [excludedEmployees, excludedSearchQuery]);

  const activeEmployeeCount = employees.length;
  const includedCount = includedEmployeeIds.length;
  const excludedCount = Math.max(activeEmployeeCount - includedCount, 0);
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const yearOptions = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);

  const renderPayrollTable = (rows, emptyMessage, isIncludedList) => {
    if (rows.length === 0) {
      return <p className="payroll-empty">{emptyMessage}</p>;
    }

    return (
      <div className="table-responsive">
        <table className="employees-table payroll-table">
          <thead>
            <tr>
              <th>Include</th>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Phone</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((employee) => {
              const employeeId = String(employee.id);
              const isIncluded = includedEmployeeIds.includes(employeeId);

              return (
                <tr key={employee.id} className={!isIncluded ? 'payroll-row-excluded' : ''}>
                  <td className="payroll-toggle-cell">
                    <label className="payroll-toggle">
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={() => handleToggleEmployee(employee.id)}
                      />
                      
                    </label>
                  </td>
                  <td>{employee.id}</td>
                  <td>{`${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A'}</td>
                  <td>{employee.email || 'N/A'}</td>
                  <td>{employee.department || 'N/A'}</td>
                  <td>{employee.designation || 'N/A'}</td>
                  <td>{employee.phone || 'N/A'}</td>
                  <td>{employee.ctc || employee.basicSalary || 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="dashboard-container payroll-page">
      <header className="dashboard-header">
        <div>
          <h1>Payroll Module</h1>
          {/* <p className="dashboard-subtitle">Manage which active employees are included or excluded from payroll.</p> */}
        </div>
        <div className="header-info">
          <span>Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="reports-layout admin-dashboard-layout">
        <aside className="reports-sidebar">
          <h2>Dashboard</h2>
          <nav>
            <button type="button" onClick={() => navigate('/admin')}>
              Employee Details
            </button>
            <button type="button" onClick={() => navigate('/admin/leaves')}>
              Leave Management
            </button>
            <button type="button" onClick={() => navigate('/admin/reports')}>
              Reports
            </button>
            <button type="button" onClick={() => navigate('/admin/attendance')}>
              Attendance
            </button>
            <button type="button" className="active" onClick={() => navigate('/admin/payroll')}>
              Payroll
            </button>
            <button type="button" onClick={() => navigate('/admin/pf-generator')}>
              Payslip 
            </button>
            <hr className="reports-sidebar-divider" />
            <button type="button" onClick={() => navigate('/admin/employee/new')}>
              + Create Employee
            </button>
          </nav>
        </aside>

        <main className="reports-main payroll-main">
          <div className="reports-content-header">
            <h2>Payroll</h2>
            <p>Search active employees, then use the checkbox to include or exclude them from payroll.</p>
          </div>

          <section className="payroll-summary-grid">
            <div className="payroll-summary-card">
              <span>Active Employees</span>
              <strong>{activeEmployeeCount}</strong>
            </div>
            <div className="payroll-summary-card">
              <span>Included</span>
              <strong>{includedCount}</strong>
            </div>
            <div className="payroll-summary-card">
              <span>Excluded</span>
              <strong>{excludedCount}</strong>
            </div>
            
          </section>

          <section className="payroll-section">
            <div className="payroll-toolbar">
              <div className="header-left">
                <div className="search-bar payroll-search-bar">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by ID, name, email, department, or designation"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="payroll-toolbar-actions">
                <div className="payroll-period-controls">
                  <label>
                    Month
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                      {monthOptions.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Year
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="payroll-note">Uncheck a row to exclude it from payroll.</p>
                <button
                  type="button"
                  className="create-btn payroll-run-btn"
                  onClick={handleRunPayroll}
                  disabled={running || includedEmployees.length === 0}
                >
                  {running ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>

            {loading ? (
              <p className="payroll-empty">Loading payroll data...</p>
            ) : error ? (
              <p className="payroll-empty payroll-error">{error}</p>
            ) : (
              <>
                {(runError || downloadMessage) && (
                  <div className={`payroll-run-result ${runError ? 'payroll-run-error' : ''}`}>
                    {runError ? (
                      <p>{runError}</p>
                    ) : (
                      <p className="payroll-run-title">{downloadMessage}</p>
                    )}
                  </div>
                )}

                <div className="payroll-group">
                  <div className="payroll-group-header">
                    <h3>Included Employees</h3>
                    <span>{includedEmployees.length} employees</span>
                  </div>
                  {renderPayrollTable(
                    includedEmployees,
                    'No included employees match your search.',
                    true
                  )}
                </div>

                <div className="payroll-group">
                  <div className="payroll-group-header">
                    <h3>Excluded Employees</h3>
                    <span>{filteredExcludedEmployees.length} employees</span>
                  </div>
                  <div className="payroll-group-search">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search excluded employees"
                      value={excludedSearchQuery}
                      onChange={(e) => setExcludedSearchQuery(e.target.value)}
                    />
                  </div>
                  {renderPayrollTable(
                    filteredExcludedEmployees,
                    'No excluded employees match your search.',
                    false
                  )}
                </div>

                {reportPreview.headers.length > 0 && reportPreview.rows.length > 0 && (
                  <div className="payroll-group">
                    <div className="payroll-group-header">
                      <h3>Payroll Report Preview</h3>
                      <span>{reportPreview.rows.length} rows</span>
                    </div>
                    <div className="table-responsive">
                      <table className="employees-table payroll-table payroll-run-table">
                        <thead>
                          <tr>
                            {reportPreview.headers.map((header) => (
                              <th key={header}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportPreview.rows.map((row, index) => (
                            <tr key={`${row['Payroll ID'] || index}-${index}`}>
                              {reportPreview.headers.map((header) => (
                                <td key={`${header}-${index}`}>{row[header] || ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default PayrollPage;
