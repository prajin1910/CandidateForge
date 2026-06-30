/**
 * Resume Extractor
 *
 * Two extraction paths:
 *   1. Server-side backend (primary) — UploadFile + ExtractDataFromUploadedFile
 *   2. Client-side PDF.js fallback — extracts raw text from PDF and parses it
 *      using section-based extractFromResumeText()
 *
 * The fallback is used automatically when the server backend is not available.
 */

const RESUME_SCHEMA = {
  type: 'object',
  properties: {
    fullName: { type: 'string' },
    emails: { type: 'array', items: { type: 'string' } },
    phones: { type: 'array', items: { type: 'string' } },
    location: { type: 'string' },
    headline: { type: 'string' },
    summary: { type: 'string' },
    skills: { type: 'array', items: { type: 'string' } },
    coreSubjects: { type: 'array', items: { type: 'string' } },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          title: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          institution: { type: 'string' },
          degree: { type: 'string' },
          field: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
      },
    },
    links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
  },
};

/**
 * Extract text from a PDF file using pdfjs-dist (client-side).
 * Uses newlines between text items to better preserve document structure.
 */
async function extractTextFromPDF(pdfFile) {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Group text items by their vertical position (y-coordinate) to reconstruct lines
    const lineMap = new Map();
    for (const item of textContent.items) {
      if (!item.str || item.str.trim() === '') continue;
      // Round y to nearest integer to group items on the same line
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y).push({ x: item.transform[4], text: item.str });
    }

    // Sort lines by y (descending since PDF y increases upward) and items by x
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    const lines = sortedYs.map(y => {
      const items = lineMap.get(y).sort((a, b) => a.x - b.x);
      return items.map(i => i.text).join(' ');
    });

    pageTexts.push(lines.join('\n'));
  }

  return pageTexts.join('\n\n');
}

export async function extractFromResumePDF(pdfFile) {
  if (!pdfFile) {
    throw new Error('PDF file is required');
  }

  // Try server-side backend first, fall back to client-side extraction
  try {
    const { appClient } = await import('@/api/appClient');

    const uploadResult = await appClient.integrations.Core.UploadFile({ file: pdfFile });
    const fileUrl = uploadResult.file_url;

    const extractResult = await appClient.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: RESUME_SCHEMA,
    });

    if (extractResult.status === 'error') {
      throw new Error(`Resume extraction failed: ${extractResult.details || 'unknown error'}`);
    }

    const rawFields = Array.isArray(extractResult.output)
      ? extractResult.output[0] || {}
      : extractResult.output || {};

    return {
      sourceType: 'resume',
      sourceName: pdfFile.name || 'resume.pdf',
      rawFields,
      extractedAt: new Date().toISOString(),
      extractorVersion: 'resumeExtractor@2.0',
    };
  } catch (serverError) {
    console.warn(
      'Server backend not available for resume extraction. Using client-side PDF text extraction fallback.',
      serverError.message
    );

    try {
      const text = await extractTextFromPDF(pdfFile);

      if (!text || text.trim().length === 0) {
        throw new Error(
          'Could not extract any text from the PDF. The file may be image-based (scanned). ' +
          'Please use a text-based PDF or provide the data in CSV/JSON format.'
        );
      }

      const result = extractFromResumeText(text);
      return {
        ...result,
        sourceName: pdfFile.name || 'resume.pdf',
        extractorVersion: 'resumeExtractor@2.0-pdfjs',
      };
    } catch (pdfError) {
      throw new Error(
        `Resume extraction failed: ${pdfError.message}. ` +
        'Tip: Make sure the PDF contains selectable text (not a scanned image).'
      );
    }
  }
}


// ============================================================================
//  SECTION-BASED RESUME TEXT PARSER
// ============================================================================

/**
 * Known section headers — used to split the resume into logical sections.
 * Order matters: more specific patterns first.
 */
