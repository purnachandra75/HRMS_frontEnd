import { formatLeaveType, normalizeLeaveBalances } from '../utils/leaveUtils';

export default function LeaveBalances({ balances }) {
  const balanceData = normalizeLeaveBalances(balances);

  return (
    <section className="section-box">
      <div className="cards-row">
        {Object.entries(balanceData).map(([key, value]) => (
          <div key={key} className="info-card">
            <span>{formatLeaveType(key)} Leaves</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
