import React, { useState, useEffect, useCallback } from 'react';
import EmployeeRequestTable from './EmployeeRequestTable';
import { getEmployeeLeaveRequests, getLeaveBalances } from '../services/leaveService';
import { normalizeLeaveBalances } from '../utils/leaveUtils';

export default function LeaveReportCard({ userId }) {
  const [leaveData, setLeaveData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const years = [2024, 2025, 2026, 2027];

  const loadLeaveData = useCallback(async () => {
    setLoading(true);
    try {
      const [balancesData, requestsData] = await Promise.all([
        getLeaveBalances(userId),
        getEmployeeLeaveRequests(userId)
      ]);
      
      setLeaveData(normalizeLeaveBalances(balancesData));
      setRequests(requestsData);
    } catch (err) {
      console.error('Failed to load leave data:', err);
      setLeaveData(normalizeLeaveBalances({}));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Calculate monthly data from actual requests
  const calculateMonthlyData = () => {
    const monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    requests.forEach(request => {
      // Only count approved requests
      if (request.status === 'Approved' || request.status === 'approved') {
        const fromDate = new Date(request.fromDate);
        const toDate = new Date(request.toDate);
        
        // Check if the request falls within the selected year
        if (fromDate.getFullYear() === selectedYear || toDate.getFullYear() === selectedYear) {
          const month = fromDate.getMonth();
          if (month >= 0 && month < 12) {
            monthlyData[month] += request.days || 0;
          }
        }
      }
    });
    
    return monthlyData;
  };

  useEffect(() => {
    loadLeaveData();
  }, [userId, loadLeaveData]);

  const currentYearData = calculateMonthlyData();
  const totalUsedInYear = currentYearData.reduce((sum, val) => sum + val, 0);
  const totalAllotted = 22; // Default total
  const totalRemaining = totalAllotted - totalUsedInYear;

  if (loading) return <div>Loading leave data...</div>;

  return (
    <div className="leave-report-container">
      {/* Yearly Summary */}
      <div className="leave-report-section">
        <div className="section-header">
          <h2>Leave Report</h2>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="year-selector">
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Yearly Summary Cards */}
        <div className="yearly-summary">
          <div className="summary-card">
            <div className="summary-label">Total Allotted</div>
            <div className="summary-value">{totalAllotted}</div>
            <div className="summary-unit">days</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Used Leaves</div>
            <div className="summary-value">{totalUsedInYear}</div>
            <div className="summary-unit">days</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Remaining</div>
            <div className="summary-value">{totalRemaining}</div>
            <div className="summary-unit">days</div>
          </div>
        </div>

        {/* Leave Type Breakdown */}
        {leaveData && Object.keys(leaveData).length > 0 && (
          <div className="leave-breakdown">
            <h3>Leave Balance by Type</h3>
            <div className="breakdown-cards">
              {leaveData.casual !== undefined && (
                <div className="breakdown-card">
                  <span className="leave-type">Casual Leaves</span>
                  <strong>{leaveData.casual}</strong>
                </div>
              )}
              {leaveData.sick !== undefined && (
                <div className="breakdown-card">
                  <span className="leave-type">Sick Leaves</span>
                  <strong>{leaveData.sick}</strong>
                </div>
              )}
              {leaveData.paid !== undefined && (
                <div className="breakdown-card">
                  <span className="leave-type">Paid Leaves</span>
                  <strong>{leaveData.paid}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monthly Breakdown Table */}
        <div className="monthly-breakdown">
          <h3>Monthly Leave Usage - {selectedYear}</h3>
          <p className="description">Year-wise leave usage starting from January</p>
          <div className="table-responsive">
            <table className="monthly-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Used Leaves</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => (
                  <tr key={month}>
                    <td>{month}</td>
                    <td>{currentYearData[index]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* My Leave Requests */}
      <div className="leave-report-section">
        <EmployeeRequestTable requests={requests} />
      </div>
    </div>
  );
}
