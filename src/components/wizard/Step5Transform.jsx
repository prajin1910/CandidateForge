import React from 'react';
import { Settings, Zap, AlertTriangle } from 'lucide-react';

export default function Step5Transform({ data, onTransform, status, pipelineLog }) {
  const { fileName, sourceType, sourceUrl, pdfFile, pdfFileName, githubToken, config } = data;

  const summaryItems = [
    { label: 'Structured File', value: fileName || 'Not uploaded', status: !!fileName },
    { label: 'Unstructured Source', value: sourceType === 'pdf' ? 'Resume PDF' : sourceType === 'github' ? 'GitHub' : 'LinkedIn', status: !!sourceType },
    { label: 'Source URL / File', value: sourceType === 'pdf' ? (pdfFileName || 'Not uploaded') : (sourceUrl || 'Not provided'), status: sourceType === 'pdf' ? !!pdfFileName : !!sourceUrl },
    { label: 'GitHub Token', value: githubToken ? 'Provided' : 'Not provided (optional)', status: true },
    { label: 'Source Priority', value: config.sourcePriority.join(' → '), status: true },
    { label: 'Projection Fields', value: `${config.projection.fields.length} field(s) mapped`, status: true },
    { label: 'Missing Value Strategy', value: config.missingValueStrategy, status: true },
  ];

  const canTransform = fileName && (
    (sourceType === 'github' && sourceUrl) ||
    (sourceType === 'linkedin' && sourceUrl) ||
    (sourceType === 'pdf' && pdfFile)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Transform Candidate</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your inputs and run the transformation pipeline.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Configuration Summary</h3>
        </div>
        <div className="space-y-2">
          {summaryItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
              <span className="text-xs text-muted-foreground flex-shrink-0">{item.label}</span>
              <span className={`text-xs font-medium text-right ${item.status ? 'text-foreground' : 'text-destructive'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Progress */}
      {status === 'loading' && pipelineLog.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 max-h-64 overflow-auto scrollbar-thin">
          <h3 className="text-sm font-semibold text-foreground mb-2">Pipeline Progress</h3>
          {pipelineLog.map((entry, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                entry.level === 'error' ? 'bg-destructive' :
                entry.level === 'warning' ? 'bg-amber-500' :
                'bg-primary'
              }`} />
              <div className="flex-1">
                <span className="font-mono text-primary">{entry.stage}</span>
                <span className="text-muted-foreground ml-2">{entry.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning */}
      {!canTransform && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">
            Please go back and complete all required inputs before transforming.
          </p>
        </div>
      )}

      {/* Transform Button */}
      <button
        onClick={onTransform}
        disabled={!canTransform || status === 'loading'}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Zap className="h-5 w-5" />
        {status === 'loading' ? 'Transforming...' : 'Confirm & Transform'}
      </button>
    </div>
  );
}