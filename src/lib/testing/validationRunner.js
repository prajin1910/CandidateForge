import { transformCandidate } from '../pipeline/transformService.js';
import inputCandidate from '../../../tests/test-data/input_candidate.json';
import expectedOutput from '../../../tests/test-data/expected_output.json';
import { DEFAULT_CONFIG } from '../config/defaultConfig.js';

/**
 * Validates deep equality for specific keys.
 * Ignores UUIDs, timestamps, and confidence scores.
 */
function compareFields(actual, expected) {
  const diffs = [];
  const fieldsToCheck = [
    'full_name', 'primary_email', 'primary_phone', 
    'location', 'skills', 'education', 'experience', 'links'
  ];

  for (const field of fieldsToCheck) {
    const actualVal = JSON.stringify(actual[field] || null);
    const expectedVal = JSON.stringify(expected[field] || null);
    if (actualVal !== expectedVal) {
      diffs.push(`${field}: expected ${expectedVal}, got ${actualVal}`);
    }
  }

  return diffs;
}

/**
 * Runs a single test case.
 */
async function runTest(name, input, expectedFn, mockFetchData = null) {
  const originalFetch = window.fetch;
  
  try {
    if (mockFetchData) {
      window.fetch = async (url) => {
        if (url.includes('api.github.com/users/')) {
          if (mockFetchData.githubUser === 'error') {
            return { ok: false, status: 404, json: async () => ({ message: 'Not Found' }) };
          }
          return { ok: true, json: async () => mockFetchData.githubUser };
        }
        if (url.includes('/repos')) {
          return { ok: true, json: async () => mockFetchData.githubRepos || [] };
        }
        return originalFetch(url);
      };
    }

    const start = Date.now();
    const result = await transformCandidate(input);
    const end = Date.now();

    const expectedValidation = expectedFn(result);

    return {
      name,
      status: expectedValidation.passed ? 'PASS' : 'FAIL',
      inputSummary: input.summaryDesc || 'Custom Input',
      expectedResult: expectedValidation.expectedDesc,
      actualResult: expectedValidation.actualDesc,
      duration: end - start,
      error: expectedValidation.error || null,
    };
  } catch (err) {
    return {
      name,
      status: 'FAIL',
      inputSummary: input.summaryDesc || 'Custom Input',
      expectedResult: 'Pipeline succeeds',
      actualResult: `Pipeline crashed: ${err.message}`,
      duration: 0,
      error: err.stack,
    };
  } finally {
    window.fetch = originalFetch;
  }
}

/**
 * Executes all validation tests sequentially.
 */
