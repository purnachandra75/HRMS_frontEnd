import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Star } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { getClientPerformanceReports } from '../services/performanceReportService';
import '../styles/tailwind.css';

const PAGE_SIZE = 15;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function AdminPerformanceReportsPage({ userName, onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthFilter, setMonthFilter] = useState('all');
  const [employeeNameDraft, setEmployeeNameDraft] = useState('');
  const employeeNameFilter = useDebouncedValue(employeeNameDraft, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClientPerformanceReports({
        page: currentPage - 1,
        size: PAGE_SIZE,
        month: monthFilter,
        employeeName: employeeNameFilter,
      });
      setReports(Array.isArray(data.content) ? data.content : []);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setTotalItems(data.totalElements ?? 0);
      setError(null);
    } catch (err) {
      console.error('Failed to load performance reports:', err);
      setError('Failed to load performance reports');
    } finally {
      setLoading(false);
    }
  }, [currentPage, monthFilter, employeeNameFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Reset to page 1 whenever a filter changes so the fetch effect above doesn't request a
  // now out-of-range page for the new filter.
  useEffect(() => {
    setCurrentPage(1);
  }, [monthFilter, employeeNameFilter]);

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="performance-reports"
      title="Performance Reports"
      subtitle="Read-only view of performance reports submitted by your Project Managers."
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
        )}

        <section className="rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Employee Performance Reports</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Monthly ratings submitted by Project Managers.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="performance-month-filter" className="text-sm font-medium text-foreground">
                Month
              </label>
              <select
                id="performance-month-filter"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              >
                <option value="all">All Months</option>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>
              <label htmlFor="performance-employee-filter" className="text-sm font-medium text-foreground">
                Employee
              </label>
              <input
                id="performance-employee-filter"
                type="text"
                value={employeeNameDraft}
                onChange={(e) => setEmployeeNameDraft(e.target.value)}
                placeholder="Search by name"
                className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
              />
              <button
                onClick={loadReports}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">Loading performance reports...</div>
          ) : reports.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-muted-foreground">No performance reports found.</div>
          ) : (
            <>
            <ul className="divide-y divide-border/60">
              {reports.map((report) => (
                <li key={report.id} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{report.employeeName}</h3>
                      <div className="text-xs text-muted-foreground">
                        Rated by {report.managerName} &middot; {MONTH_NAMES[report.month - 1]} {report.year}
                      </div>
                    </div>
                    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-[#fde68a] bg-[#fffbeb] px-2.5 text-[11px] font-semibold text-[#b45309]">
                      <Star className="size-3" />
                      {report.rating} / 5
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.comments || 'No comments provided.'}</p>
                  <div className="text-xs text-muted-foreground">
                    Submitted {report.submittedAt} &middot; Last updated {report.updatedAt}
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default AdminPerformanceReportsPage;
