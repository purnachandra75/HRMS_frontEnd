import React, { useState, useEffect } from 'react';
import AdminRequestTable from '../components/AdminRequestTable';
import AdminLeaveReportCard from '../components/AdminLeaveReportCard';
import AdminLayout from '../components/AdminLayout';
import { getLeaveRequestsPage, updateLeaveRequestStatus } from '../services/leaveService';
import '../styles/tailwind.css';

const ROWS_PER_PAGE = 10;

function LeavePage({ userName, onLogout }) {
  const [activeTab, setActiveTab] = useState('requests'); // requests, monthly-report
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLeaveRequests(currentPage, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  const loadLeaveRequests = async (page, status) => {
    setLoading(true);
    try {
      const { requests: data, total, totalPages: pages } = await getLeaveRequestsPage({
        page,
        size: ROWS_PER_PAGE,
        status,
      });
      setRequests(Array.isArray(data) ? data : []);
      setTotalRequests(total ?? 0);
      setTotalPages(Math.max(1, pages ?? 1));
      setError(null);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      await updateLeaveRequestStatus(requestId, status);
      await loadLeaveRequests(currentPage, statusFilter);
    } catch (err) {
      console.error('Failed to update leave request:', err);
      alert('Failed to update leave request');
    }
  };

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="leaves"
      title={activeTab === 'requests' ? 'Leave Requests' : 'Monthly Leave Report'}
      subtitle={activeTab === 'requests' ? 'Review employee leave requests and update their approval status.' : 'View monthly leave usage and reporting details for employees.'}
    >
      <div className="flex flex-col gap-5">
        <div className="inline-flex w-fit gap-1 rounded-lg border border-border/80 bg-card p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('requests')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'requests' ? 'bg-client text-client-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('monthly-report')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'monthly-report' ? 'bg-client text-client-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly Report
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading leave data...</div>
        ) : (
          <>
            {activeTab === 'requests' && (
              <>
                <AdminRequestTable
                  requests={requests}
                  totalRequests={totalRequests}
                  statusFilter={statusFilter}
                  onStatusFilterChange={handleStatusFilterChange}
                  onStatusChange={handleStatusChange}
                />
                {totalRequests > 0 && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-8 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 rounded-lg border border-border bg-white px-3 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
            {activeTab === 'monthly-report' && <AdminLeaveReportCard />}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default LeavePage;
