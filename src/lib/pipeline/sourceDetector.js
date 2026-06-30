/**
 * Source Detector
 *
 * Inspects uploaded files and input fields to classify each source.
 * Validates that at least one source is present.
 * Issues warnings (but does not throw) when only structured or only unstructured sources are found.
 */
export function detectSources(inputs) {
  const { structuredFile, structuredFileName, sourceType, sourceUrl, pdfFile } = inputs;
  const detected = [];

  // Detect structured source
  if (structuredFile) {
    const name = (structuredFileName || '').toLowerCase();
    if (name.endsWith('.json')) {
      detected.push({ type: 'structured', subtype: 'json', file: structuredFile, fileName: structuredFileName });
    } else if (name.endsWith('.csv')) {
      detected.push({ type: 'structured', subtype: 'csv', file: structuredFile, fileName: structuredFileName });
    } else {
      // Try to detect by content
      const trimmed = structuredFile.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        detected.push({ type: 'structured', subtype: 'json', file: structuredFile, fileName: structuredFileName || 'structured.json' });
      } else {
        detected.push({ type: 'structured', subtype: 'csv', file: structuredFile, fileName: structuredFileName || 'structured.csv' });
      }
    }
  }

  // Detect unstructured source
  if (sourceType === 'github' && sourceUrl) {
    detected.push({ type: 'github', url: sourceUrl });
  } else if (sourceType === 'linkedin' && sourceUrl) {
    detected.push({ type: 'linkedin', url: sourceUrl });
  } else if (sourceType === 'pdf' && pdfFile) {
    detected.push({ type: 'resume', file: pdfFile });
  }

  // Validate — at least one source must be present
  if (detected.length === 0) {
    throw new SourceDetectionError('No valid sources detected. Provide at least one structured file or an unstructured source.');
  }

  // Issue warnings but don't throw — the pipeline can produce useful output from a single source type
  const hasStructured = detected.some(s => s.type === 'structured');
  const hasUnstructured = detected.some(s => ['github', 'linkedin', 'resume'].includes(s.type));

  if (!hasStructured) {
    console.warn('[SourceDetector] No structured source detected. Pipeline will proceed with unstructured sources only.');
  }

  if (!hasUnstructured) {
    console.warn('[SourceDetector] No unstructured source detected. Pipeline will proceed with structured data only.');
  }

  return detected;
}

export class SourceDetectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SourceDetectionError';
  }
}