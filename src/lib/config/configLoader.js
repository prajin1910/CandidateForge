import { z } from 'zod';
import { DEFAULT_CONFIG } from './defaultConfig.js';

/**
 * Validates and loads a runtime configuration object.
 * Throws ConfigValidationError on invalid input.
 */
const ConfigSchema = z.object({
  sourcePriority: z.array(z.string()).min(1),
  projection: z.object({
    fields: z.array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
        default: z.any().optional(),
      })
    ).default([]),
  }).default({ fields: [] }),
  normalization: z.object({
    phoneFormat: z.enum(['E164', 'NATIONAL']).default('E164'),
    dateFormat: z.enum(['ISO', 'US']).default('ISO'),
    skillCanonicalization: z.boolean().default(true),
  }).default({ phoneFormat: 'E164', dateFormat: 'ISO', skillCanonicalization: true }),
  missingValueStrategy: z.enum(['null', 'omit', 'error']).default('null'),
});

export function loadConfig(rawConfig) {
  if (!rawConfig || (typeof rawConfig === 'string' && rawConfig.trim() === '')) {
    return { ...DEFAULT_CONFIG };
  }
  let parsed;
  try {
    parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
  } catch (e) {
    throw new ConfigValidationError(`Invalid JSON in config: ${e.message}`);
  }
  const result = ConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ConfigValidationError(`Config validation failed: ${issues}`);
  }
  return result.data;
}

export class ConfigValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}