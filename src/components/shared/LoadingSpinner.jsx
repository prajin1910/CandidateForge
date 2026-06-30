import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Processing...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}