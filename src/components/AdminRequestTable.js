import { formatLeaveType, calculateDaysBetween } from '../utils/leaveUtils';

export default function AdminRequestTable({ requests, onStatusChange }) {
  const getCorrectDays = (request) => {
    // Always calculate working days from dates to ensure consistency
    if (request.fromDate && request.toDate) {
      const calculatedDays = calculateDaysBetween(request.fromDate, request.toDate);
      return calculatedDays > 0 ? calculatedDays : (request.days || 0);
    }
    return request.days || 0;
  };
  console.log('AdminRequestTable - requests:', requests);
  if (!requests || requests.length === 0) {
    return (
      <section className="section-box">
        <div className="section-header">
          <div>
            <h2>Leave Requests</h2>
            <p>Search requests by employee name or ID and approve or reject them.</p>
          </div>
        </div>
        <div className="request-list">
          <p>No leave requests found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-box">
      <div className="section-header">
        <div>
          <h2>Leave Requests</h2>
          <p>Manage leave requests and approve or reject them.</p>
        </div>
      </div>
      <div className="request-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Type</th>
              <th>Days</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>
                  {request.employeeName || request.firstName} {request.lastName || ''}
                  <div className="small-text">{request.employeeId}</div>
                </td>
                <td>{formatLeaveType(request.leaveType)}</td>
                <td>{getCorrectDays(request)}</td>
                <td>{request.status}</td>
                <td>
                  {request.status === 'Pending' ? (
                    <div className="action-buttons">
                      <button className="small-button" onClick={() => onStatusChange(request.id, 'Approved')}>
                        Approve
                      </button>
                      <button className="small-button reject" onClick={() => onStatusChange(request.id, 'Rejected')}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="status-tag">{request.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
