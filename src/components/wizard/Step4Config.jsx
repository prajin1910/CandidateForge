import React from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';

const SOURCE_LABELS = {
  structured: { label: 'Structured File', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  github: { label: 'GitHub', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  resume: { label: 'Resume PDF', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  linkedin: { label: 'LinkedIn', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
};

export default function Step4Config({ data, update }) {
  const { config } = data;

  const updateConfig = (partial) => {
    update({ config: { ...config, ...partial } });
  };

  const movePriority = (idx, dir) => {
    const newPriority = [...config.sourcePriority];
    const target = idx + dir;
    if (target < 0 || target >= newPriority.length) return;
    [newPriority[idx], newPriority[target]] = [newPriority[target], newPriority[idx]];
    updateConfig({ sourcePriority: newPriority });
  };

  const addProjectionField = () => {
    updateConfig({
      projection: {
        ...config.projection,
        fields: [...config.projection.fields, { from: '', to: '', default: '' }],
      },
    });
  };

  const updateProjectionField = (idx, key, value) => {
    const newFields = [...config.projection.fields];
    newFields[idx] = { ...newFields[idx], [key]: value };
    updateConfig({ projection: { ...config.projection, fields: newFields } });
  };

  const removeProjectionField = (idx) => {
    updateConfig({
      projection: {
        ...config.projection,
        fields: config.projection.fields.filter((_, i) => i !== idx),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Configure Runtime Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure source priority, output projection, normalization, and missing value handling.
        </p>
      </div>

      {/* Source Priority */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Source Priority</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Reorder sources. Higher sources take precedence when resolving field conflicts.
        </p>
        <div className="space-y-2">
          {config.sourcePriority.map((source, idx) => {
            const meta = SOURCE_LABELS[source] || { label: source, color: 'bg-muted text-muted-foreground border-border' };
            return (
              <div key={source} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-5">{idx + 1}.</span>
                <span className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${meta.color}`}>
                  {meta.label}
                </span>
                <button
                  onClick={() => movePriority(idx, -1)}
                  disabled={idx === 0}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => movePriority(idx, 1)}
                  disabled={idx === config.sourcePriority.length - 1}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projection Engine */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Projection Engine</h3>
          </div>
          <button
            onClick={addProjectionField}
            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3 w-3" /> Add Field
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Map canonical fields to output fields. Supports dot notation, array indices (e.g. <code className="font-mono text-primary">emails[0]</code>), and default values.
        </p>
        <div className="space-y-2">
          {config.projection.fields.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-2">No projection fields — full canonical profile will be returned.</p>
          )}
          {config.projection.fields.map((field, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
              <input
                type="text"
                value={field.from}
                onChange={(e) => updateProjectionField(idx, 'from', e.target.value)}
                placeholder="from (e.g. full_name)"
                className="col-span-4 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <span className="col-span-1 text-center text-muted-foreground text-xs">→</span>
              <input
                type="text"
                value={field.to}
                onChange={(e) => updateProjectionField(idx, 'to', e.target.value)}
                placeholder="to (e.g. candidate_name)"
                className="col-span-4 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <input
                type="text"
                value={field.default ?? ''}
                onChange={(e) => updateProjectionField(idx, 'default', e.target.value)}
                placeholder="default"
                className="col-span-3 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <button
                onClick={() => removeProjectionField(idx)}
                className="col-span-12 sm:col-span-1 sm:col-start-12 flex justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Normalization Toggles */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Normalization</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Phone Format</label>
            <select
              value={config.normalization.phoneFormat}
              onChange={(e) => updateConfig({ normalization: { ...config.normalization, phoneFormat: e.target.value } })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="E164">E.164 (+14155550192)</option>
              <option value="NATIONAL">National (415 555 0192)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Date Format</label>
            <select
              value={config.normalization.dateFormat}
              onChange={(e) => updateConfig({ normalization: { ...config.normalization, dateFormat: e.target.value } })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="ISO">ISO 8601 (2024-01-15)</option>
              <option value="US">US (01/15/2024)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Skill Canonicalization</label>
            <button
              onClick={() => updateConfig({ normalization: { ...config.normalization, skillCanonicalization: !config.normalization.skillCanonicalization } })}
              className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                config.normalization.skillCanonicalization
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              <span>{config.normalization.skillCanonicalization ? 'Enabled' : 'Disabled'}</span>
              {config.normalization.skillCanonicalization
                ? <ToggleRight className="h-5 w-5" />
                : <ToggleLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Missing Value Strategy */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Missing Value Strategy</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'null', label: 'Null', desc: 'Set to null' },
            { value: 'omit', label: 'Omit', desc: 'Exclude field' },
            { value: 'error', label: 'Error', desc: 'Throw error' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => updateConfig({ missingValueStrategy: opt.value })}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                config.missingValueStrategy === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:border-border/80'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}