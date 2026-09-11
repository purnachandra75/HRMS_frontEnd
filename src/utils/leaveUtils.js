import { leaveTypes } from '../config/leaveConfig';

// Leave type keys the backend seeds a balance for (see LeavePolicySettingsService.LEAVE_TYPES
// on the backend) - used only to recognize/normalize keys, never to fabricate a balance number.
// Actual allocation counts always come from the API (per-org, admin-configured), not from here.
export const LEAVE_TYPE_KEYS = ['casual', 'sick', 'paid'];

export const normalizeLeaveTypeKey = (leaveType) => {
  if (!leaveType) return null;
  const normalized = String(leaveType).trim().toLowerCase();
  return LEAVE_TYPE_KEYS.find((key) => key === normalized) || null;
};

export function formatLeaveType(type) {
  return leaveTypes[type] || type;
}

export function normalizeLeaveBalances(balances, fallbackBalances = {}) {
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

  return { ...fallbackBalances, ...normalizedBalances };
}

export function getTotalLeaveBalance(balances) {
  const normalizedBalances = normalizeLeaveBalances(balances);
  return Object.values(normalizedBalances).reduce((total, value) => total + (Number(value) || 0), 0);
}

// Returns working-day counts keyed by `${year}-${monthIndex}`, so a leave
// range spanning multiple months is attributed to each month it actually covers.
export function getWorkingDaysByMonth(fromDate, toDate) {
  const result = {};
  if (!fromDate || !toDate) return result;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return result;
  }

  const current = new Date(from);
  while (current <= to) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      const key = `${current.getFullYear()}-${current.getMonth()}`;
      result[key] = (result[key] || 0) + 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
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
