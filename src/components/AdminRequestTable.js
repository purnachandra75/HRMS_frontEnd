import { formatLeaveType, calculateDaysBetween } from '../utils/leaveUtils';
import '../styles/tailwind.css';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_CLASSES = {
  pending: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  approved: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  rejected: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

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

  return (
    <section className="rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Leave Requests</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage leave requests and approve or reject them.</p>
        </div>
        {showStatusFilter && (
          <div className="flex items-center gap-2">
            <label htmlFor="leave-status-filter" className="text-sm font-medium text-foreground">
              Status
            </label>
            <select
              id="leave-status-filter"
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className="h-9 rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-client focus:ring-2 focus:ring-client/30"
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
        <div className="px-5 py-6 text-center text-sm text-muted-foreground">
          {totalRequests > 0 ? `No ${statusFilter} leave requests found.` : 'No leave requests found.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 640 }}>
            <thead>
              <tr className="border-b border-border/80 bg-muted/40">
                {['ID', 'Employee', 'Type', 'Days', 'Status', 'Action'].map((col) => (
                  <th key={col} className="h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const statusKey = (request.status || '').toLowerCase();
                return (
                  <tr key={request.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{request.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.employeeName || request.firstName} {request.lastName || ''}
                      <div className="text-xs text-muted-foreground">{request.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatLeaveType(request.leaveType)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{getCorrectDays(request)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold capitalize ${
                          STATUS_CLASSES[statusKey] || 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {statusKey === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onStatusChange(request.id, 'Approved')}
                            className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onStatusChange(request.id, 'Rejected')}
                            className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e2]"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