const SECTION_PATTERNS = [
  { name: 'contact',       pattern: /^(?:contact\s*(?:info(?:rmation)?)?|personal\s*(?:info(?:rmation)?|details))\s*$/i },
  { name: 'summary',       pattern: /^(?:summary|about\s*me|profile|objective|professional\s*summary|career\s*objective|overview)\s*$/i },
  { name: 'experience',    pattern: /^(?:experience|work\s*experience|professional\s*experience|employment|work\s*history|employment\s*history)\s*$/i },
  { name: 'education',     pattern: /^(?:education|academic|qualifications|academic\s*(?:background|qualifications))\s*$/i },
  { name: 'skills',        pattern: /^(?:skills|technical\s*skills|core\s*(?:competencies|skills)|technologies|tech\s*stack|expertise|tools\s*(?:&|and)\s*technologies)\s*$/i },
  { name: 'projects',      pattern: /^(?:projects|personal\s*projects|key\s*projects|academic\s*projects|notable\s*projects)\s*$/i },
  { name: 'certifications', pattern: /^(?:certifications?|licenses?\s*(?:&|and)\s*certifications?|awards?\s*(?:&|and)\s*certifications?|achievements?)\s*$/i },
  { name: 'awards',        pattern: /^(?:awards?|honors?|achievements?|accomplishments?)\s*$/i },
  { name: 'languages',     pattern: /^(?:languages|spoken\s*languages)\s*$/i },
  { name: 'interests',     pattern: /^(?:interests|hobbies|hobbies\s*(?:&|and)\s*interests)\s*$/i },
  { name: 'references',    pattern: /^(?:references?)\s*$/i },
];

/**
 * Detect if a line is a section header.
 * Heuristic: short line (<60 chars), matches a known section pattern,
 * often ALL CAPS or Title Case, sometimes followed by a separator line.
 */
