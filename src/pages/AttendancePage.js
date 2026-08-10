import React, { useState } from 'react';
import { getAttendanceRecords } from '../services/attendanceService';
import '../styles/Dashboard.css';
import AttendanceFilters from '../components/AttendanceFilters';
import AdminLayout from '../components/AdminLayout';

function AttendancePage({ userName, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showReport, setShowReport] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const months = [
    'All Months',
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const loadAttendanceRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery) params.search = trimmedQuery;
      if (selectedYear !== 0) params.year = selectedYear;
      if (selectedMonth !== 0) params.monthNumber = selectedMonth;

      const records = await getAttendanceRecords(params);
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

  const handleViewReport = () => {
    setShowReport(true);
    loadAttendanceRecords();
  };

  const presentCount = attendanceRecords.filter((record) => record.status === 'PRESENT').length;
  const absentCount = attendanceRecords.filter((record) => record.status === 'ABSENT').length;
  const lateCount = attendanceRecords.filter((record) => record.status === 'LATE').length;

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="attendance"
      title="Attendance Records"
      subtitle="Review employee attendance, filter by employee and month, and inspect daily time logs."
    >
          {error && <div className="attendance-error">{error}</div>}

          {showReport ? (
            <div className="stats-grid">
              <div className="attendance-card">
                <div className="stat-number">{attendanceRecords.length}</div>
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
            onViewReport={handleViewReport}
            showAllYears
          />

          <div className="attendance-data-table">
            <h3>Attendance Report</h3>
            {!showReport ? (
              <div style={{ padding: '24px', color: '#475569' }}>
                Search an employee name, choose a month, and click <strong>View Report</strong> to see the filtered attendance data.
              </div>
            ) : loading ? (
              <div className="attendance-loading">Loading attendance data...</div>
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
                  {attendanceRecords.map((record) => (
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
                  {attendanceRecords.length === 0 && (
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
    </AdminLayout>
  );
}

export default AttendancePage;
