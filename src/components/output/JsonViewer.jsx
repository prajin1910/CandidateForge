import React, { useState } from 'react';

/**
 * JsonViewer — syntax-highlighted JSON viewer.
 * Keys: primary (indigo), strings: green, numbers: amber, booleans: purple, null: muted.
 */
export default function JsonViewer({ data, provenanceMap, depth = 0 }) {
  return (
    <div className="font-mono text-sm scrollbar-thin overflow-auto">
      <JsonNode
        data={data}
        name={null}
        provenanceMap={provenanceMap}
        depth={depth}
        isLast={true}
      />
    </div>
  );
}

function JsonNode({ data, name, provenanceMap, depth, isLast }) {
  const hasProvenance = name && provenanceMap && provenanceMap[name];
  const provenance = hasProvenance ? provenanceMap[name] : null;

  if (data === null) {
    return (
      <ProvenanceWrapper name={name} provenance={provenance}>
        <span className="text-muted-foreground italic">null</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </ProvenanceWrapper>
    );
  }

  if (typeof data === 'string') {
    return (
      <ProvenanceWrapper name={name} provenance={provenance}>
        <span className="text-green-400">"{data}"</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </ProvenanceWrapper>
    );
  }

  if (typeof data === 'number') {
    return (
      <ProvenanceWrapper name={name} provenance={provenance}>
        <span className="text-amber-400">{data}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </ProvenanceWrapper>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <ProvenanceWrapper name={name} provenance={provenance}>
        <span className="text-purple-400">{String(data)}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </ProvenanceWrapper>
    );
  }

  if (Array.isArray(data)) {
    return (
      <ProvenanceWrapper name={name} provenance={provenance}>
        <div className="inline">
          <span className="text-muted-foreground">[</span>
        </div>
        <div className="ml-4 border-l border-border/30 pl-2">
          {data.map((item, idx) => (
            <div key={idx}>
              <JsonNode
                data={item}
                name={null}
                provenanceMap={null}
                depth={depth + 1}
                isLast={idx === data.length - 1}
              />
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">]</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </ProvenanceWrapper>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return (
      <ProvenanceWrapper name={name} provenance={provenance}>
        <div className="inline">
          <span className="text-muted-foreground">{'{'}</span>
        </div>
        <div className="ml-4 border-l border-border/30 pl-2">
          {keys.map((key, idx) => (
            <div key={key}>
              <span className="text-primary">"{key}"</span>
              <span className="text-muted-foreground">: </span>
              <JsonNode
                data={data[key]}
                name={key}
                provenanceMap={provenanceMap}
                depth={depth + 1}
                isLast={idx === keys.length - 1}
              />
            </div>
          ))}
        </div>
        <span className="text-muted-foreground">{'}'}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </ProvenanceWrapper>
    );
  }

  return <span className="text-muted-foreground">{String(data)}</span>;
}

function ProvenanceWrapper({ name, provenance, children }) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!provenance) {
    return <span className="inline">{children}</span>;
  }

  return (
    <span
      className="inline relative group cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="inline underline decoration-dotted decoration-primary/40 underline-offset-2">
        {children}
      </span>
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 rounded-lg border border-border bg-popover p-3 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Provenance</span>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary">
                {Array.isArray(provenance.source) ? provenance.source.join(', ') : provenance.source || 'unknown'}
              </span>
            </div>
            {provenance.rawValue !== null && provenance.rawValue !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground">Raw: </span>
                <span className="text-xs font-mono text-foreground">{JSON.stringify(provenance.rawValue)}</span>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground">Confidence: </span>
              <span className="text-xs font-mono text-primary">{(provenance.confidence * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Normalized: </span>
              <span className="text-xs font-mono text-green-400">{provenance.normalizationSuccess ? 'Success' : 'Failed'}</span>
            </div>
            {provenance.allSourceValues && provenance.allSourceValues.length > 1 && (
              <div className="pt-1 border-t border-border/50">
                <span className="text-xs text-muted-foreground">All sources: </span>
                {provenance.allSourceValues.map((sv, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground ml-2">
                    {sv.source}: {JSON.stringify(sv.value)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
}