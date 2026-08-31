import React, { useState, useEffect, useCallback } from 'react';
import EmployeeRequestTable from './EmployeeRequestTable';
import { getEmployeeLeaveRequests, getLeaveBalances } from '../services/leaveService';
import { normalizeLeaveBalances, getWorkingDaysByMonth } from '../utils/leaveUtils';
import '../styles/tailwind.css';

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
      if ((request.status || '').toLowerCase() === 'approved') {
        const daysByMonth = getWorkingDaysByMonth(request.fromDate, request.toDate);
        Object.entries(daysByMonth).forEach(([key, days]) => {
          const [year, month] = key.split('-').map(Number);
          if (year === selectedYear) {
            monthlyData[month] += days;
          }
        });
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

  if (loading) return <div className="text-sm text-muted-foreground">Loading leave data...</div>;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Leave Report</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: 'Total Allotted', value: totalAllotted },
            { label: 'Used Leaves', value: totalUsedInYear },
            { label: 'Remaining', value: totalRemaining },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border/80 bg-background p-4 text-center">
              <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.label} · days</div>
            </div>
          ))}
        </div>

        {leaveData && Object.keys(leaveData).length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-foreground">Leave Balance by Type</h3>
            <div className="mt-2 grid grid-cols-3 gap-4">
              {leaveData.casual !== undefined && (
                <div className="rounded-xl border border-border/80 bg-background p-4 text-center">
                  <div className="text-xl font-semibold tabular-nums text-foreground">{leaveData.casual}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Casual Leaves</div>
                </div>
              )}
              {leaveData.sick !== undefined && (
                <div className="rounded-xl border border-border/80 bg-background p-4 text-center">
                  <div className="text-xl font-semibold tabular-nums text-foreground">{leaveData.sick}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Sick Leaves</div>
                </div>
              )}
              {leaveData.paid !== undefined && (
                <div className="rounded-xl border border-border/80 bg-background p-4 text-center">
                  <div className="text-xl font-semibold tabular-nums text-foreground">{leaveData.paid}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Paid Leaves</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground">Monthly Leave Usage - {selectedYear}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Year-wise leave usage starting from January</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border/80">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Month</th>
                  <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Used Leaves</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => (
                  <tr key={month} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 text-sm text-foreground">{month}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{currentYearData[index]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EmployeeRequestTable requests={requests} />
    </div>
  );
}
