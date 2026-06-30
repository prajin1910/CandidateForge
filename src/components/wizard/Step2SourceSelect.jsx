import React from 'react';
import { Github, Linkedin, FileText } from 'lucide-react';

const SOURCES = [
  {
    id: 'github',
    label: 'GitHub Profile',
    description: 'Extract data via GitHub REST API — profile, repos, languages, topics, and organizations.',
    icon: Github,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn URL',
    description: 'Stub extractor — returns a placeholder. LinkedIn scraping requires authenticated access.',
    icon: Linkedin,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  {
    id: 'pdf',
    label: 'Resume PDF',
    description: 'Upload a PDF resume. Text is extracted and parsed into structured candidate fields.',
    icon: FileText,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
];

export default function Step2SourceSelect({ data, update }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Select Unstructured Source</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose one unstructured source to complement your structured file.
        </p>
      </div>

      <div className="grid gap-3">
        {SOURCES.map((source) => {
          const isSelected = data.sourceType === source.id;
          const Icon = source.icon;
          return (
            <button
              key={source.id}
              onClick={() => update({ sourceType: source.id })}
              className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                isSelected
                  ? `${source.border} ${source.bg} scale-[1.01]`
                  : 'border-border bg-card hover:border-border/80 hover:bg-muted/20'
              }`}
            >
              <div className={`rounded-lg ${source.bg} p-2.5 flex-shrink-0`}>
                <Icon className={`h-6 w-6 ${source.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{source.label}</h3>
                  {isSelected && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
              </div>
              <div
                className={`mt-1 h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                  isSelected ? 'border-primary bg-primary' : 'border-border'
                }`}
              >
                {isSelected && (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}