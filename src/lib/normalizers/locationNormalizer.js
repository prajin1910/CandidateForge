/**
 * Location Normalizer
 * Parses a raw location string into a structured { city, state, country, raw } object.
 * Handles common formats: "City, State, Country", "City, Country", "City, State Code", etc.
 * Also normalizes state names (e.g., "TamilNadu" → "Tamil Nadu").
 * Returns { normalizedValue, success, confidence, error? }.
 */
import { normalizeCountry } from './countryNormalizer.js';

/**
 * Indian state name normalization map.
 * Maps common variations (no spaces, misspellings) to canonical names.
 */
const STATE_NORMALIZE_MAP = {
  'tamilnadu': 'Tamil Nadu',
  'tamil nadu': 'Tamil Nadu',
  'andhrapradesh': 'Andhra Pradesh',
  'andhra pradesh': 'Andhra Pradesh',
  'madhyapradesh': 'Madhya Pradesh',
  'madhya pradesh': 'Madhya Pradesh',
  'uttarpradesh': 'Uttar Pradesh',
  'uttar pradesh': 'Uttar Pradesh',
  'himachalpradesh': 'Himachal Pradesh',
  'himachal pradesh': 'Himachal Pradesh',
  'arunachalpradesh': 'Arunachal Pradesh',
  'arunachal pradesh': 'Arunachal Pradesh',
  'westbengal': 'West Bengal',
  'west bengal': 'West Bengal',
  'jammuandkashmir': 'Jammu and Kashmir',
  'jammu and kashmir': 'Jammu and Kashmir',
  'jammu & kashmir': 'Jammu and Kashmir',
  'newdelhi': 'New Delhi',
  'new delhi': 'New Delhi',
  'karnataka': 'Karnataka',
  'kerala': 'Kerala',
  'maharashtra': 'Maharashtra',
  'telangana': 'Telangana',
  'rajasthan': 'Rajasthan',
  'gujarat': 'Gujarat',
  'punjab': 'Punjab',
  'haryana': 'Haryana',
  'bihar': 'Bihar',
  'odisha': 'Odisha',
  'orissa': 'Odisha',
  'assam': 'Assam',
  'jharkhand': 'Jharkhand',
  'uttarakhand': 'Uttarakhand',
  'chhattisgarh': 'Chhattisgarh',
  'chattisgarh': 'Chhattisgarh',
  'goa': 'Goa',
  'meghalaya': 'Meghalaya',
  'manipur': 'Manipur',
  'mizoram': 'Mizoram',
  'nagaland': 'Nagaland',
  'sikkim': 'Sikkim',
  'tripura': 'Tripura',
  // US states
  'newyork': 'New York',
  'new york': 'New York',
  'newjersey': 'New Jersey',
  'new jersey': 'New Jersey',
  'california': 'California',
  'sanfrancisco': 'San Francisco',
  'losangeles': 'Los Angeles',
  'northcarolina': 'North Carolina',
  'north carolina': 'North Carolina',
  'southcarolina': 'South Carolina',
  'south carolina': 'South Carolina',
  'westvirginia': 'West Virginia',
  'west virginia': 'West Virginia',
  'northdakota': 'North Dakota',
  'north dakota': 'North Dakota',
  'southdakota': 'South Dakota',
  'south dakota': 'South Dakota',
  'rhodeisland': 'Rhode Island',
  'rhode island': 'Rhode Island',
  'newhampshire': 'New Hampshire',
  'new hampshire': 'New Hampshire',
  'newmexico': 'New Mexico',
  'new mexico': 'New Mexico',
};

/**
 * Normalize a state name.
 * Handles cases like "TamilNadu" → "Tamil Nadu".
 */
function normalizeState(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (STATE_NORMALIZE_MAP[lower]) {
    return STATE_NORMALIZE_MAP[lower];
  }
  // Try inserting space before each uppercase letter for camelCase like "TamilNadu"
  const spaced = trimmed.replace(/([a-z])([A-Z])/g, '$1 $2');
  const spacedLower = spaced.toLowerCase();
  if (STATE_NORMALIZE_MAP[spacedLower]) {
    return STATE_NORMALIZE_MAP[spacedLower];
  }
  return trimmed;
}

export function normalizeLocation(raw) {
  if (!raw || typeof raw !== 'string') {
    return { normalizedValue: null, success: false, confidence: 0, error: 'Location is empty or not a string' };
  }

  const trimmed = raw.trim();
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);

  let city = null;
  let state = null;
  let country = null;
  let confidence = 0.7;

  if (parts.length === 1) {
    // Could be a city or country — assume city
    city = parts[0];
    confidence = 0.5;
  } else if (parts.length === 2) {
    // "City, Country" or "City, State"
    city = parts[0];
    const countryResult = normalizeCountry(parts[1]);
    if (countryResult.success) {
      country = countryResult.normalizedValue;
    } else {
      state = normalizeState(parts[1]);
    }
    confidence = 0.75;
  } else if (parts.length >= 3) {
    // "City, State, Country"
    city = parts[0];
    state = normalizeState(parts[1]);
    const countryResult = normalizeCountry(parts[parts.length - 1]);
    if (countryResult.success) {
      country = countryResult.normalizedValue;
      confidence = 0.9;
    } else {
      country = parts[parts.length - 1];
      confidence = 0.8;
    }
  }

  const normalizedValue = {
    city,
    state,
    country,
    raw: trimmed,
  };

  return { normalizedValue, success: true, confidence };
}

/**
 * Normalize a structured location object.
 * Normalizes state names and country codes within the object.
 */
export function normalizeLocationObject(locationObj) {
  if (!locationObj || typeof locationObj !== 'object') {
    return { normalizedValue: locationObj, success: true, confidence: 0.8 };
  }

  const normalized = { ...locationObj };

  // Normalize state
  if (normalized.state) {
    normalized.state = normalizeState(normalized.state);
  }

  // Normalize country
  if (normalized.country && typeof normalized.country === 'string') {
    const countryResult = normalizeCountry(normalized.country);
    if (countryResult.success) {
      normalized.country = countryResult.normalizedValue;
    }
  }

  return {
    normalizedValue: normalized,
    success: true,
    confidence: 0.95, // Structured location objects are high confidence
  };
}