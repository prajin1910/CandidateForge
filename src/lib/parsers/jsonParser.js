/**
 * JSON Parser
 * Parses a JSON file content string into a raw JS object.
 * Supports both a single object and an array (uses first element).
 * Returns a RawSourcePayload.
 */
export function parseJSON(fileContent, fileName = 'structured.json') {
  let parsed;
  try {
    parsed = JSON.parse(fileContent);
  } catch (e) {
    throw new ParseError(`Invalid JSON: ${e.message}`);
  }

  let rawFields;
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new ParseError('JSON array is empty');
    }
    rawFields = parsed[0];
  } else if (typeof parsed === 'object' && parsed !== null) {
    rawFields = parsed;
  } else {
    throw new ParseError('JSON root must be an object or array');
  }

  return {
    sourceType: 'structured',
    sourceSubtype: 'json',
    sourceName: fileName,
    rawFields,
    extractedAt: new Date().toISOString(),
    extractorVersion: 'jsonParser@1.0',
  };
}

export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}