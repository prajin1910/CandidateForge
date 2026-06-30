import React, { useState } from 'react';
import { Download, Copy, Check, RotateCcw, FileJson } from 'lucide-react';
import JsonViewer from './JsonViewer';
import ConfidenceBar from './ConfidenceBar';
import SourceBadge from './SourceBadge';
import SummaryCard from './SummaryCard';
import ConfidenceExplanation from './ConfidenceExplanation';
import ErrorDisplay from '@/components/shared/ErrorDisplay';

export default function OutputPanel({ result, error, status, onRestart }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // summary | profile | provenance

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center space-y-4">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Running transformation pipeline...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <ErrorDisplay error={error} />
        {result?.extractionWarnings && result.extractionWarnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-amber-300 mb-1">Extraction Warnings</p>
            {result.extractionWarnings.map((w, idx) => (
              <p key={idx} className="text-xs text-muted-foreground">
                {w.source}: {w.error}
              </p>
            ))}
          </div>
        )}
        <button
          onClick={onRestart}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Start Over
        </button>
      </div>
    );
  }

  if (!result) return null;

  const { output } = result;
  const provenanceMap = output?.provenance || output?.provenanceMap || {};
  const fieldConfidence = output?.fieldConfidence || {};
  const sources = output?.sources || [];
  const overallConfidence = output?.confidence ?? output?.overallConfidence ?? 0;
  const candidateId = output?.candidate_id || output?.candidateId || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidate_${candidateId.slice(0, 8) || 'output'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasProvenance = provenanceMap && Object.keys(provenanceMap).length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileJson className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Validated Canonical Profile</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {candidateId ? candidateId.slice(0, 8) : '—'} · Overall confidence: {(overallConfidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Start Over
          </button>
        </div>
      </div>

      {/* Source Badges */}
      {sources.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Sources:</span>
          {sources.map((src, idx) => (
            <SourceBadge key={idx} source={src.sourceType} isStub={src.isStub} />
          ))}
        </div>
      )}

      {/* Overall Confidence Explanation */}
      <ConfidenceExplanation overallConfidence={overallConfidence} fieldConfidence={fieldConfidence} />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { id: 'summary', label: 'Summary' },
          { id: 'profile', label: 'Profile JSON' },
          ...(hasProvenance ? [{ id: 'provenance', label: 'Provenance' }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <SummaryCard output={output} sources={sources} fieldConfidence={fieldConfidence} />

          {/* Field Confidence Bars */}
          {Object.keys(fieldConfidence).length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <h3 className="text-sm font-semibold text-foreground mb-1">Field-Level Confidence</h3>
              {Object.entries(fieldConfidence)
                .sort((a, b) => b[1] - a[1])
                .map(([field, confidence]) => (
                  <ConfidenceBar key={field} label={field} value={confidence} />
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="rounded-xl border border-border bg-card p-4 max-h-[600px] overflow-auto scrollbar-thin">
          <JsonViewer data={output} provenanceMap={provenanceMap} />
        </div>
      )}

      {activeTab === 'provenance' && hasProvenance && (
        <div className="rounded-xl border border-border bg-card p-4 max-h-[600px] overflow-auto scrollbar-thin">
          <JsonViewer data={provenanceMap} />
        </div>
      )}

      {/* Extraction Warnings */}
      {result.extractionWarnings && result.extractionWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs font-medium text-amber-300 mb-1">Extraction Warnings</p>
          {result.extractionWarnings.map((w, idx) => (
            <p key={idx} className="text-xs text-muted-foreground">
              {w.source}: {w.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}