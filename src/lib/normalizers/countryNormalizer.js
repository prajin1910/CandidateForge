/**
 * Country Normalizer
 * Normalizes country names and codes to ISO 3166-1 alpha-2 codes.
 * Returns { normalizedValue, success, confidence, error? }.
 */

const COUNTRY_MAP = {
  'us': 'US', 'usa': 'US', 'united states': 'US', 'united states of america': 'US', 'america': 'US',
  'uk': 'GB', 'gb': 'GB', 'united kingdom': 'GB', 'britain': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
  'in': 'IN', 'india': 'IN', 'bharat': 'IN',
  'ca': 'CA', 'canada': 'CA',
  'au': 'AU', 'australia': 'AU',
  'de': 'DE', 'germany': 'DE', 'deutschland': 'DE',
  'fr': 'FR', 'france': 'FR',
  'es': 'ES', 'spain': 'ES', 'españa': 'ES',
  'it': 'IT', 'italy': 'IT', 'italia': 'IT',
  'nl': 'NL', 'netherlands': 'NL', 'holland': 'NL',
  'se': 'SE', 'sweden': 'SE',
  'no': 'NO', 'norway': 'NO',
  'dk': 'DK', 'denmark': 'DK',
  'fi': 'FI', 'finland': 'FI',
  'ie': 'IE', 'ireland': 'IE',
  'pt': 'PT', 'portugal': 'PT',
  'ch': 'CH', 'switzerland': 'CH',
  'at': 'AT', 'austria': 'AT',
  'be': 'BE', 'belgium': 'BE',
  'jp': 'JP', 'japan': 'JP',
  'kr': 'KR', 'south korea': 'KR', 'korea': 'KR',
  'cn': 'CN', 'china': 'CN',
  'sg': 'SG', 'singapore': 'SG',
  'ae': 'AE', 'united arab emirates': 'AE', 'uae': 'AE',
  'sa': 'SA', 'saudi arabia': 'SA',
  'il': 'IL', 'israel': 'IL',
  'br': 'BR', 'brazil': 'BR',
  'mx': 'MX', 'mexico': 'MX',
  'ar': 'AR', 'argentina': 'AR',
  'za': 'ZA', 'south africa': 'ZA',
  'nz': 'NZ', 'new zealand': 'NZ',
  'pl': 'PL', 'poland': 'PL',
  'ru': 'RU', 'russia': 'RU',
  'tr': 'TR', 'turkey': 'TR', 'türkiye': 'TR',
  'eg': 'EG', 'egypt': 'EG',
  'ng': 'NG', 'nigeria': 'NG',
  'id': 'ID', 'indonesia': 'ID',
  'my': 'MY', 'malaysia': 'MY',
  'th': 'TH', 'thailand': 'TH',
  'ph': 'PH', 'philippines': 'PH',
  'vn': 'VN', 'vietnam': 'VN',
};

export function normalizeCountry(raw) {
  if (!raw || typeof raw !== 'string') {
    return { normalizedValue: null, success: false, confidence: 0, error: 'Country is empty or not a string' };
  }

  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  // Already a valid 2-letter code
  if (upper.length === 2 && COUNTRY_MAP[lower]) {
    return { normalizedValue: upper, success: true, confidence: 1.0 };
  }

  // Lookup in map
  if (COUNTRY_MAP[lower]) {
    return { normalizedValue: COUNTRY_MAP[lower], success: true, confidence: 1.0 };
  }

  return { normalizedValue: trimmed, success: false, confidence: 0.3, error: 'Unknown country name' };
}