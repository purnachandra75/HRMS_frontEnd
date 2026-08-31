import { formatLeaveType, normalizeLeaveBalances } from '../utils/leaveUtils';
import '../styles/tailwind.css';

export default function LeaveBalances({ balances }) {
  const balanceData = normalizeLeaveBalances(balances);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {Object.entries(balanceData).map(([key, value]) => (
        <div key={key} className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm">
          <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{formatLeaveType(key)} Leaves</div>
        </div>
      ))}
    </div>
  );
}
