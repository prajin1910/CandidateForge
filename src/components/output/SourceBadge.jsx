import React from 'react';

const SOURCE_STYLES = {
  structured: { label: 'Structured', className: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  github: { label: 'GitHub', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  resume: { label: 'Resume', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  linkedin: { label: 'LinkedIn', className: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  stub: { label: 'Stub', className: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
};

export default function SourceBadge({ source, isStub }) {
  const style = isStub
    ? SOURCE_STYLES.stub
    : SOURCE_STYLES[source] || { label: source, className: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}