function detectSectionHeader(line) {
  const trimmed = line.trim();
  // Remove common separators/decorators
  const cleaned = trimmed.replace(/^[\-=_*#|►▸●•]+\s*/, '').replace(/\s*[\-=_*#|►▸●•]+$/, '').trim();
  if (cleaned.length === 0 || cleaned.length > 60) return null;

  for (const { name, pattern } of SECTION_PATTERNS) {
    if (pattern.test(cleaned)) {
      return name;
    }
  }
  return null;
}

/**
 * Split resume text into sections.
 * Returns { header: string, sections: Map<string, string> }
 * where header is everything before the first detected section.
 */
function splitIntoSections(text) {
  const lines = text.split('\n');
  const sections = new Map();
  let currentSection = null;
  let currentLines = [];
  let headerLines = [];
  let firstSectionFound = false;

  for (const line of lines) {
    const sectionName = detectSectionHeader(line);

    if (sectionName) {
      // Save previous section
      if (currentSection) {
        sections.set(currentSection, currentLines.join('\n').trim());
      }
      currentSection = sectionName;
      currentLines = [];
      firstSectionFound = true;
    } else if (firstSectionFound) {
      currentLines.push(line);
    } else {
      headerLines.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.set(currentSection, currentLines.join('\n').trim());
  }

  return {
    header: headerLines.join('\n').trim(),
    sections,
  };
}


// ============================================================================
//  FIELD EXTRACTORS — each operates only on its designated section
// ============================================================================

/**
 * Extract contact information from the header/contact block ONLY.
 */
function extractContact(headerText, contactSectionText) {
  const searchText = contactSectionText
    ? headerText + '\n' + contactSectionText
    : headerText;

  const result = {};

  // --- Email ---
  const emailMatches = searchText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g);
  if (emailMatches) {
    result.emails = [...new Set(emailMatches)];
  }

  // --- Phone ---
  const phoneMatches = searchText.match(/(?:\+?\d{1,3}[\s.\-]?)?\(?\d{2,5}\)?[\s.\-]?\d{3,5}[\s.\-]?\d{3,5}/g);
  if (phoneMatches) {
    const validPhones = phoneMatches
      .map(p => p.trim())
      .filter(p => p.replace(/\D/g, '').length >= 10);
    if (validPhones.length > 0) {
      result.phones = [...new Set(validPhones)];
    }
  }

  // --- Links ---
  const links = [];

  const githubMatches = searchText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-]+/gi);
  if (githubMatches) {
    const url = githubMatches[0].startsWith('http') ? githubMatches[0] : `https://${githubMatches[0]}`;
    links.push({ type: 'github', url });
  }

  const linkedinMatches = searchText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-]+/gi);
  if (linkedinMatches) {
    const url = linkedinMatches[0].startsWith('http') ? linkedinMatches[0] : `https://${linkedinMatches[0]}`;
    links.push({ type: 'linkedin', url });
  }

  const websiteMatches = searchText.match(/(?:website|portfolio|blog)[:\s]+(https?:\/\/[^\s]+)/i);
  if (websiteMatches) {
    links.push({ type: 'website', url: websiteMatches[1] });
  }

  if (links.length > 0) {
    result.links = links;
  }

  // --- Location (from header/contact only) ---
  const locationPatterns = [
    // Explicit label: "Location: Chennai, Tamil Nadu"
    /(?:location|address|city|based\s*in|residing\s*in)[:\s]+([^\n|]+)/i,
    // "Chennai, Tamil Nadu, India" or "Chennai, TN"
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Za-z\s]+?)(?:,\s*([A-Za-z\s]+))?\s*$/m,
  ];

  // Search only the header for location — NOT the full document
  const headerLines = searchText.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of headerLines) {
    // Skip lines that look like emails, URLs, or section headers
    if (line.includes('@') || line.includes('http') || line.includes('github.com') || line.includes('linkedin.com')) continue;
    if (detectSectionHeader(line)) continue;

    // Try explicit location label
    const labelMatch = line.match(locationPatterns[0]);
    if (labelMatch) {
      result.location = labelMatch[1].trim();
      break;
    }

    // Try "City, State" or "City, State, Country" patterns
    // Only in lines that don't have too many commas (skill lists have many)
    const commaCount = (line.match(/,/g) || []).length;
    if (commaCount >= 1 && commaCount <= 3) {
      const geoMatch = line.match(locationPatterns[1]);
      if (geoMatch) {
        // Verify it looks like a location — not a list of skills
        const candidate = geoMatch[0];
        if (!looksLikeSkillList(candidate)) {
          result.location = candidate.trim();
          break;
        }
      }
    }
  }

  // --- Full Name (first substantial non-header, non-contact line) ---
  const skipWords = ['resume', 'curriculum', 'vitae', 'cv', 'contact', 'phone', 'email', 'address', 'location'];
  for (const line of headerLines) {
    const lower = line.toLowerCase();
    if (skipWords.some(w => lower === w)) continue;
    if (line.includes('@') || line.includes('http') || line.match(/^\+?\d[\d\s.\-()]{8,}/)) continue;
    if (detectSectionHeader(line)) continue;

    // A name line: 1–5 words, mostly letters, no colons (which indicate labels)
    const words = line.split(/\s+/);
    if (words.length >= 1 && words.length <= 6 && /^[A-Za-z\s.'\-]+$/.test(line) && !line.includes(':')) {
      result.fullName = line;
      break;
    }
  }

  // --- Headline (line after name in header) ---
  if (result.fullName) {
    const nameIdx = headerLines.indexOf(result.fullName);
    if (nameIdx >= 0 && nameIdx + 1 < headerLines.length) {
      const nextLine = headerLines[nameIdx + 1];
      // Headline: no email, no phone, no URL, no colon labels, reasonable length
      if (!nextLine.includes('@') && !nextLine.match(/^\+?\d/) && !nextLine.includes('http') &&
          nextLine.length < 100 && nextLine.length > 2 && !detectSectionHeader(nextLine)) {
        result.headline = nextLine;
      }
    }
  }

  return result;
}

/**
 * Check if a string looks like a skill list rather than a location.
 */
function looksLikeSkillList(text) {
  const techKeywords = /\b(?:java|python|react|node|angular|spring|sql|mongodb|html|css|javascript|typescript|docker|aws|git|api|boot|express|flask|django)\b/i;
  const labelKeywords = /\b(?:languages?|backend|frontend|databases?|tools?|frameworks?|cloud|devops)\b/i;
  return techKeywords.test(text) || labelKeywords.test(text);
}