export async function runValidationTests() {
  const results = [];

  // 1. Gold Profile Test
  results.push(await runTest(
    'Gold Profile Comparison',
    {
      structuredFile: JSON.stringify(inputCandidate),
      structuredFileName: 'input_candidate.json',
      sourceType: 'json',
      sourceUrl: '',
      pdfFile: null,
      githubToken: '',
      config: DEFAULT_CONFIG,
      summaryDesc: 'input_candidate.json',
    },
    (result) => {
      const diffs = compareFields(result.output, expectedOutput);
      if (diffs.length === 0) {
        return {
          passed: true,
          expectedDesc: 'Exact match with expected_output.json',
          actualDesc: 'Matched successfully',
        };
      }
      return {
        passed: false,
        expectedDesc: 'Exact match with expected_output.json',
        actualDesc: 'Mismatched fields',
        error: diffs.join('\n'),
      };
    }
  ));

  // 2. Edge Case 1: Invalid GitHub URL
  results.push(await runTest(
    'Edge Case 1: Invalid GitHub URL',
    {
      structuredFile: JSON.stringify({ ...inputCandidate, links: [{ type: 'github', url: 'https://github.com/invalid-user-12345' }] }),
      structuredFileName: 'invalid_gh.json',
      sourceType: 'json',
      sourceUrl: '',
      pdfFile: null,
      githubToken: 'fake-token',
      config: DEFAULT_CONFIG,
      summaryDesc: 'Invalid GitHub URL in links',
    },
    (result) => {
      const hasGithub = Object.values(result.output.provenance || {}).some(p => p.source === 'github');
      if (!hasGithub && result.output.full_name) {
        return { passed: true, expectedDesc: 'Skip GitHub, pipeline continues', actualDesc: 'GitHub skipped, profile built' };
      }
      return { passed: false, expectedDesc: 'Skip GitHub, pipeline continues', actualDesc: hasGithub ? 'GitHub was not skipped' : 'Pipeline failed to build profile' };
    },
    { githubUser: 'error' }
  ));

  // 3. Edge Case 2: Empty Resume
  results.push(await runTest(
    'Edge Case 2: Empty Resume',
    {
      structuredFile: JSON.stringify(inputCandidate),
      structuredFileName: 'empty_resume.json',
      sourceType: 'json',
      sourceUrl: '',
      pdfFile: new File([''], 'empty.pdf', { type: 'application/pdf' }),
      githubToken: '',
      config: DEFAULT_CONFIG,
      summaryDesc: 'Empty PDF file',
    },
    (result) => {
      const hasResume = Object.values(result.output.provenance || {}).some(p => p.source === 'resume');
      if (result.output.full_name) {
        return { passed: true, expectedDesc: 'Pipeline ignores empty resume and continues', actualDesc: 'Profile built successfully' };
      }
      return { passed: false, expectedDesc: 'Pipeline ignores empty resume and continues', actualDesc: 'Pipeline failed' };
    }
  ));

  // 4. Edge Case 3: Duplicate Skills
  results.push(await runTest(
    'Edge Case 3: Duplicate Skills',
    {
      structuredFile: JSON.stringify({ ...inputCandidate, skills: ['Java', 'JAVA', 'java', 'ReactJS', 'React'] }),
      structuredFileName: 'duplicate_skills.json',
      sourceType: 'json',
      sourceUrl: '',
      pdfFile: null,
      githubToken: '',
      config: DEFAULT_CONFIG,
      summaryDesc: 'Skills: ["Java", "JAVA", "java", "ReactJS", "React"]',
    },
    (result) => {
      const skills = result.output.skills || [];
      const countJava = skills.filter(s => s.toLowerCase() === 'java').length;
      if (countJava === 1 && skills.some(s => s.toLowerCase() === 'react')) {
        return { passed: true, expectedDesc: 'Unique canonical skills only (java, react)', actualDesc: `Extracted: ${skills.join(', ')}` };
      }
      return { passed: false, expectedDesc: 'Unique canonical skills only', actualDesc: `Duplicates found: ${skills.join(', ')}` };
    }
  ));

  // 5. Edge Case 4: Missing Phone Number
  const noPhoneInput = { ...inputCandidate };
  delete noPhoneInput.phones;
  results.push(await runTest(
    'Edge Case 4: Missing Phone Number',
    {
      structuredFile: JSON.stringify(noPhoneInput),
      structuredFileName: 'no_phone.json',
      sourceType: 'json',
      sourceUrl: '',
      pdfFile: null,
      githubToken: '',
      config: DEFAULT_CONFIG,
      summaryDesc: 'Structured data without phone number',
    },
    (result) => {
      if (result.output.primary_phone === null) {
        return { passed: true, expectedDesc: 'primary_phone is null, pipeline continues', actualDesc: 'primary_phone is null' };
      }
      return { passed: false, expectedDesc: 'primary_phone is null', actualDesc: `primary_phone is ${result.output.primary_phone}` };
    }
  ));

  // 6. Edge Case 5: Conflicting Headlines
  results.push(await runTest(
    'Edge Case 5: Conflicting Headlines',
    {
      structuredFile: JSON.stringify({ ...inputCandidate, headline: 'Associate Software Engineer' }),
      structuredFileName: 'conflict.json',
      sourceType: 'json',
      sourceUrl: '',
      pdfFile: null,
      githubToken: 'fake-token',
      config: DEFAULT_CONFIG,
      summaryDesc: 'Structured: Associate SWE, GitHub: Backend Developer',
    },
    (result) => {
      const headline = result.output.headline;
      const headlineProvenance = result.output.provenance?.['headline'];
      if (headline === 'Associate Software Engineer' && headlineProvenance && headlineProvenance.source === 'structured') {
        return { passed: true, expectedDesc: 'Select structured value (source priority)', actualDesc: 'Selected structured value' };
      }
      return { passed: false, expectedDesc: 'Select structured value (source priority)', actualDesc: `Selected ${headline} from ${headlineProvenance?.source}` };
    },
    { githubUser: { bio: 'Backend Developer', login: 'Prajin-2001' } }
  ));

  return results;
}
