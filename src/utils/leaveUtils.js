import { leaveTypes } from '../config/leaveConfig';

export const DEFAULT_LEAVE_BALANCES = {
  casual: 8,
  sick: 9,
  paid: 5,
};

export function formatLeaveType(type) {
  return leaveTypes[type] || type;
}

export function normalizeLeaveBalances(balances, fallbackBalances = DEFAULT_LEAVE_BALANCES) {
  const normalizedBalances = {};

  if (Array.isArray(balances)) {
    balances.forEach((item) => {
      if (item?.leaveType && item.balance !== undefined) {
        normalizedBalances[item.leaveType] = Number(item.balance) || 0;
      }
    });
  } else if (typeof balances === 'object' && balances !== null) {
    if (balances.leaveType && balances.balance !== undefined) {
      normalizedBalances[balances.leaveType] = Number(balances.balance) || 0;
    } else {
      Object.entries(balances).forEach(([key, value]) => {
        if (leaveTypes[key] !== undefined) {
          normalizedBalances[key] = Number(value) || 0;
        }
      });
    }
  }

  return Object.keys(normalizedBalances).length > 0
    ? { ...fallbackBalances, ...normalizedBalances }
    : { ...fallbackBalances };
}

export function getTotalLeaveBalance(balances) {
  const normalizedBalances = normalizeLeaveBalances(balances);
  return Object.values(normalizedBalances).reduce((total, value) => total + (Number(value) || 0), 0);
}

export function calculateDaysBetween(fromDate, toDate) {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return 0;
  }

  let workingDays = 0;
  const current = new Date(from);

  while (current <= to) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      workingDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}
