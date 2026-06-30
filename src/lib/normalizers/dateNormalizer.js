/**
 * Date Normalizer
 * Uses date-fns to parse and normalize date strings to ISO 8601 or US format.
 * Returns { normalizedValue, success, confidence, error? }.
 */
import { parse, format, isValid } from 'date-fns';

const PARSE_PATTERNS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'MM-dd-yyyy',
  'dd/MM/yyyy',
  'yyyy/MM/dd',
  'MMM yyyy',
  'MMMM yyyy',
  'yyyy',
  'MMM dd, yyyy',
  'MMMM dd, yyyy',
  'dd MMM yyyy',
  'dd MMMM yyyy',
  'yyyy-MM',
  'MM/yyyy',
];

export function normalizeDate(raw, outputFormat = 'ISO') {
  if (!raw || typeof raw !== 'string') {
    return { normalizedValue: null, success: false, confidence: 0, error: 'Date is empty or not a string' };
  }

  const trimmed = raw.trim();

  // Try native Date parsing first (handles ISO strings)
  let date = new Date(trimmed);
  if (!isValid(date)) {
    // Try pattern-based parsing
    for (const pattern of PARSE_PATTERNS) {
      date = parse(trimmed, pattern, new Date());
      if (isValid(date)) break;
    }
  }

  if (!isValid(date)) {
    return { normalizedValue: trimmed, success: false, confidence: 0.3, error: 'Unrecognized date format' };
  }

  const normalizedValue = outputFormat === 'US'
    ? format(date, 'MM/dd/yyyy')
    : date.toISOString();

  return { normalizedValue, success: true, confidence: 1.0 };
}

export function normalizeDateRange(startDateRaw, endDateRaw, outputFormat = 'ISO') {
  return {
    startDate: normalizeDate(startDateRaw, outputFormat),
    endDate: normalizeDate(endDateRaw, outputFormat),
  };
}