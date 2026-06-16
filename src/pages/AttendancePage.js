import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttendanceRecords } from '../services/attendanceService';
import '../styles/Dashboard.css';
import AttendanceFilters from '../components/AttendanceFilters';

function AttendancePage({ userName, onLogout }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showReport, setShowReport] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAttendanceRecords();
  }, []);

  const loadAttendanceRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await getAttendanceRecords();
      setAttendanceRecords(records.map((record) => ({
        ...record,
        attendanceDate: record.date || record.attendanceDate || '',
      })));
    } catch (err) {
      console.error(err);
      setError('Unable to load attendance records from the backend.');
    } finally {
      setLoading(false);
    }
  };

  const dateString = currentTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const months = [
    'All Months',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const yearOptions = Array.from(
    new Set(
      attendanceRecords
        .filter((record) => record.attendanceDate)
        .map((record) => new Date(record.attendanceDate).getFullYear())
    )
  ).sort((a, b) => b - a);

  if (yearOptions.length === 0) {
    yearOptions.push(new Date().getFullYear());
  }

  const filteredRecords = attendanceRecords.filter((record) => {
    if (!record.attendanceDate) return false;
    const [year, month] = record.attendanceDate.split('-');
    const recordYear = parseInt(year, 10);
    const recordMonth = parseInt(month, 10);
    const monthMatch = selectedMonth === 0 || recordMonth === selectedMonth;
    const yearMatch = selectedYear === 0 || recordYear === selectedYear;
    const query = searchQuery.trim().toLowerCase();
    const idMatch = !query || record.employeeId?.toString().includes(query);
    const nameMatch = !query || record.employeeName?.toLowerCase().includes(query);
    return monthMatch && yearMatch && (idMatch || nameMatch);
  });

  const presentCount = filteredRecords.filter((record) => record.status === 'PRESENT').length;
  const absentCount = filteredRecords.filter((record) => record.status === 'ABSENT').length;
  const lateCount = filteredRecords.filter((record) => record.status === 'LATE').length;

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container attendance-page-admin">
      <header className="dashboard-header attendance-page-header">
        <div>
          <h1>Admin Attendance Portal</h1>
          <p>Review employee attendance, view daily time logs, and export attendance details.</p>
        </div>
        <div className="header-info">
          <span>{dateString}</span>
          <span>{timeString}</span>
          <button className="logout-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
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
            <button className="active" type="button" onClick={() => navigate('/admin/attendance')}>
              Attendance
            </button>
            <button type="button" onClick={() => navigate('/admin/payroll')}>
              Payroll
            </button>
            <button type="button" onClick={() => navigate('/admin/pf-generator')}>
              Payslip Generator
            </button>
            <hr className="reports-sidebar-divider" />
            <button type="button" onClick={() => navigate('/admin/employee/new')}>
              + Create Employee
            </button>
          </nav>
        </aside>

        <main className="reports-main attendance-main">
          <div className="reports-content-header">
            <h2>Attendance Records</h2>
            <p>Review employee attendance, filter by employee and month, and inspect daily time logs.</p>
          </div>

          {loading ? (
            <div className="attendance-loading">Loading attendance data...</div>
          ) : error ? (
            <div className="attendance-error">{error}</div>
          ) : (
            <>
              {showReport ? (
                <div className="stats-grid">
                  <div className="attendance-card">
                    <div className="stat-number">{filteredRecords.length}</div>
                    <div className="stat-label">Filtered Records</div>
                  </div>
                  <div className="attendance-card">
                    <div className="stat-number">{presentCount}</div>
                    <div className="stat-label">Present</div>
                  </div>
                  <div className="attendance-card">
                    <div className="stat-number">{absentCount}</div>
                    <div className="stat-label">Absent</div>
                  </div>
                  <div className="attendance-card">
                    <div className="stat-number">{lateCount}</div>
                    <div className="stat-label">Late / Late Arrival</div>
                  </div>
                </div>
              ) : (
                <div className="attendance-data-table" style={{ marginBottom: '24px', background: '#f8fafc' }}>
                  <div style={{ padding: '24px', color: '#475569' }}>
                    Enter employee ID or name, select a month, then click <strong>View Report</strong> to display the attendance report.
                  </div>
                </div>
              )}

              <AttendanceFilters
                searchValue={searchQuery}
                onSearchChange={(value) => {
                  setSearchQuery(value);
                  setShowReport(false);
                }}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                monthOptions={months}
                yearOptions={yearOptions}
                onMonthChange={(value) => {
                  setSelectedMonth(value);
                  setShowReport(false);
                }}
                onYearChange={(value) => {
                  setSelectedYear(value);
                  setShowReport(false);
                }}
                onViewReport={() => setShowReport(true)}
                showAllYears
              />

              <div className="attendance-data-table">
                <h3>Attendance Report</h3>
                {!showReport ? (
                  <div style={{ padding: '24px', color: '#475569' }}>
                    Search an employee name, choose a month, and click <strong>View Report</strong> to see the filtered attendance data.
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.employeeId}</td>
                          <td>{record.employeeName}</td>
                          <td>{record.attendanceDate}</td>
                          <td>{record.checkInTime}</td>
                          <td>{record.checkOutTime}</td>
                          <td>
                            <span className={record.status === 'ABSENT' ? 'absent-badge' : 'present-badge'}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                            No records found for the selected employee and month.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default AttendancePage;
