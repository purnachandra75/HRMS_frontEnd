import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

function LeavePage({ userName, onLogout }) {
  const navigate = useNavigate();

  const leaveSummary = [
    { title: 'Total Balance', value: '18 days' },
    { title: 'Pending Requests', value: '2' },
    { title: 'Approved', value: '6' },
    { title: 'Rejected', value: '1' },
  ];

  const leaveRequests = [
    { id: 101, employee: 'Alice Johnson', type: 'Vacation', period: 'Jun 12 - Jun 14', status: 'Pending' },
    { id: 102, employee: 'Mark Lee', type: 'Sick Leave', period: 'Jun 02 - Jun 04', status: 'Approved' },
    { id: 103, employee: 'Sara Reddy', type: 'Work from Home', period: 'Jun 05 - Jun 05', status: 'Approved' },
    { id: 104, employee: 'John Doe', type: 'Personal', period: 'Jun 18 - Jun 19', status: 'Rejected' },
  ];

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Leave Management</h1>
          <p className="dashboard-subtitle">Review leave balances, recent requests, and approval status.</p>
        </div>

        <div className="header-info">
          <span>Welcome, {userName}!</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-cards leave-summary-grid">
          {leaveSummary.map((item) => (
            <div key={item.title} className="dashboard-card">
              <h3>{item.title}</h3>
              <p>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="employees-section">
          <div className="employees-header">
            <h2>Recent Leave Requests</h2>
            <button className="create-btn" type="button" onClick={() => alert('Add leave request flow not implemented yet')}>
              Request Leave
            </button>
          </div>

          <div className="table-responsive">
            <table className="employees-table leave-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.employee}</td>
                    <td>{request.type}</td>
                    <td>{request.period}</td>
                    <td>{request.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LeavePage;
