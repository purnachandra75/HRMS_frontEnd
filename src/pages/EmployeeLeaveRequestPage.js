import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeLayout from '../components/EmployeeLayout';
import LeaveRequestForm from '../components/LeaveRequestForm';
import EmployeeRequestTable from '../components/EmployeeRequestTable';
import LeaveBalances from '../components/LeaveBalances';
import { 
  getEmployeeLeaveRequests, 
  createLeaveRequest, 
  getLeaveBalances 
} from '../services/leaveService';
import { calculateDaysBetween, getTotalLeaveBalance, normalizeLeaveBalances } from '../utils/leaveUtils';
import { RefreshCw } from 'lucide-react';
import '../styles/tailwind.css';

const getRequestTimestamp = (request) => {
  const createdAt = request?.createdAt;
  if (createdAt) {
    const parsedDate = new Date(createdAt).getTime();
    if (!Number.isNaN(parsedDate)) {
      return parsedDate;
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

function EmployeeLeaveRequestPage({ userName, userId, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, apply-leave
  const [formData, setFormData] = useState({
    type: 'casual',
    fromDate: '',
    toDate: '',
    reason: ''
  });
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEmployeeData = useCallback(async () => {
    setLoading(true);
    let requestsData = [];
    let balancesData = {};
    let loadError = '';

    try {
      requestsData = await getEmployeeLeaveRequests(userId);
    } catch (requestError) {
      console.error('Failed to load leave requests:', requestError);
      loadError = 'Unable to load leave requests. Default leave balances are shown.';
    }

    try {
      balancesData = await getLeaveBalances(userId);
    } catch (balanceError) {
      console.error('Failed to load leave balances:', balanceError);
    }

    const requestsArray = Array.isArray(requestsData) ? requestsData : [];
    const sortedRequests = sortNewestRequestsFirst(requestsArray);

    setRequests(sortedRequests);
    setBalances(normalizeLeaveBalances(balancesData));
    setError(loadError || null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  useEffect(() => {
    // Refresh balances periodically to ensure they stay in sync with approvals
    const balanceRefreshInterval = setInterval(() => {
      if (userId) {
        getLeaveBalances(userId).then((balancesData) => {
          setBalances(normalizeLeaveBalances(balancesData));
        }).catch((err) => {
          console.error('Failed to refresh leave balances:', err);
        });
      }
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(balanceRefreshInterval);
  }, [userId]);

  const handleFormChange = (newFormData) => {
    setFormData(newFormData);
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert('User ID is not available. Please log in again.');
      return;
    }

    if (!formData.type || !formData.fromDate || !formData.toDate || !formData.reason) {
      alert('Please fill in all fields');
      return;
    }

    const days = calculateDaysBetween(formData.fromDate, formData.toDate);
    
    if (days <= 0) {
      alert('Please choose a valid date range with at least one working day. Saturdays and Sundays are not counted.');
      return;
    }
    
    try {
      const requestData = {
        employeeId: userId,
        type: formData.type,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        days,
        reason: formData.reason
      };

      console.log('Submitting leave request:', requestData);
      
      const newRequest = await createLeaveRequest(requestData);
      setRequests((currentRequests) => sortNewestRequestsFirst([newRequest, ...currentRequests]));
      setFormData({
        type: 'casual',
        fromDate: '',
        toDate: '',
        reason: ''
      });
      setActiveTab('dashboard');
      alert('Leave request submitted successfully!');
    } catch (err) {
      console.error('Failed to submit leave request:', err);
      const errorMsg = err.message || 'Failed to submit leave request. Please try again.';
      alert(errorMsg);
    }
  };

  return (
    <EmployeeLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="leaves"
      title="Leave Requests"
      subtitle="Track balances, submit new leave requests, and review your leave history."
    >
      <div className="flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading leave data...</div>
        ) : (
          <>
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Welcome Back 👋</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Manage your leave requests and balances</p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Employee ID</div>
                <div className="text-base font-semibold text-foreground">{userId}</div>
              </div>
            </section>

            <div className="flex flex-wrap gap-2 rounded-xl border border-border/80 bg-card p-3 shadow-sm">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'dashboard' ? 'bg-employee text-employee-foreground' : 'border border-border bg-white text-foreground hover:bg-muted'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('apply-leave')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'apply-leave' ? 'bg-employee text-employee-foreground' : 'border border-border bg-white text-foreground hover:bg-muted'
                }`}
              >
                Apply Leave
              </button>
              <button
                onClick={() => navigate('/employee/leaves/monthly-report')}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Monthly Report
              </button>
              <button
                onClick={() => loadEmployeeData()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
            </div>

            {Object.keys(balances).length > 0 ? (
              <LeaveBalances balances={balances} />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {['Casual Leaves', 'Sick Leaves', 'Paid Leaves'].map((label) => (
                  <div key={label} className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
                    <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">0</div>
                    <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Available Leaves', value: getTotalLeaveBalance(balances) },
                    { label: 'Approved', value: requests.filter((r) => (r.status || '').toLowerCase() === 'approved').length },
                    { label: 'Pending', value: requests.filter((r) => (r.status || '').toLowerCase() === 'pending').length },
                    {
                      label: 'Used Leaves',
                      value: requests
                        .filter((r) => (r.status || '').toLowerCase() === 'approved')
                        .reduce((sum, r) => sum + (r.days || 0), 0),
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
                      <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{item.value}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>

                <EmployeeRequestTable requests={requests} />
              </>
            )}

            {activeTab === 'apply-leave' && (
              <>
                <LeaveRequestForm formData={formData} onChange={handleFormChange} onSubmit={handleSubmit} />
                <EmployeeRequestTable requests={requests} />
              </>
            )}
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default EmployeeLeaveRequestPage;
