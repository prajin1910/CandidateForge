import React from 'react';
import FileDropzone from '@/components/shared/FileDropzone';
import { FileSpreadsheet, FileJson } from 'lucide-react';

export default function Step1Structured({ data, update }) {
  const preview = data.fileContent
    ? data.fileContent.slice(0, 500) + (data.fileContent.length > 500 ? '...' : '')
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Upload Structured Source</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV or JSON file containing candidate data. This will be your highest-priority source.
        </p>
      </div>

      <FileDropzone
        label="CSV or JSON File"
        accept=".csv,.json"
        icon={data.fileName?.endsWith('.json') ? FileJson : FileSpreadsheet}
        onFileSelected={(result) => {
          if (result) {
            update({ fileContent: result.content, fileName: result.name });
          } else {
            update({ fileContent: null, fileName: null });
          }
        }}
        fileName={data.fileName}
        fileContent={data.fileContent}
        preview={preview}
      />

      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Expected Fields</h3>
        <div className="flex flex-wrap gap-2">
          {['name', 'email', 'phone', 'skills', 'github_url', 'location', 'headline'].map(field => (
            <span key={field} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-mono text-primary">
              {field}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Fields not listed above will still be processed and passed through the pipeline.
        </p>
      </div>
    </div>
  );
}