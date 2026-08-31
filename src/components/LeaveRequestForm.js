import { leaveTypes } from '../config/leaveConfig';
import { calculateDaysBetween } from '../utils/leaveUtils';
import '../styles/tailwind.css';

export default function LeaveRequestForm({ formData, onChange, onSubmit, onBack }) {
  const requestDays = calculateDaysBetween(formData.fromDate, formData.toDate);

  return (
    <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Apply Leave Request</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Select leave type, choose dates, and add a reason.</p>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="leaveType" className="text-sm font-medium text-foreground">Leave Type</label>
          <select
            id="leaveType"
            value={formData.type || ''}
            onChange={(event) => onChange({ ...formData, type: event.target.value })}
            className="h-9 w-full max-w-xs rounded-lg border border-border bg-white px-2.5 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
          >
            <option value="">Select leave type</option>
            {Object.entries(leaveTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fromDate" className="text-sm font-medium text-foreground">From</label>
            <input
              id="fromDate"
              type="date"
              value={formData.fromDate || ''}
              onChange={(event) => onChange({ ...formData, fromDate: event.target.value })}
              placeholder="dd-mm-yyyy"
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="toDate" className="text-sm font-medium text-foreground">To</label>
            <input
              id="toDate"
              type="date"
              value={formData.toDate || ''}
              onChange={(event) => onChange({ ...formData, toDate: event.target.value })}
              placeholder="dd-mm-yyyy"
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Days</label>
          <input
            type="text"
            value={requestDays || ''}
            readOnly
            placeholder="Calculated from dates"
            className="h-9 w-32 rounded-lg border border-border bg-muted/40 px-3 text-sm text-foreground outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="leaveReason" className="text-sm font-medium text-foreground">Reason</label>
          <textarea
            id="leaveReason"
            rows={3}
            value={formData.reason || ''}
            onChange={(event) => onChange({ ...formData, reason: event.target.value })}
            placeholder="Describe why you need this leave"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-employee focus:ring-2 focus:ring-employee/30"
          />
        </div>
        <button
          onClick={onSubmit}
          className="h-9 w-fit rounded-lg bg-employee px-4 text-sm font-medium text-employee-foreground hover:bg-employee/90"
        >
          Send Leave Request
        </button>
      </div>
    </section>
  );
}
