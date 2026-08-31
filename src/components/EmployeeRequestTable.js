import { formatLeaveType, calculateDaysBetween } from '../utils/leaveUtils';
import { formatDateDDMMYYYY } from '../utils/dateFormat';
import '../styles/tailwind.css';

const STATUS_CLASSES = {
  pending: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  approved: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  rejected: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

export default function EmployeeRequestTable({ requests }) {
  const getCorrectDays = (request) => {
    // Always calculate working days from dates to ensure consistency
    if (request.fromDate && request.toDate) {
      const calculatedDays = calculateDaysBetween(request.fromDate, request.toDate);
      return calculatedDays > 0 ? calculatedDays : (request.days || 0);
    }
    return request.days || 0;
  };

  const hasRequests = requests && requests.length > 0;

  return (
    <section className="rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/80 px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">My Leave Requests</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Track request status and request details.</p>
      </div>
      {!hasRequests ? (
        <div className="px-5 py-6 text-sm text-muted-foreground">You have not submitted any leave requests yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 640 }}>
            <thead>
              <tr className="border-b border-border/80 bg-muted/40">
                {['ID', 'Type', 'From Date', 'To Date', 'Days', 'Status', 'Submitted'].map((col) => (
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
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatLeaveType(request.leaveType || request.type)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateDDMMYYYY(request.fromDate)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateDDMMYYYY(request.toDate)}</td>
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
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateDDMMYYYY(request.createdAt)}</td>
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
