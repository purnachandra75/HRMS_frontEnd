import React, { useState } from 'react';
import { getAttendanceRecords } from '../services/attendanceService';
import '../styles/tailwind.css';
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
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
        )}

        {showReport && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Records', value: attendanceRecords.length },
              { label: 'Present', value: presentCount },
              { label: 'Absent', value: absentCount },
              { label: 'Late / Late Arrival', value: lateCount },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
                <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
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

        <div className="rounded-xl border border-border/80 bg-card shadow-sm">
          <h3 className="border-b border-border/80 px-5 py-4 text-base font-semibold text-foreground">Attendance Report</h3>
          {!showReport ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              Search an employee name, choose a month, and click <strong className="text-foreground">View Report</strong> to see the filtered attendance data.
            </div>
          ) : loading ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">Loading attendance data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 720 }}>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    {['ID', 'Employee', 'Date', 'Check In', 'Check Out', 'Status'].map((col) => (
                      <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id ?? `${record.employeeId}-${record.attendanceDate}`} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">{record.employeeId}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{record.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.attendanceDate}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkInTime}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkOutTime}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold ${
                            record.status === 'ABSENT'
                              ? 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
                              : 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No records found for the selected employee and month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AttendancePage;
