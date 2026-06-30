/**
 * Skill Normalizer (Layered Approach)
 *
 * Stage 1: Exact match against Canonical Skill Dictionary
 * Stage 2: Synonym Mapping lookup
 * Stage 3: Fuzzy Matching (Fuse.js) against canonical dictionary
 * Stage 4: Duplicate Removal
 *
 * Returns { normalizedValue, success, confidence, error? } for a single skill,
 * or an array of results for skill arrays.
 */
import Fuse from 'fuse.js';
import { CANONICAL_SKILLS, SKILL_SYNONYMS } from './skillDictionary.js';

// Build a lookup map for exact matching (case-insensitive)
const EXACT_MATCH_MAP = new Map();
for (const skill of CANONICAL_SKILLS) {
  EXACT_MATCH_MAP.set(skill.toLowerCase(), skill);
}

// Blocklist — non-skill terms that should never appear in skills[].
// Includes repo names, config keywords, and generic words from GitHub topics.
const SKILL_BLOCKLIST = new Set([
  'config', 'configuration', 'settings', 'dotfiles', 'dotfile',
  'test', 'tests', 'testing', 'sample', 'samples', 'demo', 'demos',
  'example', 'examples', 'template', 'templates', 'boilerplate',
  'github-config', 'my-config', 'setup', 'init', 'install',
  'readme', 'docs', 'documentation', 'tutorial', 'tutorials',
  'awesome', 'awesome-list', 'curated-list', 'list',
  'todo', 'notes', 'cheatsheet', 'cheat-sheet',
  'backup', 'archive', 'old', 'deprecated', 'legacy',
  'fork', 'forked', 'mirror', 'clone',
  'homework', 'assignment', 'coursework', 'lab', 'labs',
  'practice', 'practise', 'learning', 'study',
  'profile', 'portfolio', 'resume', 'cv',
  'misc', 'miscellaneous', 'other', 'stuff', 'random',
  'utils', 'utilities', 'helpers', 'tools', 'scripts',
]);

// Fuse.js instance for fuzzy matching — threshold tightened to 0.25 to
// prevent false positives like "config" matching "Confluence".
const fuse = new Fuse(CANONICAL_SKILLS, {
  includeScore: true,
  threshold: 0.25,
  ignoreLocation: true,
  minMatchCharLength: 3,
});

export function normalizeSkill(raw, { canonicalization = true } = {}) {
  if (!raw || typeof raw !== 'string') {
    return { normalizedValue: null, success: false, confidence: 0, error: 'Skill is empty or not a string' };
  }

  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // Blocklist check — filter out non-skill terms regardless of canonicalization setting
  if (SKILL_BLOCKLIST.has(lower)) {
    return { normalizedValue: null, success: false, confidence: 0, error: 'Blocked non-skill term' };
  }

  if (!canonicalization) {
    return { normalizedValue: trimmed, success: true, confidence: 0.8 };
  }

  // Stage 1: Exact match
  if (EXACT_MATCH_MAP.has(lower)) {
    return { normalizedValue: EXACT_MATCH_MAP.get(lower), success: true, confidence: 1.0 };
  }

  // Stage 2: Synonym mapping
  if (SKILL_SYNONYMS[lower]) {
    return { normalizedValue: SKILL_SYNONYMS[lower], success: true, confidence: 0.95 };
  }

  // Stage 3: Fuzzy matching — only for inputs of 3+ chars and require tight score
  if (trimmed.length >= 3) {
    const fuzzyResults = fuse.search(trimmed);
    if (fuzzyResults.length > 0 && fuzzyResults[0].score <= 0.25) {
      return {
        normalizedValue: fuzzyResults[0].item,
        success: true,
        confidence: 0.85,
        originalValue: trimmed,
        fuzzyScore: 1 - fuzzyResults[0].score,
      };
    }
  }

  // No match found — return the original value unchanged
  return {
    normalizedValue: trimmed,
    success: true,
    confidence: 0.6,
    originalValue: trimmed,
  };
}

export function normalizeSkillArray(rawArray, options = {}) {
  if (!Array.isArray(rawArray)) return [];

  // Handle comma-separated strings within the array
  const expanded = [];
  for (const item of rawArray) {
    if (typeof item === 'string' && item.includes(',')) {
      expanded.push(...item.split(',').map(s => s.trim()).filter(Boolean));
    } else {
      expanded.push(item);
    }
  }

  const seen = new Set();
  const results = [];

  for (const raw of expanded) {
    const result = normalizeSkill(raw, options);
    if (result.normalizedValue) {
      const key = result.normalizedValue.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(result);
      }
    }
  }

  return results;
}