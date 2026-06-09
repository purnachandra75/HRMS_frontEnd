import { formatLeaveType } from '../utils/leaveUtils';

export default function EmployeeRequestTable({ requests }) {
  if (!requests || requests.length === 0) {
    return (
      <section className="section-box">
        <div className="section-header">
          <div>
            <h2>My Leave Requests</h2>
            <p>Track request status and request details.</p>
          </div>
        </div>
        <div className="request-list">
          <p>You have not submitted any leave requests yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-box">
      <div className="section-header">
        <div>
          <h2>My Leave Requests</h2>
          <p>Track request status and request details.</p>
        </div>
      </div>
      <div className="request-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>From Date</th>
              <th>To Date</th>
              <th>Days</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>{formatLeaveType(request.leaveType || request.type)}</td>
                <td>{request.fromDate ? new Date(request.fromDate).toLocaleDateString() : 'N/A'}</td>
                <td>{request.toDate ? new Date(request.toDate).toLocaleDateString() : 'N/A'}</td>
                <td>{request.days}</td>
                <td>{request.status}</td>
                <td>{request.createdAt || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
