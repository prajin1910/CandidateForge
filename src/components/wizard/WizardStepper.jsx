import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Structured Source', short: 'Upload' },
  { id: 2, label: 'Unstructured Source', short: 'Select' },
  { id: 3, label: 'Source Details', short: 'Details' },
  { id: 4, label: 'Runtime Config', short: 'Configure' },
  { id: 5, label: 'Transform', short: 'Transform' },
  { id: 6, label: 'Canonical Profile', short: 'Output' },
];

export default function WizardStepper({ currentStep, onStepClick }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div
              className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
              onClick={() => onStepClick?.(step.id)}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  currentStep > step.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : currentStep === step.id
                    ? 'border-primary bg-primary/10 text-primary scale-110'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.short}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-300 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}