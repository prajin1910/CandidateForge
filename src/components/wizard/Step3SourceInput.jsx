import React from 'react';
import { Github, Linkedin, Key, AlertCircle, Info, CheckCircle2, ShieldCheck } from 'lucide-react';
import FileDropzone from '@/components/shared/FileDropzone';

const hasDefaultToken = !!import.meta.env.VITE_GITHUB_TOKEN;

export default function Step3SourceInput({ data, update }) {
  const { sourceType, sourceUrl, githubToken, pdfFile, pdfFileName } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Source Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {sourceType === 'github' && 'Enter the GitHub profile URL to extract profile, repos, languages, and topics.'}
          {sourceType === 'linkedin' && 'Enter the LinkedIn profile URL. A stub will be returned — scraping is not implemented.'}
          {sourceType === 'pdf' && 'Upload a PDF resume file. Text will be extracted and parsed into structured candidate fields.'}
        </p>
      </div>

      {sourceType === 'github' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub Profile URL
            </label>
            <input
              type="url"
              value={sourceUrl || ''}
              onChange={(e) => update({ sourceUrl: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Default token status */}
          {hasDefaultToken ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">API Token Configured</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A default GitHub API token is configured. You get up to <strong className="text-foreground">5,000 requests/hour</strong>.
                    No additional setup needed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  GitHub API Token <span className="text-xs text-muted-foreground font-normal">(recommended)</span>
                </label>
                <input
                  type="password"
                  value={githubToken || ''}
                  onChange={(e) => update({ githubToken: e.target.value })}
                  placeholder="ghp_..."
                  className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-mono"
                />
              </div>
              {/* Rate limit warning */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">No Default Token Set</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Without a token, the GitHub API allows only <strong className="text-foreground">60 requests/hour</strong> per IP address,
                      which can fail if exhausted. Provide a token above, or set <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">VITE_GITHUB_TOKEN</code> in <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">.env.local</code> for all users.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      To create a token: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic).
                      No special scopes needed — a token with no scopes gives read-only public access.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {sourceType === 'linkedin' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={sourceUrl || ''}
              onChange={(e) => update({ sourceUrl: e.target.value })}
              placeholder="https://www.linkedin.com/in/username"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
            <div className="flex items-start gap-3">
              <Linkedin className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">LinkedIn Stub Extractor</p>
                <p className="text-xs text-muted-foreground mt-1">
                  LinkedIn extraction requires authenticated access and is intentionally not implemented.
                  A structured placeholder will be returned and passed through the pipeline as a low-confidence source.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {sourceType === 'pdf' && (
        <div className="space-y-4">
          <FileDropzone
            label="Resume PDF"
            accept=".pdf"
            onFileSelected={(result) => {
              if (result) {
                update({ pdfFile: result.file, pdfFileName: result.name });
              } else {
                update({ pdfFile: null, pdfFileName: null });
              }
            }}
            fileName={pdfFileName}
          />
          {/* PDF extraction info */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Client-Side PDF Extraction</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Text is extracted directly from your PDF in the browser — no server upload needed.
                  For best results, use a text-based PDF (not a scanned image). The parser extracts
                  name, email, phone, skills, experience, education, and links.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}