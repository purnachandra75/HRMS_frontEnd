import React from 'react';

const TONE_CLASSES = {
  success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]',
  danger: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
  warning: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]',
  neutral: 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]',
};

const DOT_CLASSES = {
  success: 'bg-[#16a34a]',
  danger: 'bg-[#ef4444]',
  warning: 'bg-[#f59e0b]',
  neutral: 'bg-[#94a3b8]',
};

function toneAndLabel(status) {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'ACTIVE') return { tone: 'success', label: 'Active' };
  if (normalized === 'DISABLED' || normalized === 'INACTIVE') return { tone: 'danger', label: 'Disabled' };
  if (normalized === 'PENDING' || normalized === 'PENDING_APPROVAL') return { tone: 'warning', label: 'Pending' };
  return { tone: 'neutral', label: status || 'Unknown' };
}

export default function StatusBadge({ status }) {
  const { tone, label } = toneAndLabel(status);
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold tracking-wide ${TONE_CLASSES[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${DOT_CLASSES[tone]}`} />
      {label}
    </span>
  );
}
