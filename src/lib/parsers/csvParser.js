import Papa from 'papaparse';

/**
 * CSV Parser
 * Parses a CSV file content string into an array of raw JS objects.
 * Returns a RawSourcePayload.
 */
export function parseCSV(fileContent, fileName = 'structured.csv') {
  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  if (result.errors && result.errors.length > 0) {
    const msgs = result.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ');
    throw new ParseError(`CSV parse errors: ${msgs}`);
  }

  const rows = result.data;
  if (!rows || rows.length === 0) {
    throw new ParseError('CSV file contains no data rows');
  }

  // If multiple rows, use the first row as the candidate record
  const rawFields = rows[0];

  return {
    sourceType: 'structured',
    sourceSubtype: 'csv',
    sourceName: fileName,
    rawFields,
    extractedAt: new Date().toISOString(),
    extractorVersion: 'csvParser@1.0',
  };
}

export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}