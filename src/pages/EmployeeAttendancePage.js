import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EmployeeAttendance.css';

function EmployeeAttendancePage({ userId, userName, onLogout }) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkedOutToday, setCheckedOutToday] = useState(false);
  const [todayCheckInTime, setTodayCheckInTime] = useState(null);
  const [todayCheckOutTime, setTodayCheckOutTime] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [allAttendanceData, setAllAttendanceData] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const loadAttendanceData = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/api/attendance/employee/${userId}`);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((record) => ({
          ...record,
          day: record.date ? new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }) : '',
          totalHours: record.totalHours != null ? record.totalHours : '-',
          remarks: record.remarks || '-',
        }));
        setAllAttendanceData(mapped);
      } else {
        setAllAttendanceData([]);
      }
    } catch (error) {
      console.error('Failed to load attendance data', error);
      setAllAttendanceData([]);
    }
  };

  const loadTodayAttendance = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_BASE}/api/attendance/today/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCheckedInToday(Boolean(data.checkInTime));
        setCheckedOutToday(Boolean(data.checkOutTime));
        setTodayCheckInTime(data.checkInTime || null);
        setTodayCheckOutTime(data.checkOutTime || null);
      } else {
        setCheckedInToday(false);
        setCheckedOutToday(false);
        setTodayCheckInTime(null);
        setTodayCheckOutTime(null);
      }
    } catch (error) {
      console.error('Failed to load today attendance', error);
      setCheckedInToday(false);
      setCheckedOutToday(false);
      setTodayCheckInTime(null);
      setTodayCheckOutTime(null);
    }
  };

  useEffect(() => {
    loadAttendanceData();
    loadTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [userId]);

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleCheckIn = async () => {
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      const response = await fetch(`${API_BASE}/api/attendance/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: userId, checkInTime }),
      });
      const result = await response.json();
      if (response.ok) {
        setTodayCheckInTime(checkInTime);
        setCheckedInToday(true);
        setCheckedOutToday(false);
        setStatusMessage(result.message || `✅ Checked in successfully at ${checkInTime}`);
        await loadAttendanceData();
      } else {
        setStatusMessage(result.error || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check in error', error);
      setStatusMessage('Network error during check-in.');
    }
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleCheckOut = async () => {
    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      const response = await fetch(`${API_BASE}/api/attendance/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: userId, checkOutTime }),
      });
      const result = await response.json();
      if (response.ok) {
        setTodayCheckOutTime(checkOutTime);
        setCheckedOutToday(true);
        setStatusMessage(result.message || '🔴 Checked out successfully');
        await loadAttendanceData();
        await loadTodayAttendance();
      } else {
        setStatusMessage(result.error || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check out error', error);
      setStatusMessage('Network error during check-out.');
    }
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Statistics calculations
  const presentDays = allAttendanceData.filter((r) => r.status === 'PRESENT').length;
  const totalDays = allAttendanceData.length;
  const absentDays = totalDays - presentDays;
  let totalWorkHours = 0;
  allAttendanceData.forEach((record) => {
    if (record.totalHours && record.totalHours !== '-') {
      totalWorkHours += parseFloat(record.totalHours) || 0;
    }
  });
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

  // Monthly data
  const monthlyData = allAttendanceData.filter((record) => {
    if (!record.date) return false;
    const [recordYear, recordMonth] = record.date.split('-');
    return parseInt(recordYear, 10) === selectedYear && parseInt(recordMonth, 10) === selectedMonth;
  });

  const monthlyPresent = monthlyData.filter((r) => r.status === 'PRESENT').length;
  const monthlyTotal = monthlyData.length;
  const monthlyAbsent = monthlyTotal - monthlyPresent;
  let monthlyHours = 0;
  monthlyData.forEach((r) => {
    if (r.totalHours && r.totalHours !== '-') {
      monthlyHours += parseFloat(r.totalHours) || 0;
    }
  });
  const monthlyRate = monthlyTotal > 0 ? ((monthlyPresent / monthlyTotal) * 100).toFixed(1) : 0;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="employee-attendance-page">
      {/* Header */}
      <div className="attendance-header-top">
        <div className="attendance-header-content">
          <div className="attendance-welcome">
            <h1>📋 Attendance Portal</h1>
            <p>Welcome, <strong>{userName}</strong></p>
          </div>
          <div className="attendance-datetime">
            <div className="attendance-time">{timeString}</div>
            <div className="attendance-date">{dateString}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="attendance-container">
        {/* User Info Card */}
        <div className="user-card">
          <div className="user-info">
            <h3>{userName}</h3>
            <p>Employee Portal</p>
          </div>
          <div>
            <strong>Employee ID:</strong> <span>{userId}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="attendance-tabs">
          <button
            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            📅 Today's Attendance & Rate
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📊 Monthly Report & History
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && <div className="status-message status-info">{statusMessage}</div>}

        {/* TAB 1: Today's Attendance */}
        {activeTab === 'today' && (
          <div className="today-section">
            {/* Left Side: Check In/Out */}
            <div className="card">
              <h2 className="card-title">✅ Today's Attendance</h2>
              <div className="attendance-buttons">
                <button
                  className="checkin-btn"
                  onClick={handleCheckIn}
                  disabled={checkedInToday}
                >
                  ✅ CHECK IN
                </button>
                <button
                  className="checkout-btn"
                  onClick={handleCheckOut}
                  disabled={!checkedInToday || checkedOutToday}
                >
                  🔴 CHECK OUT
                </button>
              </div>
              <div className="today-status">
                {!checkedInToday && <p>Click CHECK IN to start your day</p>}
                {checkedInToday && !checkedOutToday && (
                  <p>✅ You checked in at {todayCheckInTime}. Click CHECK OUT when leaving.</p>
                )}
                {checkedInToday && checkedOutToday && (
                  <p>✅ Completed - Checked in at {todayCheckInTime}, out at {todayCheckOutTime}</p>
                )}
              </div>
            </div>

            {/* Right Side: Attendance Rate */}
            <div className="card">
              <h2 className="card-title">📈 Overall Attendance Rate</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{presentDays}</div>
                  <div className="stat-label">Total Present Days</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{absentDays}</div>
                  <div className="stat-label">Total Absent Days</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{totalDays}</div>
                  <div className="stat-label">Total Working Days</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{totalWorkHours.toFixed(1)}</div>
                  <div className="stat-label">Total Hours Worked</div>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${attendanceRate}%` }}>
                  {attendanceRate}%
                </div>
              </div>
              <p style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
                Your Overall Attendance Rate
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Reports & History */}
        {activeTab === 'reports' && (
          <>
            {/* Monthly Report */}
            <div className="card">
              <h2 className="card-title">📅 Monthly Attendance Report</h2>
              <div className="month-selector">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                  {months.map((month, idx) => (
                    <option key={idx} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{monthlyPresent}</div>
                  <div className="stat-label">Present</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{monthlyAbsent}</div>
                  <div className="stat-label">Absent</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{monthlyTotal}</div>
                  <div className="stat-label">Total Days</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{monthlyHours.toFixed(1)}</div>
                  <div className="stat-label">Total Hours</div>
                </div>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${monthlyRate}%` }}>
                  {monthlyRate}%
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Hours</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center' }}>
                          Select a month to view
                        </td>
                      </tr>
                    ) : (
                      monthlyData.map((record) => (
                        <tr key={record.id}>
                          <td>{record.date}</td>
                          <td>{record.day}</td>
                          <td>{record.checkInTime}</td>
                          <td>{record.checkOutTime}</td>
                          <td>{record.totalHours}</td>
                          <td>
                            <span
                              className={record.status === 'PRESENT' ? 'present-badge' : 'absent-badge'}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attendance History */}
            <div className="card">
              <h2 className="card-title">📊 Complete Attendance History</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In Time</th>
                      <th>Check Out Time</th>
                      <th>Total Hours</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendanceData.length === 0 ? (
                      <tr>
                        <td colSpan="6">No attendance records found</td>
                      </tr>
                    ) : (
                      allAttendanceData.map((record) => (
                        <tr key={record.id}>
                          <td>{record.date}</td>
                          <td>{record.checkInTime}</td>
                          <td>{record.checkOutTime}</td>
                          <td>{record.totalHours}</td>
                          <td>
                            <span
                              className={record.status === 'PRESENT' ? 'present-badge' : 'absent-badge'}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td>{record.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmployeeAttendancePage;
