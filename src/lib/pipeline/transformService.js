/**
 * Transform Service — Pipeline Orchestrator
 *
 * Orchestrates the full transformation pipeline in this exact order:
 *
 *   Input
 *     ↓
 *   Extraction (Source Detection + Parsers / Extractors)
 *     ↓
 *   Normalization Engine
 *     ↓
 *   Source Aggregation
 *     ↓
 *   Conflict Resolution
 *     ↓
 *   Confidence Calculation
 *     ↓
 *   Provenance Builder
 *     ↓
 *   Canonical Profile Builder
 *     ↓
 *   Projection Engine
 *     ↓
 *   Schema Validation
 *     ↓
 *   Final Response (validated projected profile only)
 */
import { loadConfig } from '../config/configLoader.js';
import { detectSources } from './sourceDetector.js';
import { parseCSV } from '../parsers/csvParser.js';
import { parseJSON } from '../parsers/jsonParser.js';
import { extractFromGitHub } from '../extractors/githubExtractor.js';
import { extractFromLinkedIn } from '../extractors/linkedinStubExtractor.js';
import { extractFromResumePDF, extractFromResumeText } from '../extractors/resumeExtractor.js';
import { normalizeAllSources } from '../normalizers/index.js';
import { aggregateSources } from './sourceAggregator.js';
import { resolveConflicts } from './conflictResolver.js';
import { calculateAllConfidences } from './confidenceCalculator.js';
import { buildProvenance } from './provenanceBuilder.js';
import { buildCanonicalProfile } from './canonicalBuilder.js';
import { projectProfile } from '../projection/projectionEngine.js';
import { validateOutput } from '../validators/schemaValidator.js';

export async function transformCandidate(inputs) {
  const {
    structuredFile,
    structuredFileName,
    sourceType,
    sourceUrl,
    pdfFile,
    githubToken,
    config: rawConfig,
    onProgress = () => {},
  } = inputs;

  const pipelineLog = [];

  const log = (stage, message, data, level) => {
    const entry = { stage, message, data, level: level || 'info', timestamp: new Date().toISOString() };
    pipelineLog.push(entry);
    onProgress(entry);
  };

  // Stage 1: Config Loading
  log('config', 'Loading runtime configuration...');
  const config = loadConfig(rawConfig);
  log('config', 'Configuration loaded', { sourcePriority: config.sourcePriority });

  // Stage 2: Source Detection
  log('source_detection', 'Detecting input sources...');
  const detectedSources = detectSources({ structuredFile, structuredFileName, sourceType, sourceUrl, pdfFile });
  log('source_detection', `Detected ${detectedSources.length} sources`, detectedSources.map(s => s.type));

  // Stage 3: Extraction (parallel)
  log('extraction', 'Extracting data from all sources in parallel...');
  const extractionPromises = [];

  for (const source of detectedSources) {
    if (source.type === 'structured' && source.subtype === 'csv') {
      extractionPromises.push(
        Promise.resolve().then(() => parseCSV(source.file, source.fileName))
      );
    } else if (source.type === 'structured' && source.subtype === 'json') {
      extractionPromises.push(
        Promise.resolve().then(() => parseJSON(source.file, source.fileName))
      );
    } else if (source.type === 'github') {
      extractionPromises.push(
        extractFromGitHub(source.url, githubToken)
      );
    } else if (source.type === 'linkedin') {
      extractionPromises.push(
        Promise.resolve().then(() => extractFromLinkedIn(source.url))
      );
    } else if (source.type === 'resume') {
      if (source.file instanceof File) {
        extractionPromises.push(
          extractFromResumePDF(source.file)
        );
      } else if (typeof source.file === 'string') {
        extractionPromises.push(
          Promise.resolve().then(() => extractFromResumeText(source.file))
        );
      }
    }
  }

  const settledResults = await Promise.allSettled(extractionPromises);
  const rawSourcePayloads = [];
  const extractionWarnings = [];

  settledResults.forEach((result, idx) => {
    const srcType = detectedSources[idx]?.type;
    if (result.status === 'fulfilled') {
      rawSourcePayloads.push(result.value);
      log('extraction', `Successfully extracted from ${result.value.sourceName}`);
    } else {
      extractionWarnings.push({
        source: srcType,
        error: result.reason?.message || String(result.reason),
      });
      log('extraction', `Failed to extract from ${srcType}: ${result.reason?.message || result.reason}`, null, 'warning');
    }
  });

  if (rawSourcePayloads.length === 0) {
    throw new Error('All source extractors failed. No data to process.');
  }

  // Stage 4: Normalization
  log('normalization', 'Normalizing all extracted fields...');
  const normalizedSources = normalizeAllSources(rawSourcePayloads, config.normalization);
  log('normalization', `Normalized ${normalizedSources.length} source payloads`);

  // Stage 5: Source Aggregation
  log('aggregation', 'Aggregating sources (Profile Merge Engine)...');
  const aggregated = aggregateSources(normalizedSources);
  log('aggregation', 'Sources aggregated', {
    scalarFields: Object.keys(aggregated.scalarFields).length,
    arrayFields: Object.keys(aggregated.arrayFields).length,
  });

  // Stage 6: Conflict Resolution
  log('conflict_resolution', 'Resolving field conflicts using configured source priority...');
  const resolvedProfile = resolveConflicts(aggregated, config);
  log('conflict_resolution', 'Conflicts resolved');

  // Stage 7: Confidence Calculation
  log('confidence', 'Calculating per-field confidence scores...');
  const { fieldConfidence, overallConfidence } = calculateAllConfidences(resolvedProfile);
  log('confidence', 'Confidence calculated', { overallConfidence });

  // Stage 8: Provenance Building
  log('provenance', 'Building provenance metadata...');
  const provenanceMap = buildProvenance(resolvedProfile, normalizedSources, fieldConfidence);
  log('provenance', 'Provenance built');

  // Stage 9: Canonical Profile Building
  log('canonical_builder', 'Building canonical profile...');
  const sources = aggregated.sources;
  const canonicalProfile = buildCanonicalProfile(resolvedProfile, fieldConfidence, overallConfidence, provenanceMap, sources);
  log('canonical_builder', 'Canonical profile built', { candidateId: canonicalProfile.candidateId });

  // Stage 10: Projection Engine
  log('projection', 'Applying projection engine...');
  const projectedOutput = projectProfile(canonicalProfile, config.projection, config.missingValueStrategy);
  log('projection', 'Projection applied', { fields: Object.keys(projectedOutput) });

  // Stage 11: Schema Validation (validate the projected output only)
  log('validation', 'Validating projected output against schema...');
  const validationResult = validateOutput(projectedOutput);
  if (!validationResult.valid) {
    log('validation', `Validation failed with ${validationResult.errors.length} errors`, validationResult.errors, 'error');
    return {
      success: false,
      errors: validationResult.errors,
      pipelineLog,
      extractionWarnings,
    };
  }
  log('validation', 'Projected output validated successfully');

  // Stage 12: Final Response — return ONLY the validated projected profile
  log('complete', 'Transformation pipeline complete');
  return {
    success: true,
    output: validationResult.data,
    pipelineLog,
    extractionWarnings,
  };
}