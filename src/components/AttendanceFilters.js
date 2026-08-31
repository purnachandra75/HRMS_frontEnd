import React from 'react';
import { Search } from 'lucide-react';
import '../styles/tailwind.css';

function AttendanceFilters({
  searchValue,
  onSearchChange,
  selectedMonth,
  selectedYear,
  monthOptions,
  yearOptions,
  onMonthChange,
  onYearChange,
  onViewReport,
  showAllYears = false,
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="attendanceSearch" className="text-sm font-medium text-foreground">
          Search by employee ID or name
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="attendanceSearch"
            type="text"
            placeholder="Enter employee ID or name"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-64 rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="attendanceMonth" className="text-sm font-medium text-foreground">
          Select month
        </label>
        <select
          id="attendanceMonth"
          value={selectedMonth}
          onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
          className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
        >
          {monthOptions.map((month, idx) => (
            <option key={`${month}-${idx}`} value={idx}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="attendanceYear" className="text-sm font-medium text-foreground">
          Select year
        </label>
        <select
          id="attendanceYear"
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
          className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
        >
          {showAllYears && <option value={0}>All Years</option>}
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onViewReport}
        className="h-9 rounded-lg bg-client px-4 text-sm font-medium text-client-foreground hover:bg-client/90"
      >
        View Report
      </button>
    </div>
  );
}

export default AttendanceFilters;
