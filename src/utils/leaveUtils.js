import { leaveTypes } from '../config/leaveConfig';

export function formatLeaveType(type) {
  console.log('formatLeaveType - type:', type);
  return leaveTypes[type] || type;
}

export function calculateDaysBetween(fromDate, toDate) {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}
