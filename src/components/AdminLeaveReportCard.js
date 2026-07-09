import React, { useState, useEffect } from 'react';
import { getLeaveRequests, getLeaveBalances } from '../services/leaveService';
import { calculateDaysBetween } from '../utils/leaveUtils';

export default function AdminLeaveReportCard() {
  const [allRequests, setAllRequests] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
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
    { value: 12, label: 'December' }
  ];

  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    setLoading(true);
    try {
      const data = await getLeaveRequests();
      setAllRequests(data);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getSearchableValues = (request) => {
    const values = [];

    const addValue = (value) => {
      if (value !== null && value !== undefined && value !== '') {
        values.push(String(value).toLowerCase());
      }
    };

    addValue(request.empId);
    addValue(request.employeeId);
    addValue(request.employee?.empId);
    addValue(request.employee?.employeeId);
    addValue(request.employeeName);
    addValue(request.employee?.fullName);
    addValue(request.employee?.name);
    addValue(request.name);

    return values;
  };

  const handleViewReport = () => {
    setAppliedSearchTerm(searchTerm.trim());
    setAppliedMonth(selectedMonth);
    setAppliedYear(selectedYear);
    setHasSearched(true);
  };

  // Filter data based on search term, month, and year
  useEffect(() => {
    if (!hasSearched) {
      setFilteredData([]);
      return;
    }

    let filtered = allRequests.filter(request => {
      const fromDate = new Date(request.fromDate);
      const toDate = new Date(request.toDate);
      
      // Check if request falls within selected month and year
      const isInSelectedMonth = (
        (fromDate.getFullYear() === appliedYear && fromDate.getMonth() + 1 === appliedMonth) ||
        (toDate.getFullYear() === appliedYear && toDate.getMonth() + 1 === appliedMonth)
      );

      if (!isInSelectedMonth) return false;

      // Filter by search term (employee name or employee ID)
      const searchLower = appliedSearchTerm.toLowerCase();
      const matchesSearch = !searchLower || getSearchableValues(request).some(value => value.includes(searchLower));

      return matchesSearch;
    });

    setFilteredData(filtered);
  }, [allRequests, appliedSearchTerm, appliedMonth, appliedYear, hasSearched]);

  // Calculate total days by leave type for filtered data
  const calculateStats = () => {
    const stats = {
      casual: 0,
      sick: 0,
      paid: 0,
      total: 0
    };

    filteredData.forEach(request => {
      if (request.status === 'Approved' || request.status === 'approved') {
        const type = (request.leaveType || request.type || '').toLowerCase();
        // Always calculate working days from dates to ensure consistency
        const days = calculateDaysBetween(request.fromDate, request.toDate) || request.days || 0;
        
        if (type === 'casual') stats.casual += days;
        else if (type === 'sick') stats.sick += days;
        else if (type === 'paid') stats.paid += days;
        
        stats.total += days;
      }
    });

    return stats;
  };

  const stats = calculateStats();
  const monthName = months.find(m => m.value === appliedMonth)?.label || 'January';

  if (loading) {
    return <div className="loading">Loading leave data...</div>;
  }

  return (
    <div className="admin-report-container">
      <div className="report-section">
        <div className="report-header">
          <h2>Monthly Leave Report</h2>
          <div className="report-filters">
            <div className="filter-group">
              <label>Employee Name / ID</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Search by name or employee ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Month</label>
              <select 
                className="filter-select"
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Year</label>
              <select 
                className="filter-select"
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <button
                type="button"
                onClick={handleViewReport}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginTop: '20px'
                }}
              >
                View Report
              </button>
            </div>
          </div>
        </div>

        {hasSearched ? (
          <>
            {/* Summary Cards */}
            <div className="report-summary">
              <div className="summary-card">
                <div className="summary-label">Casual Leaves</div>
                <div className="summary-value">{stats.casual}</div>
                <div className="summary-unit">days</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Sick Leaves</div>
                <div className="summary-value">{stats.sick}</div>
                <div className="summary-unit">days</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Paid Leaves</div>
                <div className="summary-value">{stats.paid}</div>
                <div className="summary-unit">days</div>
              </div>
              <div className="summary-card total">
                <div className="summary-label">Total Leaves</div>
                <div className="summary-value">{stats.total}</div>
                <div className="summary-unit">days</div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="report-title">
              <h3>Leave Details - {monthName} {appliedYear}</h3>
            </div>
            
            {filteredData.length === 0 ? (
              <div className="no-data">
                <p>{appliedSearchTerm ? `No leave records found for ${monthName} ${appliedYear}` : 'Enter an employee ID or name to view the report.'}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Leave Type</th>
                      <th>From Date</th>
                      <th>To Date</th>
                      <th>Days</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((request) => (
                      <tr key={request.id}>
                        <td>{request.empId || request.employeeId || request.employee?.empId || request.employee?.employeeId || request.id}</td>
                        <td>{request.employeeName || request.employee?.fullName || request.employee?.name || 'N/A'}</td>
                        <td>
                          <span className={`type-badge ${(request.leaveType || request.type || '').toLowerCase()}`}>
                            {(request.leaveType || request.type || '').charAt(0).toUpperCase() + (request.leaveType || request.type || '').slice(1)}
                          </span>
                        </td>
                        <td>{new Date(request.fromDate).toLocaleDateString()}</td>
                        <td>{new Date(request.toDate).toLocaleDateString()}</td>
                        <td>{request.days}</td>
                        <td>
                          <span className={`status-badge ${(request.status || '').toLowerCase()}`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="no-data">
            <p>Enter an employee ID or name, choose a month and year, then click View Report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
