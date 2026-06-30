/**
 * Conflict Resolver
 *
 * Reads sourcePriority from runtime config and resolves field conflicts.
 * For scalar fields: selects the first non-null value from the highest-priority source.
 * For array fields: union-merges across all sources with deduplication.
 *   - When no data exists, arrays default to [] (never null).
 * Applies missingValueStrategy for scalar fields with no value across all sources.
 */
export function resolveConflicts(aggregated, config) {
  const { sourcePriority, missingValueStrategy } = config;
  const resolved = {};

  // Resolve scalar fields
  for (const [fieldName, sourceValues] of Object.entries(aggregated.scalarFields)) {
    let resolvedValue = null;
    let resolvedSource = null;
    let resolvedNormResult = null;

    // Iterate sources in priority order
    for (const sourceType of sourcePriority) {
      const entry = sourceValues.find(sv => sv.source === sourceType);
      if (entry && entry.value !== null && entry.value !== undefined) {
        resolvedValue = entry.value;
        resolvedSource = entry.source;
        resolvedNormResult = entry.normalizationResult;
        break;
      }
    }

    // If no source had a value, apply missing value strategy
    if (resolvedValue === null) {
      if (missingValueStrategy === 'omit') {
        // Don't include the field at all
        continue;
      } else if (missingValueStrategy === 'error') {
        throw new Error(`Missing required field: ${fieldName}`);
      } else {
        // 'null' strategy — explicitly set to null
        resolved[fieldName] = null;
        continue;
      }
    }

    resolved[fieldName] = resolvedValue;
    resolved._sourceMap = resolved._sourceMap || {};
    resolved._sourceMap[fieldName] = {
      source: resolvedSource,
      allValues: sourceValues.map(sv => ({ source: sv.source, value: sv.value })),
      normalizationResult: resolvedNormResult,
    };
  }

  // Resolve array fields (union merge with dedup)
  for (const [fieldName, sourceArrays] of Object.entries(aggregated.arrayFields)) {
    const merged = [];
    const seen = new Set();
    const sourceMap = [];

    for (const sourceType of sourcePriority) {
      const entry = sourceArrays.find(sa => sa.source === sourceType);
      if (entry && entry.values) {
        for (const val of entry.values) {
          const key = getDedupKey(val);
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(val);
          }
        }
        sourceMap.push({ source: sourceType, count: entry.values.length });
      }
    }

    // Arrays always default to [] — never null
    resolved[fieldName] = merged;
    if (merged.length > 0) {
      resolved._sourceMap = resolved._sourceMap || {};
      resolved._sourceMap[fieldName] = {
        source: sourceMap.map(sm => sm.source),
        allValues: sourceArrays,
        normalizationResult: { success: true, confidence: 0.85 },
      };
    }
  }

  return resolved;
}

function getDedupKey(value) {
  if (typeof value === 'string') return value.toLowerCase();
  if (value && typeof value === 'object') {
    if (value.url) return value.url;
    // Experience deduplication
    if (value.company || value.title) {
      const company = (value.company || '').trim().toLowerCase();
      const title = (value.title || '').trim().toLowerCase();
      return `exp:${company}|${title}`;
    }
    // Education deduplication
    if (value.institution || value.degree || value.qualification) {
      const institution = (value.institution || '').trim().toLowerCase();
      const degree = (value.degree || value.qualification || '').trim().toLowerCase();
      return `edu:${institution}|${degree}`;
    }
    if (value.name) return value.name.toLowerCase();
  }
  return JSON.stringify(value);
}