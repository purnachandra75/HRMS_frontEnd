import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { getLeaveRequestsPage } from '../services/leaveService';
import { getWorkingDaysByMonth } from '../utils/leaveUtils';
import '../styles/tailwind.css';

const REPORT_PAGE_SIZE = 500;

const TYPE_BADGE_CLASSES = {
  casual: 'border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]',
  sick: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
  paid: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
};

const STATUS_BADGE_CLASSES = {
  pending: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  approved: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  rejected: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

export default function AdminLeaveReportCard() {
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [appliedMonth, setAppliedMonth] = useState(new Date().getMonth() + 1);
  const [appliedYear, setAppliedYear] = useState(new Date().getFullYear());
  const [hasSearched, setHasSearched] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = [2024, 2025, 2026, 2027];

  const handleViewReport = async () => {
    const monthValue = selectedMonth;
    const yearValue = selectedYear;
    setAppliedMonth(monthValue);
    setAppliedYear(yearValue);
    setHasSearched(true);
    setLoading(true);
    setError(null);
    try {
      const { requests } = await getLeaveRequestsPage({
        search: searchTerm,
        month: monthValue,
        year: yearValue,
        size: REPORT_PAGE_SIZE,
      });
      setFilteredData(Array.isArray(requests) ? requests : []);
    } catch (err) {
      console.error('Failed to load leave report:', err);
      setError('Failed to load leave report.');
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total days by leave type for filtered data
  const calculateStats = () => {
    const stats = {
      casual: 0,
      sick: 0,
      paid: 0,
      total: 0,
    };

    filteredData.forEach((request) => {
      if ((request.status || '').toLowerCase() === 'approved') {
        const type = (request.leaveType || request.type || '').toLowerCase();
        // Only count the days that actually fall within the applied month/year,
        // so a leave range spanning two months isn't counted in full in both.
        const daysByMonth = getWorkingDaysByMonth(request.fromDate, request.toDate);
        const days = daysByMonth[`${appliedYear}-${appliedMonth - 1}`] || 0;

        if (type === 'casual') stats.casual += days;
        else if (type === 'sick') stats.sick += days;
        else if (type === 'paid') stats.paid += days;

        stats.total += days;
      }
    });

    return stats;
  };

  const stats = calculateStats();
  const monthName = months.find((m) => m.value === appliedMonth)?.label || 'January';

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Monthly Leave Report</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Employee Name / ID</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                className="h-9 w-64 rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
                placeholder="Search by name or employee ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Month</label>
            <select
              className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Year</label>
            <select
              className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleViewReport}
            disabled={loading}
            className="h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90 disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'View Report'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
      )}

      {!hasSearched ? (
        <div className="rounded-xl border border-border/80 bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          Enter an employee ID or name, choose a month and year, then click View Report.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-border/80 bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          Loading leave data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Casual Leaves', value: stats.casual },
              { label: 'Sick Leaves', value: stats.sick },
              { label: 'Paid Leaves', value: stats.paid },
              { label: 'Total Leaves', value: stats.total, total: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-4 shadow-sm ${
                  item.total ? 'border-client/30 bg-client/5' : 'border-border/80 bg-card'
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground">days</div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-foreground">
            Leave Details - {monthName} {appliedYear}
          </h3>

          {filteredData.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
              {`No leave records found for ${monthName} ${appliedYear}`}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ minWidth: 800 }}>
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/40">
                      {['Employee ID', 'Employee Name', 'Leave Type', 'From Date', 'To Date', 'Days', 'Status'].map((col) => (
                        <th key={col} className="h-11 whitespace-nowrap px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((request) => {
                      const typeKey = (request.leaveType || request.type || '').toLowerCase();
                      const statusKey = (request.status || '').toLowerCase();
                      return (
                        <tr key={request.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm text-foreground">
                            {request.empId || request.employeeId || request.employee?.empId || request.employee?.employeeId || request.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {request.employeeName || request.employee?.fullName || request.employee?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold capitalize ${
                                TYPE_BADGE_CLASSES[typeKey] || 'border-border bg-muted text-muted-foreground'
                              }`}
                            >
                              {typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(request.fromDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(request.toDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{request.days}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold capitalize ${
                                STATUS_BADGE_CLASSES[statusKey] || 'border-border bg-muted text-muted-foreground'
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
