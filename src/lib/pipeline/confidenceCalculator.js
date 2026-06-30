/**
 * Confidence Calculator
 *
 * Computes a confidence score (0.0–1.0) per field using weighted factors:
 *
 *   (a) Source Reliability — base weight per source tier:
 *       structured=0.40, github=0.30, resume=0.20, linkedin=0.10
 *       (weights are additive if multiple sources supply the field)
 *
 *   (b) Cross-Source Agreement:
 *       +0.30 if exactly 2 sources supply identical normalized values
 *       +0.45 if 3 or more sources supply identical normalized values
 *
 *   (c) Consistency Penalty:
 *       −0.15 per field if conflicting (different) values exist across sources
 *
 *   (d) Normalization Penalty:
 *       −0.10 if normalization failed or was skipped
 *
 *   (e) Completeness Penalty:
 *       −0.10 if value is partial/inferred (normalization confidence < 0.5)
 *
 * Final score = clamp(sum of factors, 0.0, 1.0)
 *
 * Overall profile confidence = weighted average of all field scores,
 * weighted by field importance (fullName, emails, skills weighted higher).
 */

const SOURCE_RELIABILITY = {
  structured: 0.40,
  github: 0.30,
  resume: 0.20,
  linkedin: 0.10,
};

const FIELD_IMPORTANCE = {
  fullName: 2.0,
  emails: 2.0,
  phones: 1.5,
  skills: 1.8,
  location: 1.0,
  headline: 0.8,
  summary: 0.5,
  experience: 1.5,
  education: 1.0,
  links: 0.8,
};

/**
 * Normalize a value to a comparable string for cross-source agreement checks.
 * Handles objects, arrays, and strings uniformly.
 * For location objects, extract essential fields (city, state) for comparison
 * so that formatting differences ({city:"Chennai", state:"Tamil Nadu"} vs raw string)
 * are not treated as conflicts.
 */
function toComparableString(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim().toLowerCase();
  if (typeof val === 'object' && !Array.isArray(val)) {
    // Special handling for location objects: compare by city + state (normalized)
    if ('city' in val || 'state' in val || 'country' in val) {
      const city = (val.city || '').trim().toLowerCase();
      const state = (val.state || '').trim().toLowerCase()
        .replace(/\s+/g, ''); // "Tamil Nadu" → "tamilnadu" for comparison
      return `${city}|${state}`;
    }
    // Experience comparison
    if (val.company || val.title) {
      const company = (val.company || '').trim().toLowerCase();
      const title = (val.title || '').trim().toLowerCase();
      return `exp:${company}|${title}`;
    }
    // Education comparison
    if (val.institution || val.degree || val.qualification) {
      const institution = (val.institution || '').trim().toLowerCase();
      const degree = (val.degree || val.qualification || '').trim().toLowerCase();
      return `edu:${institution}|${degree}`;
    }
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) return JSON.stringify(val);
  return String(val).toLowerCase();
}

export function calculateFieldConfidence(fieldName, sourceMap) {
  if (!sourceMap) return 0;

  const { source, allValues, normalizationResult } = sourceMap;

  // (a) Source Reliability — add base weight for each source that supplied the field
  const sources = Array.isArray(source) ? source : [source];
  let reliabilityScore = 0;
  for (const s of sources) {
    reliabilityScore += SOURCE_RELIABILITY[s] || 0.10;
  }

  // (b) Cross-Source Agreement
  let agreementBonus = 0;
  let consistencyPenalty = 0;

  if (allValues && allValues.length >= 2) {
    const values = allValues.map(sv => toComparableString(sv.value || sv.values));
    const uniqueValues = new Set(values);

    if (uniqueValues.size === 1) {
      // All sources agree — significant confidence boost
      if (allValues.length >= 3) {
        agreementBonus = 0.45; // 3+ sources agree
      } else {
        agreementBonus = 0.30; // exactly 2 sources agree
      }
    } else {
      // (c) Consistency Penalty — conflicting values across sources
      consistencyPenalty = 0.15;
    }
  }

  // (d) Normalization Penalty
  let normPenalty = 0;
  if (normalizationResult?.success === false) {
    normPenalty = 0.10;
  }

  // (e) Completeness Penalty
  let completenessPenalty = 0;
  if (normalizationResult?.confidence !== undefined && normalizationResult.confidence < 0.5) {
    completenessPenalty = 0.10;
  }

  const rawScore = reliabilityScore + agreementBonus - consistencyPenalty - normPenalty - completenessPenalty;

  return Math.max(0, Math.min(1, rawScore));
}

export function calculateOverallConfidence(fieldConfidenceMap) {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [fieldName, confidence] of Object.entries(fieldConfidenceMap)) {
    const weight = FIELD_IMPORTANCE[fieldName] || 1.0;
    totalWeight += weight;
    weightedSum += confidence * weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function calculateAllConfidences(resolvedProfile) {
  const fieldConfidence = {};
  const sourceMap = resolvedProfile._sourceMap || {};

  for (const fieldName of Object.keys(resolvedProfile)) {
    if (fieldName.startsWith('_')) continue;
    if (resolvedProfile[fieldName] === undefined || resolvedProfile[fieldName] === null) {
      fieldConfidence[fieldName] = 0;
      continue;
    }
    fieldConfidence[fieldName] = calculateFieldConfidence(fieldName, sourceMap[fieldName]);
  }

  const overallConfidence = calculateOverallConfidence(fieldConfidence);

  return { fieldConfidence, overallConfidence };
}