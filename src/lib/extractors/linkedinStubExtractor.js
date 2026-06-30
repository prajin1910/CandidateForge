/**
 * LinkedIn Stub Extractor
 *
 * LinkedIn scraping requires authenticated access and is intentionally not implemented.
 * This extractor returns a structured placeholder object that passes through the pipeline
 * as a low-confidence source. The architecture is extensible — a real LinkedIn extractor
 * can be added in the future without changing the pipeline.
 */
export function extractFromLinkedIn(linkedinUrl) {
  if (!linkedinUrl) {
    throw new Error('LinkedIn URL is required');
  }

  return {
    sourceType: 'linkedin',
    sourceName: `linkedin:${extractLinkedinUsername(linkedinUrl) || 'unknown'}`,
    rawFields: {
      links: [{ type: 'linkedin', url: linkedinUrl }],
      _meta: {
        status: 'Stub',
        message: 'LinkedIn extraction requires authenticated access and is intentionally not implemented.',
      },
    },
    extractedAt: new Date().toISOString(),
    extractorVersion: 'linkedinStubExtractor@1.0',
    isStub: true,
    stubMessage: 'LinkedIn extraction requires authenticated access and is intentionally not implemented.',
  };
}

function extractLinkedinUsername(url) {
  const match = url.match(/linkedin\.com\/in\/([^\/\s?]+)/);
  return match ? match[1] : null;
}