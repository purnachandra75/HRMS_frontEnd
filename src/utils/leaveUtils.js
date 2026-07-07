import { leaveTypes } from '../config/leaveConfig';

export const DEFAULT_LEAVE_BALANCES = {
  casual: 18,
  sick: 6,
  paid: 12,
};

const normalizeLeaveTypeKey = (leaveType) => {
  if (!leaveType) return null;
  const normalized = String(leaveType).trim().toLowerCase();
  if (DEFAULT_LEAVE_BALANCES[normalized] !== undefined) {
    return normalized;
  }
  return Object.keys(DEFAULT_LEAVE_BALANCES).find(
    (key) => key.toLowerCase() === normalized
  ) || null;
};

export function formatLeaveType(type) {
  return leaveTypes[type] || type;
}

export function normalizeLeaveBalances(balances, fallbackBalances = DEFAULT_LEAVE_BALANCES) {
  const normalizedBalances = {};

  if (Array.isArray(balances)) {
    balances.forEach((item) => {
      const normalizedKey = normalizeLeaveTypeKey(item?.leaveType);
      if (normalizedKey && item.balance !== undefined) {
        normalizedBalances[normalizedKey] = Number(item.balance) || 0;
      }
    });
  } else if (typeof balances === 'object' && balances !== null) {
    if (balances.leaveType && balances.balance !== undefined) {
      const normalizedKey = normalizeLeaveTypeKey(balances.leaveType);
      if (normalizedKey) {
        normalizedBalances[normalizedKey] = Number(balances.balance) || 0;
      }
    } else {
      Object.entries(balances).forEach(([key, value]) => {
        const normalizedKey = normalizeLeaveTypeKey(key);
        if (normalizedKey) {
          normalizedBalances[normalizedKey] = Number(value) || 0;
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
