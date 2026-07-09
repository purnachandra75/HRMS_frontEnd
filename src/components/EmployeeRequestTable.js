import { formatLeaveType, calculateDaysBetween } from '../utils/leaveUtils';
import { formatDateDDMMYYYY } from '../utils/dateFormat';

export default function EmployeeRequestTable({ requests }) {
  const getCorrectDays = (request) => {
    // Always calculate working days from dates to ensure consistency
    if (request.fromDate && request.toDate) {
      const calculatedDays = calculateDaysBetween(request.fromDate, request.toDate);
      return calculatedDays > 0 ? calculatedDays : (request.days || 0);
    }
    return request.days || 0;
  };
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
                <td>{formatDateDDMMYYYY(request.fromDate)}</td>
                <td>{formatDateDDMMYYYY(request.toDate)}</td>
                <td>{getCorrectDays(request)}</td>
                <td>{request.status}</td>
                <td>{formatDateDDMMYYYY(request.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
