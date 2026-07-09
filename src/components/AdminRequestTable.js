import { formatLeaveType, calculateDaysBetween } from '../utils/leaveUtils';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminRequestTable({
  requests,
  totalRequests = 0,
  statusFilter = 'all',
  onStatusFilterChange,
  onStatusChange,
}) {
  const getCorrectDays = (request) => {
    // Always calculate working days from dates to ensure consistency
    if (request.fromDate && request.toDate) {
      const calculatedDays = calculateDaysBetween(request.fromDate, request.toDate);
      return calculatedDays > 0 ? calculatedDays : (request.days || 0);
    }
    return request.days || 0;
  };

  const showStatusFilter = typeof onStatusFilterChange === 'function';
  const hasRequests = requests && requests.length > 0;

  console.log('AdminRequestTable - requests:', requests);

  return (
    <section className="section-box">
      <div className="section-header">
        <div>
          <h2>Leave Requests</h2>
          <p>Manage leave requests and approve or reject them.</p>
        </div>
        {showStatusFilter && (
          <div className="leave-filter-control">
            <label htmlFor="leave-status-filter">Status</label>
            <select
              id="leave-status-filter"
              className="filter-select"
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {!hasRequests ? (
        <div className="request-list">
          <p>
            {totalRequests > 0
              ? `No ${statusFilter} leave requests found.`
              : 'No leave requests found.'}
          </p>
        </div>
      ) : (
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
                  {(request.status || '').toLowerCase() === 'pending' ? (
                    <div className="action-buttons">
                      <button className="small-button" onClick={() => onStatusChange(request.id, 'Approved')}>
                        Approve
                      </button>
                      <button className="small-button reject" onClick={() => onStatusChange(request.id, 'Rejected')}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`status-tag ${(request.status || '').toLowerCase()}`}>
                      {request.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}
