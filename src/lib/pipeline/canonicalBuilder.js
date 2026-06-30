/**
 * Canonical Profile Builder
 *
 * Responsibilities:
 *   - Initialize all array fields to [] (never null)
 *   - Merge arrays with deduplication (skills, emails, phones, links)
 *   - Select primary email (first in priority-ordered list)
 *   - Select primary phone (first E.164 formatted)
 *   - Sort experience[] chronologically descending by startDate
 *   - Sort education[] chronologically descending by endDate
 *   - Generate UUID for candidateId
 *   - Compute / attach overall confidence
 *   - Build the complete canonical profile object
 */

const ARRAY_FIELDS = ['emails', 'phones', 'skills', 'coreSubjects', 'experience', 'education', 'links'];

export function buildCanonicalProfile(resolvedProfile, fieldConfidence, overallConfidence, provenanceMap, sources) {
  const canonical = {
    candidateId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  // Copy resolved fields (excluding internal _sourceMap)
  for (const [key, value] of Object.entries(resolvedProfile)) {
    if (key.startsWith('_')) continue;
    if (value !== undefined) {
      canonical[key] = value;
    }
  }

  // Ensure all array fields default to [] — never null or undefined
  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(canonical[field])) {
      canonical[field] = [];
    }
  }

  // Deduplicate arrays
  canonical.emails = dedupArray(canonical.emails, v => typeof v === 'string' ? v.toLowerCase() : v);
  canonical.phones = dedupArray(canonical.phones, v => v);
  canonical.skills = dedupArray(canonical.skills, v => typeof v === 'string' ? v.toLowerCase() : v);
  canonical.coreSubjects = dedupArray(canonical.coreSubjects, v => typeof v === 'string' ? v.toLowerCase() : v);
  canonical.links = dedupArray(canonical.links, v => v?.url || JSON.stringify(v));

  // Select primary email
  canonical.primaryEmail = canonical.emails.length > 0 ? canonical.emails[0] : null;

  // Select primary phone
  canonical.primaryPhone = canonical.phones.length > 0 ? canonical.phones[0] : null;

  // Sort experience chronologically descending by startDate
  canonical.experience = [...canonical.experience].sort((a, b) => {
    const dateA = new Date(a?.startDate || 0).getTime();
    const dateB = new Date(b?.startDate || 0).getTime();
    return dateB - dateA;
  });

  // Sort education chronologically descending by endDate
  canonical.education = [...canonical.education].sort((a, b) => {
    const dateA = new Date(a?.endDate || 0).getTime();
    const dateB = new Date(b?.endDate || 0).getTime();
    return dateB - dateA;
  });

  // Attach metadata
  canonical.sources = sources;
  canonical.fieldConfidence = fieldConfidence;
  canonical.overallConfidence = overallConfidence;
  canonical.provenanceMap = provenanceMap;

  return canonical;
}

function dedupArray(arr, keyFn) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}