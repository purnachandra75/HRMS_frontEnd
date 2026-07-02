import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../components/EmployeeLayout';
import { getEmployeeLeaveRequests } from '../services/leaveService';
import { getHolidays } from '../services/holidayService';
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
  const [isOnApprovedLeaveToday, setIsOnApprovedLeaveToday] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const parseLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = String(value).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

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

  const loadApprovedLeaveStatus = async () => {
    if (!userId) return;
    try {
      const leaveRequests = await getEmployeeLeaveRequests(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const hasApprovedLeaveToday = leaveRequests.some((request) => {
        if ((request.status || '').toLowerCase() !== 'approved') {
          return false;
        }

        const fromDate = parseLocalDate(request.fromDate);
        const toDate = parseLocalDate(request.toDate);
        if (!fromDate || !toDate) {
          return false;
        }

        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        return today >= fromDate && today <= toDate;
      });

      setIsOnApprovedLeaveToday(hasApprovedLeaveToday);
    } catch (error) {
      console.error('Failed to load approved leave status', error);
      setIsOnApprovedLeaveToday(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
    loadTodayAttendance();
    loadApprovedLeaveStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [userId]);

  useEffect(() => {
    const loadHolidayData = async () => {
      try {
        const data = await getHolidays(selectedYear);
        setHolidays(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load holiday dates', error);
        setHolidays([]);
      }
    };

    loadHolidayData();
  }, [selectedYear]);

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
        setStatusMessage(result.message || `Checked in successfully at ${checkInTime}`);
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
        setStatusMessage(result.message || 'Checked out successfully');
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

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return holidays.some((holiday) => {
      const holidayDate = holiday?.date ? new Date(holiday.date).toISOString().split('T')[0] : null;
      return holidayDate === dateKey;
    });
  };

  const getWorkingDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDate = new Date(year, month - 1, day);
      if (!isWeekend(currentDate) && !isHoliday(currentDate)) {
        workingDays.push(currentDate);
      }
    }

    return workingDays;
  };

  const monthlyData = allAttendanceData.filter((record) => {
    if (!record.date) return false;
    const [recordYear, recordMonth] = record.date.split('-');
    return parseInt(recordYear, 10) === selectedYear && parseInt(recordMonth, 10) === selectedMonth;
  });

  const monthlyPresent = monthlyData.filter((record) => record.status === 'PRESENT').length;
  const monthlyWorkingDays = getWorkingDaysInMonth(selectedYear, selectedMonth);
  const workingDaysUpToToday = monthlyWorkingDays.filter((day) => day <= new Date());
  const monthlyAbsent = Math.max(0, workingDaysUpToToday.length - monthlyPresent);
  let monthlyHours = 0;
  monthlyData.forEach((record) => {
    if (record.totalHours && record.totalHours !== '-') {
      monthlyHours += parseFloat(record.totalHours) || 0;
    }
  });
  const monthlyRate = workingDaysUpToToday.length > 0 ? ((monthlyPresent / workingDaysUpToToday.length) * 100).toFixed(1) : 0;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const checkInDisabled = checkedInToday || isOnApprovedLeaveToday;
  const checkOutDisabled = !checkedInToday || checkedOutToday || isOnApprovedLeaveToday;

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="attendance"
      title="Attendance Portal"
      subtitle="Track today's attendance, review your attendance rate, and inspect monthly history."
    >
      <div className="employee-attendance-page employee-attendance-layout">
        <div className="attendance-container">
          <div className="user-card">
            <div className="user-info">
              <h3>{userName}</h3>
              <p>Employee Portal</p>
            </div>
            <div className="attendance-datetime">
              <div className="attendance-time">{timeString}</div>
              <div className="attendance-date">{dateString}</div>
            </div>
            <div>
              <strong>Employee ID:</strong> <span>{userId}</span>
            </div>
          </div>

          <div className="attendance-tabs">
            <button className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>
              Today's Attendance & Rate
            </button>
            <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              Monthly Report & History
            </button>
          </div>

          {statusMessage && <div className="status-message status-info">{statusMessage}</div>}

          {activeTab === 'today' && (
            <div className="today-section">
              <div className="card">
                <h2 className="card-title">Today's Attendance</h2>
                <div className="attendance-buttons">
                  <button className="checkin-btn" onClick={handleCheckIn} disabled={checkInDisabled}>
                    CHECK IN
                  </button>
                  <button className="checkout-btn" onClick={handleCheckOut} disabled={checkOutDisabled}>
                    CHECK OUT
                  </button>
                </div>
                <div className="today-status">
                  {isOnApprovedLeaveToday && <p>You are on approved leave today, so check-in and check-out are disabled.</p>}
                  {!isOnApprovedLeaveToday && !checkedInToday && <p>Click CHECK IN to start your day.</p>}
                  {!isOnApprovedLeaveToday && checkedInToday && !checkedOutToday && (
                    <p>You checked in at {todayCheckInTime}. Click CHECK OUT when leaving.</p>
                  )}
                  {!isOnApprovedLeaveToday && checkedInToday && checkedOutToday && (
                    <p>Completed - Checked in at {todayCheckInTime}, out at {todayCheckOutTime}</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'reports' && (
            <>
              <div className="card">
                <h2 className="card-title">Monthly Attendance Report</h2>
                <div className="month-selector">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}>
                    {months.map((month, idx) => (
                      <option key={month} value={idx + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}>
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
                    <div className="stat-number">{workingDaysUpToToday.length}</div>
                    <div className="stat-label">Working Days Till Date</div>
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
                              <span className={record.status === 'PRESENT' ? 'present-badge' : 'absent-badge'}>
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

              <div className="card">
                <h2 className="card-title">Complete Attendance History</h2>
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
                              <span className={record.status === 'PRESENT' ? 'present-badge' : 'absent-badge'}>
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
    </EmployeeLayout>
  );
}

export default EmployeeAttendancePage;
