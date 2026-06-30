/**
 * Phone Normalizer
 * Uses libphonenumber-js to normalize phone numbers to E.164 or NATIONAL format.
 * Returns { normalizedValue, success, confidence, error? }.
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(raw, defaultCountry = 'US', format = 'E164') {
  if (!raw || typeof raw !== 'string') {
    return { normalizedValue: null, success: false, confidence: 0, error: 'Phone is empty or not a string' };
  }

  const trimmed = raw.trim();

  try {
    const phoneNumber = parsePhoneNumberFromString(trimmed, defaultCountry);

    if (!phoneNumber || !phoneNumber.isValid()) {
      return { normalizedValue: trimmed, success: false, confidence: 0.3, error: 'Phone number is invalid' };
    }

    const normalizedValue = format === 'NATIONAL'
      ? phoneNumber.formatNational()
      : phoneNumber.format('E.164');

    return { normalizedValue, success: true, confidence: 1.0 };
  } catch (e) {
    return { normalizedValue: trimmed, success: false, confidence: 0.2, error: `Phone parse error: ${e.message}` };
  }
}

export function normalizePhoneArray(rawArray, defaultCountry = 'US', format = 'E164') {
  if (!Array.isArray(rawArray)) return [];
  const seen = new Set();
  const results = [];
  for (const raw of rawArray) {
    const result = normalizePhone(raw, defaultCountry, format);
    if (result.normalizedValue && !seen.has(result.normalizedValue)) {
      seen.add(result.normalizedValue);
      results.push(result);
    }
  }
  return results;
}