/**
 * Provenance Builder
 *
 * For each field in the resolved profile, attaches provenance metadata:
 *   { source, rawValue, normalizedValue, confidence, normalizationSuccess, extractedAt, allSourceValues }
 *
 * Provenance is stored in a flat map: provenanceMap: Record<fieldName, ProvenanceEntry>
 */
export function buildProvenance(resolvedProfile, normalizedSources, fieldConfidence) {
  const provenanceMap = {};
  const sourceMap = resolvedProfile._sourceMap || {};

  for (const fieldName of Object.keys(resolvedProfile)) {
    if (fieldName.startsWith('_')) continue;

    const sm = sourceMap[fieldName];
    if (!sm) {
      provenanceMap[fieldName] = {
        source: null,
        rawValue: null,
        normalizedValue: resolvedProfile[fieldName],
        confidence: 0,
        normalizationSuccess: false,
        extractedAt: null,
        allSourceValues: [],
      };
      continue;
    }

    // Find the raw value from the original source payload
    const sourceType = Array.isArray(sm.source) ? sm.source[0] : sm.source;
    const originalSource = normalizedSources.find(ns => ns.sourceType === sourceType);
    const rawFields = originalSource?.rawFields || {};
    const rawValue = rawFields[fieldName] !== undefined ? rawFields[fieldName] : null;

    provenanceMap[fieldName] = {
      source: sm.source,
      rawValue,
      normalizedValue: resolvedProfile[fieldName],
      confidence: fieldConfidence[fieldName] || 0,
      normalizationSuccess: sm.normalizationResult?.success !== false,
      extractedAt: originalSource?.extractedAt || null,
      allSourceValues: (sm.allValues || []).map(sv => ({
        source: sv.source,
        value: sv.value || sv.values,
      })),
    };
  }

  return provenanceMap;
}