import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { getAttendanceRecords, updateAttendanceRecord } from '../services/attendanceService';
import '../styles/tailwind.css';
import AttendanceFilters from '../components/AttendanceFilters';
import AdminLayout from '../components/AdminLayout';

// Stored times look like "09:15:30 AM" (employee check-in page) or "09:15" - convert to the
// "HH:mm" an <input type="time"> needs, or '' if unreadable.
const toTimeInputValue = (value) => {
  const match = String(value || '').replace(/\s+/g, ' ').trim()
    .match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?\s*([AaPp][Mm])?$/);
  if (!match) return '';
  let hours = Number(match[1]);
  const suffix = match[3] ? match[3].toUpperCase() : null;
  if (suffix === 'PM' && hours < 12) hours += 12;
  if (suffix === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
};

function AttendancePage({ userName, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  // Day of the month to show (0 = all dates); only applies with a specific month and year.
  const [selectedDay, setSelectedDay] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Record being corrected by the admin, plus the form values in the edit dialog.
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'PRESENT', date: '', checkInTime: '', checkOutTime: '', remarks: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const todayKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  // Checked in on an earlier day but never checked out (or already flagged by the missed
  // check-out email job).
  const isMissedCheckout = (record) =>
    Boolean(record.id && record.checkInTime && !record.checkOutTime
      && (record.attendanceDate < todayKey || record.remarks === 'Missed check-out'));

  const openEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      status: record.status === 'ABSENT' ? 'ABSENT' : 'PRESENT',
      date: record.attendanceDate || '',
      checkInTime: toTimeInputValue(record.checkInTime),
      checkOutTime: toTimeInputValue(record.checkOutTime),
      remarks: record.remarks && record.remarks !== 'Missed check-out' ? record.remarks : '',
    });
    setEditError('');
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditingRecord(null);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setEditError('');
    try {
      const updated = await updateAttendanceRecord(editingRecord.id, {
        status: editForm.status,
        date: editForm.date,
        checkInTime: editForm.status === 'PRESENT' ? editForm.checkInTime : '',
        checkOutTime: editForm.status === 'PRESENT' ? editForm.checkOutTime : '',
        remarks: editForm.remarks.trim(),
      });
      setAttendanceRecords((records) => records.map((record) => (
        record.id === editingRecord.id
          ? { ...record, ...updated, attendanceDate: updated.date || record.attendanceDate }
          : record
      )));
      setEditingRecord(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update attendance');
    } finally {
      setSavingEdit(false);
    }
  };

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
      const dayKey = selectedDay > 0 && selectedMonth > 0 && selectedYear > 0
        ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
        : null;
      setAttendanceRecords(records
        .map((record) => ({
          ...record,
          attendanceDate: record.date || record.attendanceDate || '',
        }))
        .filter((record) => !dayKey || record.attendanceDate === dayKey));
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
            setSelectedDay(0);
            setShowReport(false);
          }}
          onYearChange={(value) => {
            setSelectedYear(value);
            setSelectedDay(0);
            setShowReport(false);
          }}
          selectedDay={selectedDay}
          onDayChange={(value) => {
            setSelectedDay(value);
            setShowReport(false);
          }}
          onViewReport={handleViewReport}
          showAllYears
        />

        <div className="rounded-xl border border-border/80 bg-card shadow-sm">
          <h3 className="border-b border-border/80 px-5 py-4 text-base font-semibold text-foreground">Attendance Report</h3>
          {!showReport ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              Search by Employee ID or name, choose a date, month and year, and click <strong className="text-foreground">View Report</strong> to see the filtered attendance data.
            </div>
          ) : loading ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">Loading attendance data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 720 }}>
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    {['Employee ID', 'Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Action'].map((col) => (
                      <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id ?? `${record.employeeId}-${record.attendanceDate}`} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">{record.employeeCode || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{record.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.attendanceDate}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkInTime}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.checkOutTime}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{record.totalHours ?? '-'}</td>
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
                        {isMissedCheckout(record) && (
                          <span className="ml-1.5 inline-flex h-6 items-center rounded-full border border-[#fde68a] bg-[#fffbeb] px-2.5 text-[11px] font-semibold text-[#b45309]">
                            Missed check-out
                          </span>
                        )}
                        {record.remarks && record.remarks !== 'Missed check-out' && (
                          <div className="mt-1 text-xs text-muted-foreground">{record.remarks}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {/* Days with no check-in at all are placeholder rows (no id) - nothing to edit. */}
                        {record.id ? (
                          <button
                            type="button"
                            onClick={() => openEdit(record)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Edit attendance"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No records found for the selected employee and date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={closeEdit}>
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-foreground">Edit Attendance</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {editingRecord.employeeName} ({editingRecord.employeeCode || 'N/A'}) &middot; {editingRecord.attendanceDate}
              <br />
              Checked in at {editingRecord.checkInTime || '-'}, check-out {editingRecord.checkOutTime || 'missing'}
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Status
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Date
                <input
                  type="date"
                  value={editForm.date}
                  max={todayKey}
                  onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </label>

              {editForm.status === 'PRESENT' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Check-in time
                    <input
                      type="time"
                      value={editForm.checkInTime}
                      onChange={(e) => setEditForm((f) => ({ ...f, checkInTime: e.target.value }))}
                      className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Check-out time
                    <input
                      type="time"
                      value={editForm.checkOutTime}
                      onChange={(e) => setEditForm((f) => ({ ...f, checkOutTime: e.target.value }))}
                      className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                    />
                  </label>
                  <span className="col-span-2 text-xs font-normal text-muted-foreground">
                    Total hours are recalculated from these times. A check-out earlier than check-in counts as the next day.
                  </span>
                </div>
              )}

              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Remarks
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
                  placeholder="e.g. Forgot to check out - confirmed with manager"
                  className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                />
              </label>

              {editError && <p className="text-sm text-red-600">{editError}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                disabled={savingEdit}
                className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="h-9 rounded-lg bg-client px-3 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AttendancePage;
