import React from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function ErrorDisplay({ error }) {
  const [expanded, setExpanded] = useState(false);

  if (!error) return null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">{error.message}</p>
          {error.name && (
            <p className="text-xs text-muted-foreground mt-1">Error type: {error.name}</p>
          )}
          {error.details && Array.isArray(error.details) && error.details.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {error.details.length} validation error(s)
              </button>
              {expanded && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-auto scrollbar-thin">
                  {error.details.map((err, idx) => (
                    <div key={idx} className="rounded-lg bg-background/50 border border-border p-2">
                      <p className="text-xs font-mono text-destructive">
                        {err.field || 'root'}: {err.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}