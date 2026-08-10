import React, { useState, useEffect } from 'react';
import AdminRequestTable from '../components/AdminRequestTable';
import AdminLeaveReportCard from '../components/AdminLeaveReportCard';
import AdminLayout from '../components/AdminLayout';
import { getLeaveRequestsPage, updateLeaveRequestStatus } from '../services/leaveService';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

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
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Leave Requests
        </button>
        <button
          className={`tab-btn ${activeTab === 'monthly-report' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly-report')}
        >
          Monthly Report
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading leave data...</div>
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
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
          {activeTab === 'monthly-report' && (
            <AdminLeaveReportCard />
          )}
        </>
      )}
    </AdminLayout>
  );
}

export default LeavePage;