/**
 * Extract skills from the skills section ONLY.
 * Handles common resume skill formats:
 *   - "Languages: Java, Python, JavaScript"
 *   - "Backend: Spring Boot, Node.js"
 *   - Bullet lists
 *   - Comma-separated lists
 */
function extractSkills(skillsText) {
  if (!skillsText) return [];

  const lines = skillsText.split('\n').map(l => l.trim()).filter(Boolean);
  const rawSkills = [];

  for (const line of lines) {
    // Skip separator lines
    if (/^[\-=_*]+$/.test(line)) continue;
    // Skip if it looks like a section header
    if (detectSectionHeader(line)) continue;

    // Remove category labels like "Languages:", "Backend:", "Cloud & DevOps:", etc.
    let cleaned = line.replace(
      /^(?:languages?|backend|frontend|full[\s-]?stack|cloud\s*(?:&|and)\s*devops|devops|databases?|tools?\s*(?:&|and)\s*technologies|tools?|frameworks?|libraries?|core|ai\s*(?:&|and)\s*ml|machine\s*learning|data\s*(?:science|engineering)|testing|version\s*control|operating\s*systems?|methodolog(?:y|ies)|others?|additional|miscellaneous|platforms?|web\s*technologies)\s*[:–—\-|]\s*/i,
      ''
    ).trim();

    if (!cleaned) continue;

    // Split on common delimiters: comma, pipe, bullet, semicolon, slash (for grouped items)
    const items = cleaned.split(/[,|;•·●▪▸►]\s*/)
      .flatMap(item => {
        // Also split on double spaces which some resumes use as delimiters
        return item.split(/\s{3,}/);
      })
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 40);

    for (const item of items) {
      // Filter out descriptive phrases (multi-word non-skill text)
      if (isDescriptivePhrase(item)) continue;
      rawSkills.push(item);
    }
  }

  // Deduplicate and classify (case-insensitive)
  const seen = new Set();
  const technicalSkills = [];
  const coreSubjects = [];
  
  // List of common computer science subjects
  const subjectKeywords = /\b(?:algorithms?|data\s*structures?|dbms|database\s*management|os|operating\s*systems?|system\s*design|computer\s*networks?|theory\s*of\s*computation|compiler\s*design|software\s*engineering|mathematics|calculus|physics|chemistry)\b/i;

  for (const skill of rawSkills) {
    const key = skill.toLowerCase().replace(/[.\s]/g, '');
    if (!seen.has(key)) {
      seen.add(key);
      if (subjectKeywords.test(skill)) {
        coreSubjects.push(skill);
      } else {
        technicalSkills.push(skill);
      }
    }
  }

  return { skills: technicalSkills, coreSubjects };
}

/**
 * Check if a string is a descriptive phrase rather than a skill name.
 * Skills are typically 1–3 words; descriptive phrases are longer with verbs/adjectives.
 */
function isDescriptivePhrase(text) {
  const words = text.split(/\s+/);
  // Allow up to 4 words for compound skills like "REST API", "Machine Learning", "Spring Boot"
  if (words.length > 4) return true;

  // Check for verb/adjective patterns that indicate descriptions, not skills
  const descriptivePatterns = /\b(?:optimized|processing|capture|scalable|efficient|building|developed|implemented|using|with|for|through|based|temperature|queries|asynchronous|experience|proficient|familiar|knowledge|understanding|excellent|strong|good)\b/i;
  if (descriptivePatterns.test(text)) return true;

  return false;
}


/**
 * Extract experience entries from the experience section.
 */
