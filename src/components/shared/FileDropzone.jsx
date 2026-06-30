import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

/**
 * FileDropzone — drag-and-drop file upload component.
 * Accepts specified file types and reads file content.
 */
export default function FileDropzone({
  label = 'Upload File',
  accept = '.csv,.json',
  icon: Icon = UploadCloud,
  onFileSelected,
  fileName,
  fileContent,
  preview,
  compact = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    const text = await file.text();
    onFileSelected?.({ file, name: file.name, content: text });
  }, [onFileSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClear = () => {
    onFileSelected?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={compact ? '' : 'space-y-2'}>
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      {!fileName ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 transition-all duration-200 ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Drop file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-0.5">Accepts {accept}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                {fileContent && (
                  <p className="text-xs text-muted-foreground">{fileContent.length} chars</p>
                )}
              </div>
            </div>
            <button
              onClick={handleClear}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {preview && (
            <div className="rounded-lg bg-background/50 border border-border p-3 max-h-32 overflow-auto scrollbar-thin">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{preview}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}