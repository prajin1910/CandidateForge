/**
 * Normalization Engine — Index / Router
 *
 * Routes each field from a RawSourcePayload through the appropriate normalizer module.
 * Returns a NormalizedSourcePayload with all fields normalized.
 */
import { normalizeEmail, normalizeEmailArray } from './emailNormalizer.js';
import { normalizePhone, normalizePhoneArray } from './phoneNormalizer.js';
import { normalizeDate } from './dateNormalizer.js';
import { normalizeSkill, normalizeSkillArray } from './skillNormalizer.js';
import { normalizeCountry } from './countryNormalizer.js';
import { normalizeLocation, normalizeLocationObject } from './locationNormalizer.js';

/**
 * Normalize a single source payload.
 * @param {object} sourcePayload - { sourceType, rawFields, extractedAt, ... }
 * @param {object} normConfig - { phoneFormat, dateFormat, skillCanonicalization }
 * @returns {object} NormalizedSourcePayload
 */
export function normalizeSource(sourcePayload, normConfig = {}) {
  const { phoneFormat = 'E164', dateFormat = 'ISO', skillCanonicalization = true } = normConfig;
  const raw = sourcePayload.rawFields || {};
  const normalized = {};
  const normalizationResults = {};

  // Full name
  if (raw.fullName || raw.full_name || raw.name) {
    const val = raw.fullName || raw.full_name || raw.name;
    normalized.fullName = typeof val === 'string' ? val.trim() : val;
    normalizationResults.fullName = { normalizedValue: normalized.fullName, success: true, confidence: 1.0 };
  }

  // Emails
  if (raw.emails !== undefined || raw.email !== undefined) {
    const emailRaw = raw.emails || (raw.email ? [raw.email] : []);
    const emailArray = Array.isArray(emailRaw) ? emailRaw : [emailRaw];
    const results = normalizeEmailArray(emailArray);
    normalized.emails = results.map(r => r.normalizedValue).filter(Boolean);
    normalizationResults.emails = results;
  }

  // Phones
  if (raw.phones !== undefined || raw.phone !== undefined) {
    const phoneRaw = raw.phones || (raw.phone ? [raw.phone] : []);
    const phoneArray = Array.isArray(phoneRaw) ? phoneRaw : [phoneRaw];
    const results = normalizePhoneArray(phoneArray, 'US', phoneFormat);
    normalized.phones = results.map(r => r.normalizedValue).filter(Boolean);
    normalizationResults.phones = results;
  }

  // Location
  if (raw.location) {
    const result = typeof raw.location === 'string'
      ? normalizeLocation(raw.location)
      : normalizeLocationObject(raw.location);
    normalized.location = result.normalizedValue;
    normalizationResults.location = result;
  }

  // Headline — prefer explicit headline, fall back to job_title, then bio
  if (raw.headline || raw.job_title || raw.title || raw.bio) {
    normalized.headline = (raw.headline || raw.job_title || raw.title || raw.bio).trim();
    normalizationResults.headline = { normalizedValue: normalized.headline, success: true, confidence: 0.9 };
  }

  // Summary
  if (raw.summary || raw.about) {
    normalized.summary = (raw.summary || raw.about).trim();
    normalizationResults.summary = { normalizedValue: normalized.summary, success: true, confidence: 0.9 };
  }

  // Skills
  if (raw.skills) {
    const skillArray = Array.isArray(raw.skills) ? raw.skills : String(raw.skills).split(',').map(s => s.trim());
    const results = normalizeSkillArray(skillArray, { canonicalization: skillCanonicalization });
    normalized.skills = results.map(r => r.normalizedValue).filter(Boolean);
    normalizationResults.skills = results;
  }

  // Core Subjects
  if (raw.coreSubjects) {
    const subjectArray = Array.isArray(raw.coreSubjects) ? raw.coreSubjects : String(raw.coreSubjects).split(',').map(s => s.trim());
    const results = normalizeSkillArray(subjectArray, { canonicalization: skillCanonicalization });
    normalized.coreSubjects = results.map(r => r.normalizedValue).filter(Boolean);
    normalizationResults.coreSubjects = results;
  }

  // Experience — normalize existing array first
  if (raw.experience && Array.isArray(raw.experience)) {
    normalized.experience = raw.experience.map(exp => {
      const normExp = { ...exp };
      if (exp.startDate) {
        const result = normalizeDate(exp.startDate, dateFormat);
        normExp.startDate = result.normalizedValue;
      }
      if (exp.endDate) {
        const result = normalizeDate(exp.endDate, dateFormat);
        normExp.endDate = result.normalizedValue;
      }
      if (exp.skills) {
        const skillArray = Array.isArray(exp.skills) ? exp.skills : String(exp.skills).split(',').map(s => s.trim());
        const results = normalizeSkillArray(skillArray, { canonicalization: skillCanonicalization });
        normExp.skills = results.map(r => r.normalizedValue).filter(Boolean);
      }
      return normExp;
    });
    normalizationResults.experience = { normalizedValue: normalized.experience, success: true, confidence: 0.85 };
  }

  // Auto-create experience from current_company / job_title if experience[] is empty or missing
  if ((!normalized.experience || normalized.experience.length === 0) &&
      (raw.current_company || raw.job_title)) {
    const autoExp = {
      company: raw.current_company || null,
      title: raw.job_title || null,
      startDate: null,
      endDate: 'Present',
      description: null,
    };
    normalized.experience = [autoExp];
    normalizationResults.experience = {
      normalizedValue: normalized.experience,
      success: true,
      confidence: 0.8,
    };
  }

  // years_experience — map from experience_years
  if (raw.experience_years !== undefined && raw.experience_years !== null) {
    const val = typeof raw.experience_years === 'string'
      ? parseFloat(raw.experience_years)
      : raw.experience_years;
    if (!isNaN(val)) {
      normalized.yearsExperience = val;
      normalizationResults.yearsExperience = {
        normalizedValue: val,
        success: true,
        confidence: 1.0,
      };
    }
  }

  // Education
  if (raw.education && Array.isArray(raw.education)) {
    normalized.education = raw.education.map(edu => {
      const normEdu = { ...edu };
      if (edu.startDate) {
        const result = normalizeDate(edu.startDate, dateFormat);
        normEdu.startDate = result.normalizedValue;
      }
      if (edu.endDate) {
        const result = normalizeDate(edu.endDate, dateFormat);
        normEdu.endDate = result.normalizedValue;
      }
      return normEdu;
    });
    normalizationResults.education = { normalizedValue: normalized.education, success: true, confidence: 0.85 };
  }

  // Links
  if (raw.links || raw.github_url || raw.githubUrl || raw.linkedin_url || raw.linkedinUrl || raw.website || raw.blog) {
    const links = [];
    if (raw.links && Array.isArray(raw.links)) {
      links.push(...raw.links);
    }
    if (raw.github_url || raw.githubUrl) links.push({ type: 'github', url: raw.github_url || raw.githubUrl });
    if (raw.linkedin_url || raw.linkedinUrl) links.push({ type: 'linkedin', url: raw.linkedin_url || raw.linkedinUrl });
    if (raw.website || raw.blog) links.push({ type: 'website', url: raw.website || raw.blog });
    normalized.links = links;
    normalizationResults.links = { normalizedValue: links, success: true, confidence: 0.9 };
  }

  return {
    ...sourcePayload,
    normalizedFields: normalized,
    normalizationResults,
  };
}

/**
 * Normalize all source payloads.
 */
export function normalizeAllSources(sourcePayloads, normConfig = {}) {
  return sourcePayloads.map(payload => normalizeSource(payload, normConfig));
}