function extractExperience(experienceText) {
  if (!experienceText) return [];

  const lines = experienceText.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  let current = null;

  for (const line of lines) {
    if (/^[\-=_*]+$/.test(line)) continue;
    if (detectSectionHeader(line)) continue;

    // Try to match a date range: "Jan 2022 - Present", "2020-01 to 2022-12", "Aug 2023 – Present"
    const dateMatch = line.match(
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4}[\-/]\d{1,2}|\d{4})\s*(?:to|–|—|\-)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4}[\-/]?\d{0,2}|[Pp]resent|[Cc]urrent|[Oo]ngoing)\b/
    );

    if (dateMatch) {
      // This line likely starts or describes a new entry
      if (current) entries.push(current);

      // Extract title and company from the line (removing the date part)
      const withoutDate = line.replace(dateMatch[0], '').replace(/[|•·●]/g, '  ').trim();
      const parts = withoutDate.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);

      current = {
        title: parts[0] || null,
        company: parts[1] || null,
        startDate: dateMatch[1],
        endDate: dateMatch[2],
        description: '',
      };
    } else if (current) {
      // Check if this line is a company/title line (no date, but looks like a heading)
      if (!current.company && line.length < 80 && !line.startsWith('-') && !line.startsWith('•') && !line.startsWith('●')) {
        // Could be company name on its own line
        if (!current.title) {
          current.title = line;
        } else if (!current.company) {
          current.company = line;
        } else {
          // Accumulate description
          const bullet = line.replace(/^[\-–—•*●▸►]\s*/, '').trim();
          if (bullet) {
            current.description += (current.description ? ' ' : '') + bullet;
          }
        }
      } else {
        // Accumulate description bullets
        const bullet = line.replace(/^[\-–—•*●▸►]\s*/, '').trim();
        if (bullet) {
          current.description += (current.description ? ' ' : '') + bullet;
        }
      }
    }
  }

  if (current) entries.push(current);

  // Filter out empty entries
  return entries.filter(e => e.title || e.company);
}


/**
 * Extract education entries from the education section.
 */
function extractEducation(educationText) {
  if (!educationText) return [];

  const lines = educationText.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  let current = null;

  for (const line of lines) {
    if (/^[\-=_*]+$/.test(line)) continue;
    if (detectSectionHeader(line)) continue;

    const hasDegreeKeyword = /\b(?:B\.?(?:Tech|E|Sc|A|Com|S)|M\.?(?:Tech|E|Sc|A|Com|BA|S)|Ph\.?D|Bachelor|Master|Diploma|Associate|MBA|HSC|SSC|SSLC|Higher\s*Secondary|High\s*School|12th|10th)\b/i.test(line);
    const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/);

    if (hasDegreeKeyword || (yearMatch && line.length < 120)) {
      if (current) entries.push(current);

      const dateRangeMatch = line.match(/\b(\d{4})\s*(?:to|–|—|\-)?\s*(\d{4})?\b/);
      let cleanedLine = line;
      if (dateRangeMatch) {
        cleanedLine = cleanedLine.replace(dateRangeMatch[0], '').trim();
      }

      // Extract CGPA or Percentage
      let cgpa = null;
      let percentage = null;
      const cgpaMatch = cleanedLine.match(/\b(?:CGPA|GPA|Score)?\s*[:\-]?\s*([1-9]\.\d{1,2}|10\.0)\b/i);
      const percMatch = cleanedLine.match(/\b(?:Percentage|Score)?\s*[:\-]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*%\b/i);
      
      if (cgpaMatch) {
        cgpa = parseFloat(cgpaMatch[1]);
        cleanedLine = cleanedLine.replace(cgpaMatch[0], '').trim();
      } else if (percMatch) {
        percentage = parseFloat(percMatch[1]);
        cleanedLine = cleanedLine.replace(percMatch[0], '').trim();
      } else {
        // Sometimes just a standalone number at the end like "- 9.01" or "- 90%"
        const standalonePercMatch = cleanedLine.match(/[\-:]\s*(\d{2,3}(?:\.\d{1,2})?)\s*%\s*$/);
        const standaloneCgpaMatch = cleanedLine.match(/[\-:]\s*([1-9]\.\d{1,2}|10\.0)\s*$/);
        if (standalonePercMatch) {
          percentage = parseFloat(standalonePercMatch[1]);
          cleanedLine = cleanedLine.replace(standalonePercMatch[0], '').trim();
        } else if (standaloneCgpaMatch) {
          cgpa = parseFloat(standaloneCgpaMatch[1]);
          cleanedLine = cleanedLine.replace(standaloneCgpaMatch[0], '').trim();
        }
      }

      // Split by colon, pipe, or multiple spaces
      const parts = cleanedLine
        .split(/(?:\s*:\s*|\s*\|\s*|\s{2,})/)
        .map(p => p.replace(/^[\-–—]\s*/, '').trim())
        .filter(Boolean);

      current = {
        degree: null,
        institution: null,
        startDate: dateRangeMatch?.[1] || null,
        endDate: dateRangeMatch?.[2] || dateRangeMatch?.[1] || null,
      };

      if (cgpa !== null) current.cgpa = cgpa;
      if (percentage !== null) current.percentage = percentage;

      // Assign parts
      for (const part of parts) {
        if (!current.degree && /\b(?:B\.?(?:Tech|E|Sc|A|Com|S)|M\.?(?:Tech|E|Sc|A|Com|BA|S)|Ph\.?D|Bachelor|Master|Diploma|Associate|MBA|HSC|SSC|SSLC|Higher\s*Secondary|High\s*School|12th|10th)\b/i.test(part)) {
          // If the part contains a hyphen, it might be "B.E CSE - 9.01", split it again
          const subparts = part.split(/\s*[\-–—]\s*/).filter(Boolean);
          current.degree = subparts[0];
        } else if (!current.institution) {
          current.institution = part;
        }
      }

      if (current.degree && !current.institution && parts.length > 1) {
        current.institution = parts.find(p => p !== current.degree) || null;
      }
    } else if (current && line.length > 3) {
      if (!current.institution && !detectSectionHeader(line)) {
        current.institution = line;
      }
    }
  }

  if (current) entries.push(current);
  return entries.filter(e => e.degree || e.institution);
}


