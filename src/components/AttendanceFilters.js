import React from 'react';

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
    <div className="report-controls">
      <div className="search-group">
        <label htmlFor="attendanceSearch">Search by employee ID or name</label>
        <input
          id="attendanceSearch"
          type="text"
          placeholder="Enter employee ID or name"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="month-selector">
        <label htmlFor="attendanceMonth">Select month</label>
        <select
          id="attendanceMonth"
          value={selectedMonth}
          onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
        >
          {monthOptions.map((month, idx) => (
            <option key={`${month}-${idx}`} value={idx}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="year-selector">
        <label htmlFor="attendanceYear">Select year</label>
        <select
          id="attendanceYear"
          value={selectedYear}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
        >
          {showAllYears && <option value={0}>All Years</option>}
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="report-action-buttons">
        <button type="button" className="create-btn" onClick={onViewReport}>
          View Report
        </button>
      </div>
    </div>
  );
}

export default AttendanceFilters;
