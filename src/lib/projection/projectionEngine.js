/**
 * Projection Engine
 *
 * Receives a canonical profile + projection config (array of {from, to} objects).
 * Uses lodash.get to resolve 'from' paths (supports dot notation, array index, nested).
 * Writes resolved value to 'to' key in output object.
 *
 * Features:
 *   - field renaming (from -> to)
 *   - nested object paths (e.g. "location.city")
 *   - array indexes (e.g. "emails[0]")
 *   - field exclusion (fields not listed are excluded)
 *   - field selection (only listed fields are included)
 *   - default values (per-field via "default" property)
 *   - missing value strategy (null / omit / error)
 *
 * If projection.fields is empty or absent, full canonical profile is returned unprojected.
 */
import _ from 'lodash';

export function projectProfile(canonicalProfile, projectionConfig, missingValueStrategy = 'null') {
  const { fields } = projectionConfig;

  // If no projection fields, return full canonical profile
  if (!fields || fields.length === 0) {
    return { ...canonicalProfile };
  }

  const output = {};

  for (const mapping of fields) {
    const { from, to, default: defaultValue } = mapping;
    const value = _.get(canonicalProfile, from);

    const isMissing = value === undefined || value === null;

    if (isMissing) {
      // If a default value is explicitly provided, use it
      if (defaultValue !== undefined) {
        output[to] = defaultValue;
        continue;
      }

      switch (missingValueStrategy) {
        case 'omit':
          // Don't include the field
          break;
        case 'error':
          throw new Error(`Projection: missing value for field '${from}' (mapped to '${to}')`);
        case 'null':
        default:
          output[to] = null;
          break;
      }
    } else {
      output[to] = value;
    }
  }

  return output;
}