/**
 * Extract summary from the summary/objective section.
 */
function extractSummary(summaryText) {
  if (!summaryText) return null;
  const cleaned = summaryText.trim();
  // Take the first paragraph
  const firstPara = cleaned.split(/\n\s*\n/)[0].trim();
  return firstPara.length > 15 ? firstPara : null;
}


// ============================================================================
//  MAIN ENTRY POINT
// ============================================================================

/**
 * Extract structured data from resume plain text using section-based parsing.
 *
 * Algorithm:
 *   1. Split text into sections (header, skills, experience, education, etc.)
 *   2. Extract contact info ONLY from header/contact section
 *   3. Extract skills ONLY from skills section
 *   4. Extract experience ONLY from experience section
 *   5. Extract education ONLY from education section
 *   6. Never cross-contaminate sections
 */
export function extractFromResumeText(text) {
  const rawFields = {};

  // Step 1: Split into sections
  const { header, sections } = splitIntoSections(text);

  // Step 2: Extract contact info from header + contact section only
  const contactSection = sections.get('contact') || '';
  const contact = extractContact(header, contactSection);

  if (contact.fullName) rawFields.fullName = contact.fullName;
  if (contact.emails) rawFields.emails = contact.emails;
  if (contact.phones) rawFields.phones = contact.phones;
  if (contact.links) rawFields.links = contact.links;
  if (contact.location) rawFields.location = contact.location;
  if (contact.headline) rawFields.headline = contact.headline;

  // Step 3: Extract summary
  const summaryText = sections.get('summary') || '';
  const summary = extractSummary(summaryText);
  if (summary) rawFields.summary = summary;

  // Step 4: Extract skills from skills section only
  const skillsText = sections.get('skills') || '';
  const parsedSkills = extractSkills(skillsText);
  if (parsedSkills.skills.length > 0) rawFields.skills = parsedSkills.skills;
  if (parsedSkills.coreSubjects.length > 0) rawFields.coreSubjects = parsedSkills.coreSubjects;

  // Step 5: Extract experience
  const experienceText = sections.get('experience') || '';
  const experience = extractExperience(experienceText);
  if (experience.length > 0) rawFields.experience = experience;

  // Step 6: Extract education
  const educationText = sections.get('education') || '';
  const education = extractEducation(educationText);
  if (education.length > 0) rawFields.education = education;

  return {
    sourceType: 'resume',
    sourceName: 'resume.txt',
    rawFields,
    extractedAt: new Date().toISOString(),
    extractorVersion: 'resumeExtractor@2.0',
  };
}