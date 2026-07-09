import React, { useState, useEffect } from 'react';
import AdminRequestTable from '../components/AdminRequestTable';
import AdminLeaveReportCard from '../components/AdminLeaveReportCard';
import AdminLayout from '../components/AdminLayout';
import { getLeaveRequests, updateLeaveRequestStatus } from '../services/leaveService';
import '../styles/Dashboard.css';
import '../styles/Leave.css';

const getRequestTimestamp = (request) => {
  const dateFields = [
    request?.createdAt,
    request?.submittedAt,
    request?.requestedAt,
    request?.updatedAt,
  ];

  for (const dateValue of dateFields) {
    if (dateValue) {
      const parsedDate = new Date(dateValue).getTime();
      if (!Number.isNaN(parsedDate)) {
        return parsedDate;
      }
    }
  }

  const numericId = Number(request?.id);
  return Number.isNaN(numericId) ? 0 : numericId;
};

const sortNewestRequestsFirst = (requestList) => {
  return [...requestList].sort((a, b) => {
    const dateDifference = getRequestTimestamp(b) - getRequestTimestamp(a);
    if (dateDifference !== 0) {
      return dateDifference;
    }

    const numericIdA = Number(a?.id);
    const numericIdB = Number(b?.id);
    if (!Number.isNaN(numericIdA) && !Number.isNaN(numericIdB)) {
      return numericIdB - numericIdA;
    }

    return String(b?.id || '').localeCompare(String(a?.id || ''));
  });
};

function LeavePage({ userName, onLogout }) {
  const [activeTab, setActiveTab] = useState('requests'); // requests, monthly-report
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const data = await getLeaveRequests();
      const requestsArray = Array.isArray(data) ? data : [];
      const sortedRequests = sortNewestRequestsFirst(requestsArray);
      setRequests(sortedRequests);
      setError(null);
    } catch (err) {
      console.error('Failed to load leave requests:', err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (statusFilter === 'all') {
      return true;
    }

    return (request.status || '').toLowerCase() === statusFilter;
  });

  const handleStatusChange = async (requestId, status) => {
    try {
      await updateLeaveRequestStatus(requestId, status);
      setRequests((current) => sortNewestRequestsFirst(
        current.map(req => req.id === requestId ? { ...req, status } : req)
      ));
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
            <AdminRequestTable
              requests={filteredRequests}
              totalRequests={requests.length}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onStatusChange={handleStatusChange}
            />
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
