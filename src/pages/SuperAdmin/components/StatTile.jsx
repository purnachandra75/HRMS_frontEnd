import React from 'react';

const TONE_BAR = {
  default: 'from-primary/60 to-primary/15',
  good: 'from-emerald-500/70 to-emerald-500/15',
  bad: 'from-red-500/70 to-red-500/15',
  warn: 'from-amber-500/70 to-amber-500/15',
};

export default function StatTile({ label, value, tone = 'default' }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${TONE_BAR[tone] || TONE_BAR.default}`} />
      <div className="px-4 py-3.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
        <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</div>
      </div>
    </div>
  );
}
