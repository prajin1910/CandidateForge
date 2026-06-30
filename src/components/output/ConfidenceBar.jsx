import React from 'react';

export default function ConfidenceBar({ label, value, max = 1 }) {
  const percentage = Math.round((value / max) * 100);
  const tier = getTier(percentage);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/80">{formatLabel(label)}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${tier.badgeClass}`}>{tier.label}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${tier.barClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function formatLabel(label) {
  return label
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function getTier(pct) {
  if (pct >= 80) {
    return {
      label: 'High',
      barClass: 'bg-green-500',
      badgeClass: 'bg-green-500/20 text-green-300',
    };
  }
  if (pct >= 50) {
    return {
      label: 'Medium',
      barClass: 'bg-amber-500',
      badgeClass: 'bg-amber-500/20 text-amber-300',
    };
  }
  return {
    label: 'Low',
    barClass: 'bg-red-500',
    badgeClass: 'bg-red-500/20 text-red-300',
  };
}