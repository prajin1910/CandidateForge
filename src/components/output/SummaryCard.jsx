import React from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Code2, Building2, GraduationCap, Link2, CheckCircle2, XCircle } from 'lucide-react';
import SourceBadge from './SourceBadge';

/**
 * Renders a human-readable summary card of the validated candidate profile,
 * highlighting key fields, data quality, and areas needing attention.
 */
export default function SummaryCard({ output, sources, fieldConfidence }) {
  const skills = Array.isArray(output.skills) ? output.skills : [];
  const experience = Array.isArray(output.experience) ? output.experience : [];
  const education = Array.isArray(output.education) ? output.education : [];
  const links = Array.isArray(output.links) ? output.links : [];
  const location = output.location || {};
  const locationStr = [location.city, location.state, location.country].filter(Boolean).join(', ') || location.raw;

  const lowConfidenceFields = Object.entries(fieldConfidence)
    .filter(([, v]) => v < 0.5)
    .map(([k]) => k);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 flex-shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">
              {output.candidate_name || output.full_name || output.fullName || 'Unnamed Candidate'}
            </h2>
            {output.headline && (
              <p className="text-sm text-muted-foreground mt-0.5">{output.headline}</p>
            )}
            <p className="text-xs text-muted-foreground/60 font-mono mt-1">
              ID: {output.candidate_id?.slice(0, 8) || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {sources.map((src, idx) => (
            <SourceBadge key={idx} source={src.sourceType} isStub={src.isStub} />
          ))}
        </div>
      </div>

      {/* Contact & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryRow icon={Mail} label="Primary Email" value={output.primary_email} />
        <SummaryRow icon={Phone} label="Primary Phone" value={output.primary_phone} />
        <SummaryRow icon={MapPin} label="Location" value={locationStr} />
        <SummaryRow icon={Briefcase} label="Headline" value={output.headline} />
      </div>

      {/* Skills */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Skills</span>
          <span className="text-xs text-muted-foreground">({skills.length})</span>
        </div>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span key={idx} className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <EmptyField label="No skills extracted" />
        )}
      </div>

      {/* Experience & Education */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Experience</span>
            <span className="text-xs text-muted-foreground">({experience.length})</span>
          </div>
          {experience.length > 0 ? (
            <div className="space-y-1">
              {experience.slice(0, 3).map((exp, idx) => (
                <p key={idx} className="text-xs text-muted-foreground truncate">
                  {exp.title || exp.role}{exp.company ? ` · ${exp.company}` : ''}
                </p>
              ))}
              {experience.length > 3 && (
                <p className="text-xs text-muted-foreground/60">+{experience.length - 3} more</p>
              )}
            </div>
          ) : (
            <EmptyField label="No experience" />
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Education</span>
            <span className="text-xs text-muted-foreground">({education.length})</span>
          </div>
          {education.length > 0 ? (
            <div className="space-y-1">
              {education.map((edu, idx) => (
                <p key={idx} className="text-xs text-muted-foreground truncate">
                  {edu.degree || edu.qualification}{edu.institution ? ` · ${edu.institution}` : ''}
                </p>
              ))}
            </div>
          ) : (
            <EmptyField label="No education" />
          )}
        </div>
      </div>

      {/* Links */}
      {links.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Links</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-mono text-primary hover:bg-muted transition-colors truncate max-w-xs"
              >
                {link.type ? `${link.type}: ` : ''}{link.url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Data Quality Notice */}
      {lowConfidenceFields.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <XCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-amber-300">Fields needing attention</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lowConfidenceFields.join(', ')} — these fields have low confidence and should be verified manually.
            </p>
          </div>
        </div>
      )}

      {/* Validation badge */}
      <div className="flex items-center gap-2 pt-1">
        <CheckCircle2 className="h-4 w-4 text-green-400" />
        <span className="text-xs text-muted-foreground">
          Profile has passed schema validation and is ready for use.
        </span>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }) {
  const hasValue = value && value !== 'null';
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-sm truncate ${hasValue ? 'text-foreground' : 'text-muted-foreground/50 italic'}`}>
          {hasValue ? value : 'Not available'}
        </p>
      </div>
    </div>
  );
}

function EmptyField({ label }) {
  return <p className="text-xs text-muted-foreground/50 italic">{label}</p>;
}