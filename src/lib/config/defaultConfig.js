/**
 * Default Runtime Configuration
 * Used when the operator does not supply a custom config.
 */
export const DEFAULT_CONFIG = {
  sourcePriority: ['structured', 'github', 'resume', 'linkedin'],
  projection: {
    fields: [
      { from: 'candidateId', to: 'candidate_id' },
      { from: 'fullName', to: 'full_name' },
      { from: 'emails[0]', to: 'primary_email' },
      { from: 'phones[0]', to: 'primary_phone' },
      { from: 'location', to: 'location' },
      { from: 'headline', to: 'headline' },
      { from: 'skills', to: 'skills' },
      { from: 'coreSubjects', to: 'core_subjects' },
      { from: 'experience', to: 'experience' },
      { from: 'education', to: 'education' },
      { from: 'links', to: 'links' },
      { from: 'yearsExperience', to: 'years_experience' },
      { from: 'overallConfidence', to: 'confidence' },
      { from: 'provenanceMap', to: 'provenance' },
      { from: 'fieldConfidence', to: 'fieldConfidence' },
      { from: 'sources', to: 'sources' },
    ],
  },
  normalization: {
    phoneFormat: 'E164',
    dateFormat: 'ISO',
    skillCanonicalization: true,
  },
  missingValueStrategy: 'null',
};