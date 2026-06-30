/**
 * Source Aggregator (Profile Merge Engine)
 *
 * Receives normalized outputs from all source extractors for the SAME candidate.
 * Responsibilities:
 *   - Aggregate data belonging to the same candidate
 *   - Merge arrays where appropriate (skills, emails, phones, links)
 *   - Remove duplicate values
 *   - Forward merged data to the Conflict Resolver
 *
 * Does NOT perform identity matching across multiple candidates.
 * (Architecture is extensible — an Entity Resolution module can be added in the future.)
 */
export function aggregateSources(normalizedSources) {
  const aggregated = {
    scalarFields: {},  // fieldName -> [{ source, value, normalizationResult }]
    arrayFields: {},   // fieldName -> [{ source, values: [], normalizationResult }]
    sources: [],       // list of source metadata
  };

  for (const source of normalizedSources) {
    const fields = source.normalizedFields || {};
    const sourceName = source.sourceType;
    aggregated.sources.push({
      sourceType: source.sourceType,
      sourceName: source.sourceName,
      isStub: source.isStub || false,
      extractedAt: source.extractedAt,
    });

    for (const [fieldName, value] of Object.entries(fields)) {
      if (fieldName.startsWith('_')) continue; // Skip metadata

      if (Array.isArray(value)) {
        if (!aggregated.arrayFields[fieldName]) {
          aggregated.arrayFields[fieldName] = [];
        }
        aggregated.arrayFields[fieldName].push({
          source: sourceName,
          values: value,
          normalizationResult: source.normalizationResults?.[fieldName] || { success: true, confidence: 0.8 },
        });
      } else if (value !== null && value !== undefined) {
        if (!aggregated.scalarFields[fieldName]) {
          aggregated.scalarFields[fieldName] = [];
        }
        aggregated.scalarFields[fieldName].push({
          source: sourceName,
          value,
          normalizationResult: source.normalizationResults?.[fieldName] || { success: true, confidence: 0.8 },
        });
      }
    }
  }

  return aggregated;
}