import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import EmployeeLayout from '../components/EmployeeLayout';
import { getEmployeeLeaveRequests } from '../services/leaveService';
import { getHolidays } from '../services/holidayService';
import { apiFetch } from '../utils/apiClient';
import '../styles/tailwind.css';

function EmployeeAttendancePage({ userId, userName, onLogout }) {
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

  const loadAttendanceData = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/attendance/employee/${userId}`);
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
  }, [API_BASE, userId]);

  const loadTodayAttendance = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await apiFetch(`${API_BASE}/api/attendance/today/${userId}`);
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
  }, [API_BASE, userId]);

  const loadApprovedLeaveStatus = useCallback(async () => {
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
  }, [userId]);

  useEffect(() => {
    loadAttendanceData();
    loadTodayAttendance();
    loadApprovedLeaveStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadAttendanceData, loadTodayAttendance, loadApprovedLeaveStatus]);

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
      const response = await apiFetch(`${API_BASE}/api/attendance/checkin`, {
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
      const response = await apiFetch(`${API_BASE}/api/attendance/checkout`, {
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
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-foreground">{userName}</h3>
            <p className="text-sm text-muted-foreground">Employee Portal</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-lg font-semibold tabular-nums text-foreground">
              <Clock className="size-4 text-employee" />
              {timeString}
            </div>
            <div className="text-sm text-muted-foreground">{dateString}</div>
          </div>
          <div className="text-sm text-foreground">
            <strong>Employee ID:</strong> <span>{userId}</span>
          </div>
        </div>

        <div className="inline-flex w-fit gap-1 rounded-lg border border-border/80 bg-card p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('today')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'today' ? 'bg-employee text-employee-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Today's Attendance & Rate
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'reports' ? 'bg-employee text-employee-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly Report & History
          </button>
        </div>

        {statusMessage && (
          <div className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff] px-3 py-2 text-sm text-[#0369a1]">{statusMessage}</div>
        )}

        {activeTab === 'today' && (
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Today's Attendance</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleCheckIn}
                disabled={checkInDisabled}
                className="h-10 flex-1 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                CHECK IN
              </button>
              <button
                onClick={handleCheckOut}
                disabled={checkOutDisabled}
                className="h-10 flex-1 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                CHECK OUT
              </button>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
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
        )}

        {activeTab === 'reports' && (
          <>
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Monthly Attendance Report</h2>
              <div className="mt-3 flex gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                >
                  {months.map((month, idx) => (
                    <option key={month} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Present', value: monthlyPresent },
                  { label: 'Absent', value: monthlyAbsent },
                  { label: 'Working Days Till Date', value: workingDaysUpToToday.length },
                  { label: 'Total Hours', value: monthlyHours.toFixed(1) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border/80 bg-background p-4 text-center">
                    <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 h-6 overflow-hidden rounded-full bg-muted">
                <div
                  className="flex h-full items-center justify-end bg-employee px-2 text-[11px] font-semibold text-employee-foreground transition-all"
                  style={{ width: `${monthlyRate}%` }}
                >
                  {monthlyRate}%
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full text-left" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40">
                      {['Date', 'Day', 'Check In', 'Check Out', 'Hours', 'Status'].map((col) => (
                        <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                          Select a month to view
                        </td>
                      </tr>
                    ) : (
                      monthlyData.map((record) => (
                        <tr key={record.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm text-foreground">{record.date}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.day}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkInTime}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkOutTime}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.totalHours}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                                record.status === 'PRESENT'
                                  ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                                  : 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                              }`}
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

            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Complete Attendance History</h2>
              <div className="mt-4 overflow-x-auto rounded-xl border border-border/80">
                <table className="w-full text-left" style={{ minWidth: 720 }}>
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40">
                      {['Date', 'Check In Time', 'Check Out Time', 'Total Hours', 'Status', 'Remarks'].map((col) => (
                        <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allAttendanceData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No attendance records found
                        </td>
                      </tr>
                    ) : (
                      allAttendanceData.map((record) => (
                        <tr key={record.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm text-foreground">{record.date}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkInTime}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkOutTime}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.totalHours}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                                record.status === 'PRESENT'
                                  ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                                  : 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{record.remarks || '-'}</td>
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
    </EmployeeLayout>
  );
}

export default EmployeeAttendancePage;
