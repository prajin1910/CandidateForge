import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Wand2 } from 'lucide-react';
import WizardStepper from '@/components/wizard/WizardStepper';
import Step1Structured from '@/components/wizard/Step1Structured';
import Step2SourceSelect from '@/components/wizard/Step2SourceSelect';
import Step3SourceInput from '@/components/wizard/Step3SourceInput';
import Step4Config from '@/components/wizard/Step4Config';
import Step5Transform from '@/components/wizard/Step5Transform';
import OutputPanel from '@/components/output/OutputPanel';
import { useTransform } from '@/hooks/useTransform';
import { DEFAULT_CONFIG } from '@/lib/config/defaultConfig';
import { SAMPLE_CSV, SAMPLE_GITHUB_URL, SAMPLE_CONFIG } from '@/lib/sampleData';

export default function TransformPage() {
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    fileContent: null,
    fileName: null,
    sourceType: 'github',
    sourceUrl: '',
    githubToken: '',
    pdfFile: null,
    pdfFileName: null,
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
  });

  const { status, result, error, pipelineLog, transform, reset } = useTransform();

  const update = useCallback((partial) => {
    setWizardData(prev => ({ ...prev, ...partial }));
  }, []);

  const canProceed = () => {
    switch (step) {
      case 1: return !!wizardData.fileContent;
      case 2: return !!wizardData.sourceType;
      case 3:
        if (wizardData.sourceType === 'pdf') return !!wizardData.pdfFile;
        return !!wizardData.sourceUrl;
      case 4: return true;
      default: return true;
    }
  };

  const handleTransform = async () => {
    await transform({
      structuredFile: wizardData.fileContent,
      structuredFileName: wizardData.fileName,
      sourceType: wizardData.sourceType,
      sourceUrl: wizardData.sourceUrl,
      pdfFile: wizardData.pdfFile,
      githubToken: wizardData.githubToken || undefined,
      config: wizardData.config,
    });
    setStep(6);
  };

  const handleRestart = () => {
    reset();
    setStep(1);
  };

  const loadSampleData = () => {
    setWizardData(prev => ({
      ...prev,
      fileContent: SAMPLE_CSV,
      fileName: 'sample_candidate.csv',
      sourceType: 'github',
      sourceUrl: SAMPLE_GITHUB_URL,
      config: JSON.parse(JSON.stringify(SAMPLE_CONFIG)),
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">CandidateForge</h1>
              <p className="text-xs text-muted-foreground">Multi-Source Candidate Data Transformer</p>
            </div>
          </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadSampleData}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Load Sample Data
              </button>
              <a
                href="/validation"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                Validation Tests
              </a>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {step < 6 && (
          <>
            {/* Wizard Stepper */}
            <div className="mb-8 px-2">
              <WizardStepper currentStep={step} onStepClick={(s) => { if (s < step) setStep(s); }} />
            </div>

            {/* Wizard Content */}
            <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 1 && <Step1Structured data={wizardData} update={update} />}
                  {step === 2 && <Step2SourceSelect data={wizardData} update={update} />}
                  {step === 3 && <Step3SourceInput data={wizardData} update={update} />}
                  {step === 4 && <Step4Config data={wizardData} update={update} />}
                  {step === 5 && (
                    <Step5Transform
                      data={wizardData}
                      onTransform={handleTransform}
                      status={status}
                      pipelineLog={pipelineLog}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {step < 5 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <button
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    onClick={() => setStep(s => Math.min(5, s + 1))}
                    disabled={!canProceed()}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {step === 5 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <button
                    onClick={() => setStep(4)}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 6: Output */}
        {step === 6 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OutputPanel
              result={result}
              error={error}
              status={status}
              onRestart={handleRestart}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}