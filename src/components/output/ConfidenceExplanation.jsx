import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

/**
 * Renders the overall confidence score with a clear textual explanation
 * of what the score means and how it was derived.
 */
export default function ConfidenceExplanation({ overallConfidence, fieldConfidence }) {
  const pct = Math.round(overallConfidence * 100);
  const tier = getTier(pct);

  const highFields = Object.values(fieldConfidence).filter(v => v >= 0.8).length;
  const totalFields = Object.keys(fieldConfidence).length;
  const lowFields = Object.values(fieldConfidence).filter(v => v < 0.5).length;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${tier.containerClass}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${tier.iconBg}`}>
          <tier.icon className={`h-5 w-5 ${tier.iconClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground">Overall Confidence: {pct}%</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tier.badgeClass}`}>
              {tier.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {tier.explanation}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
        <Stat label="High-confidence fields" value={highFields} total={totalFields} accent="text-green-400" />
        <Stat label="Medium-confidence fields" value={totalFields - highFields - lowFields} total={totalFields} accent="text-amber-400" />
        <Stat label="Low-confidence fields" value={lowFields} total={totalFields} accent="text-red-400" />
      </div>

      <div className="flex items-start gap-2 pt-1">
        <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Confidence is calculated from source reliability, cross-source agreement, normalization success,
          and data completeness. Fields from higher-priority sources or confirmed by multiple sources score higher.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, total, accent }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold font-mono ${accent}`}>{value}<span className="text-xs text-muted-foreground font-normal">/{total}</span></p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function getTier(pct) {
  if (pct >= 80) {
    return {
      label: 'High',
      icon: CheckCircle2,
      explanation: 'This profile has strong, well-corroborated data across multiple sources. Most fields are reliably populated and normalized.',
      containerClass: 'border-green-500/20 bg-green-500/5',
      iconBg: 'bg-green-500/15',
      iconClass: 'text-green-400',
      badgeClass: 'bg-green-500/20 text-green-300',
    };
  }
  if (pct >= 50) {
    return {
      label: 'Medium',
      icon: AlertCircle,
      explanation: 'This profile has reasonable data but some fields may rely on a single source or have normalization gaps. Review lower-confidence fields before relying on them.',
      containerClass: 'border-amber-500/20 bg-amber-500/5',
      iconBg: 'bg-amber-500/15',
      iconClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-300',
    };
  }
  return {
    label: 'Low',
    icon: AlertCircle,
    explanation: 'This profile has limited or low-confidence data. Many fields are missing, unverified, or derived from a single low-reliability source. Manual verification is strongly recommended.',
    containerClass: 'border-red-500/20 bg-red-500/5',
    iconBg: 'bg-red-500/15',
    iconClass: 'text-red-400',
    badgeClass: 'bg-red-500/20 text-red-300',
  };
}