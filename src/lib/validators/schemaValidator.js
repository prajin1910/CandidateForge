/**
 * Schema Validator
 *
 * Validates the projected output against a Zod schema.
 * Array fields are coerced: null/undefined → [] so validation never fails
 * with "Expected array, Received null".
 *
 * On failure: returns { valid: false, errors: [{field, message, receivedValue}] }.
 * On success: returns { valid: true, data: validatedData }.
 */
import { z } from 'zod';

const LinkSchema = z.object({
  type: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
}).passthrough();

const ExperienceSchema = z.object({
  company: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
}).passthrough();

const EducationSchema = z.object({
  institution: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  field: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
}).passthrough();

const LocationSchema = z.object({
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  raw: z.string().nullable().optional(),
}).passthrough().nullable();

const ProvenanceEntrySchema = z.object({
  source: z.union([z.string(), z.array(z.string())]).nullable().optional(),
  rawValue: z.any().optional(),
  normalizedValue: z.any().optional(),
  confidence: z.number().optional(),
  normalizationSuccess: z.boolean().optional(),
  extractedAt: z.string().nullable().optional(),
  allSourceValues: z.array(z.any()).optional(),
}).passthrough();

// The output schema is permissive since projection can change field names.
// Array fields accept null and coerce to [] to prevent "Expected array, Received null".
const ArrayField = z.preprocess(
  (val) => (val === null || val === undefined ? [] : val),
  z.array(z.any())
);

const OutputSchema = z.object({
  candidateId: z.string().nullable().optional(),
  candidate_id: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
  candidate_name: z.string().nullable().optional(),
  emails: ArrayField.optional(),
  primary_email: z.string().nullable().optional(),
  primaryEmail: z.string().nullable().optional(),
  phones: ArrayField.optional(),
  primary_phone: z.string().nullable().optional(),
  primaryPhone: z.string().nullable().optional(),
  location: z.union([LocationSchema, z.string()]).nullable().optional(),
  headline: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  skills: ArrayField.optional(),
  experience: ArrayField.optional(),
  education: ArrayField.optional(),
  links: ArrayField.optional(),
  confidence: z.number().nullable().optional(),
  overallConfidence: z.number().nullable().optional(),
  provenance: z.record(z.string(), ProvenanceEntrySchema).nullable().optional(),
  provenanceMap: z.record(z.string(), ProvenanceEntrySchema).nullable().optional(),
  sources: z.array(z.any()).optional(),
  fieldConfidence: z.record(z.string(), z.number()).nullable().optional(),
}).passthrough();

export function validateOutput(data) {
  const result = OutputSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      receivedValue: issue.received,
    }));
    return { valid: false, errors, data };
  }

  return { valid: true, data: result.data, errors: [] };
}