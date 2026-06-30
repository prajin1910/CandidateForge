/**
 * Email Normalizer
 * Lowercases, trims, and validates email addresses against RFC 5322 simplified regex.
 * Returns { normalizedValue, success, confidence, error? }.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function normalizeEmail(raw) {
  if (!raw || typeof raw !== 'string') {
    return { normalizedValue: null, success: false, confidence: 0, error: 'Email is empty or not a string' };
  }

  const trimmed = raw.trim().toLowerCase();

  if (!EMAIL_REGEX.test(trimmed)) {
    return { normalizedValue: trimmed, success: false, confidence: 0.3, error: 'Email failed RFC 5322 validation' };
  }

  return { normalizedValue: trimmed, success: true, confidence: 1.0 };
}

export function normalizeEmailArray(rawArray) {
  if (!Array.isArray(rawArray)) return [];
  const seen = new Set();
  const results = [];
  for (const raw of rawArray) {
    const result = normalizeEmail(raw);
    if (result.normalizedValue && !seen.has(result.normalizedValue)) {
      seen.add(result.normalizedValue);
      results.push(result);
    }
  }
  return results;
}