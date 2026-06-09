import { formatLeaveType } from '../utils/leaveUtils';

export default function LeaveBalances({ balances }) {
  // Handle if balances is an array with objects like {id, empId, leaveType, balance}
  let balanceData = {};
  
  if (Array.isArray(balances)) {
    balances.forEach(item => {
      if (item.leaveType && item.balance !== undefined) {
        balanceData[item.leaveType] = item.balance;
      }
    });
  } else if (typeof balances === 'object' && balances !== null) {
    // Check if it's already in the expected format {casual: 8, sick: 9, paid: 5}
    if (balances.casual !== undefined || balances.sick !== undefined || balances.paid !== undefined) {
      balanceData = balances;
    } else if (balances.leaveType && balances.balance !== undefined) {
      // Handle single object format
      balanceData[balances.leaveType] = balances.balance;
    }
  }

  if (!balanceData || Object.keys(balanceData).length === 0) {
    return (
      <div className="cards-row">
        <div className="info-card">
          <span>No leave balance data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cards-row">
      {Object.entries(balanceData).map(([key, value]) => (
        <div key={key} className="info-card">
          <span>{formatLeaveType(key)} Leaves</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
