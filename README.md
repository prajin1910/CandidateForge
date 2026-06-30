# CandidateForge: Multi-Source Candidate Data Transformer

### 🔗 [View Live Application Demo](https://candidateforge.vercel.app/)

CandidateForge is a robust, front-end heavy MERN-stack application (simulating an enterprise-grade backend processing pipeline) designed to consolidate messy, disjointed candidate data from multiple sources into a **Single Source of Truth** (Canonical Profile).

In the real world, HR candidate profiles consist of structured data (JSON/CSV), Resume PDFs, and social media links (GitHub/LinkedIn). CandidateForge extracts, normalizes, resolves conflicts, and securely aggregates these disparate data points into a perfectly validated and cleanly formatted JSON payload ready for database storage.

## Table of Contents
- [System Architecture Overview](#system-architecture-overview)
- [Component Communication & Data Flow](#component-communication--data-flow)
- [Deep Dive: Core Pipeline Logic](#deep-dive-core-pipeline-logic)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started (Local setup implementation)](#getting-started-local-setup-implementation)
- [Application Walkthrough & Screens](#application-walkthrough--screens)
- [Automated Edge-Case Validation](#automated-edge-case-validation)
- [How to Test This Application](#how-to-test-this-application)
- [Video Explanation](#video-explanation)
- [Contact Me](#contact-me)

---

## System Architecture Overview

CandidateForge employs a sophisticated **10-Stage Transformation Pipeline**. The entire mechanism is fully transparent and tracks provenance (where every piece of data originated) and calculates confidence scores for absolute reliability.

*To save space, the full pipeline diagram is collapsed below. Click to expand!*

<details>
<summary><b>Click here to view the 10-Stage Transformation Pipeline Diagram</b></summary>

```mermaid
flowchart LR
    A[Raw Inputs] --> B[1. Config Loader]
    B --> C[2. Source Detection]
    C --> D[3. Parallel Extraction]
    
    subgraph Extractors
        D --> E1(JSON Parser)
        D --> E2(PDF.js Resume Parser)
        D --> E3(GitHub API Extractor)
    end
    
    E1 & E2 & E3 --> F[4. Normalization Engine]
    
    subgraph Normalizers
        F --> F1(ISO Dates)
        F --> F2(E.164 Phones)
        F --> F3(Skill Canonicalization)
    end
    
    F1 & F2 & F3 --> G[5. Source Aggregation]
    G --> H[6. Conflict Resolution Engine]
    H --> I[7. Confidence Scoring]
    I --> J[8. Provenance Builder]
    J --> K[9. Canonical Profile Builder]
    K --> L[10. Schema Validation & Projection]
    L --> M[Final Canonical Payload]
    
    style H fill:#f96,stroke:#333,stroke-width:2px
    style I fill:#f96,stroke:#333,stroke-width:2px
```

</details>

---

## Component Communication & Data Flow

This section maps **how every module communicates with every other module** across all layers of the application — from the UI wizard through to external APIs.

### 1. System Layer Overview

The application is split into four distinct responsibility layers. Data only flows downward (UI → Hook → Service → Libraries).

```mermaid
block-beta
  columns 1
  block:UI["🖥️  UI Layer (React Components)"]
    columns 3
    A["TransformPage\n(Wizard Orchestrator)"]
    B["WizardStepper\n(Step Indicator)"]
    C["OutputPanel\n(Results Display)"]
  end
  space
  block:STATE["🔗  State Layer (React Hook)"]
    columns 1
    D["useTransform Hook\n(status / result / pipelineLog / error)"]
  end
  space
  block:PIPELINE["⚙️  Pipeline Layer (Business Logic)"]
    columns 4
    E["transformService"]
    F["sourceDetector"]
    G["sourceAggregator"]
    H["conflictResolver"]
  end
  space
  block:LIB["📦  Library Layer (Utility Modules)"]
    columns 4
    I["Extractors"]
    J["Normalizers"]
    K["Validators"]
    L["Projection"]
  end

  A --> D
  D --> E
  E --> F
  E --> G
  E --> H
  E --> I
  E --> J
  E --> K
  E --> L
  E --> C
```

---

### 2. Full Component-to-Component Communication Flow

This diagram shows the precise message/data passing between every React component and module.

```mermaid
flowchart TD
    subgraph Browser["🌐 Browser (Client-Side)"]
        subgraph UI["UI Layer"]
            Main["main.jsx\n<i>App Entry Point</i>"]
            App["App.jsx\n<i>Router + QueryClientProvider</i>"]
            TP["TransformPage.jsx\n<i>Wizard State Orchestrator</i>"]
            VP["ValidationTests.jsx\n<i>Edge-Case Test Runner</i>"]

            subgraph Wizard["Wizard Step Components"]
                S1["Step1Structured\n<i>JSON/CSV File Upload</i>"]
                S2["Step2SourceSelect\n<i>Source Type Picker</i>"]
                S3["Step3SourceInput\n<i>GitHub URL / PDF Drop</i>"]
                S4["Step4Config\n<i>Pipeline Config Editor</i>"]
                S5["Step5Transform\n<i>Pipeline Trigger + Log Stream</i>"]
                WZ["WizardStepper\n<i>Step Progress Indicator</i>"]
            end

            subgraph Output["Output Components"]
                OP["OutputPanel"]
                SC["SummaryCard"]
                JV["JsonViewer"]
                CB["ConfidenceBar"]
                SB["SourceBadge"]
                CE["ConfidenceExplanation"]
            end

            subgraph Shared["Shared UI Components"]
                FD["FileDropzone"]
                LS["LoadingSpinner"]
                ED["ErrorDisplay"]
            end
        end

        subgraph Hook["State Layer"]
            UT["useTransform Hook\n<i>status / result / error / pipelineLog</i>"]
        end

        subgraph PipelineLib["Pipeline Service Layer"]
            TS["transformService.js\n<i>Orchestrates all pipeline stages</i>"]
            SD["sourceDetector.js\n<i>Detects input types</i>"]
            SA["sourceAggregator.js\n<i>Merges extracted data</i>"]
            CR["conflictResolver.js\n<i>Applies priority rules</i>"]
            CC["confidenceCalculator.js\n<i>Scores each field</i>"]
            PB["provenanceBuilder.js\n<i>Attaches source metadata</i>"]
            CB2["canonicalBuilder.js\n<i>Assembles final profile</i>"]
        end

        subgraph Extractors["Extractor Modules"]
            GE["githubExtractor.js"]
            RE["resumeExtractor.js\n<i>pdf.js</i>"]
            LE["linkedinStubExtractor.js"]
        end

        subgraph Normalizers["Normalizer Modules"]
            DN["dateNormalizer.js\n<i>→ ISO-8601</i>"]
            PN["phoneNormalizer.js\n<i>→ E.164</i>"]
            SN["skillNormalizer.js\n<i>→ Canonical Set</i>"]
            EN["emailNormalizer.js"]
            LN["locationNormalizer.js"]
            CN["countryNormalizer.js"]
        end

        subgraph Validators["Validation & Projection"]
            SV["schemaValidator.js"]
            PE["projectionEngine.js"]
        end
    end

    subgraph External["🌍 External APIs"]
        GH["api.github.com\n<i>REST API</i>"]
        PDFJS["pdf.js\n<i>In-Browser WASM Worker</i>"]
    end

    Main -->|"renders"| App
    App -->|"/ route"| TP
    App -->|"/validation route"| VP

    TP -->|"step state + wizardData"| WZ
    TP -->|"data + update()"| S1
    TP -->|"data + update()"| S2
    TP -->|"data + update()"| S3
    TP -->|"data + update()"| S4
    TP -->|"data + onTransform()"| S5
    TP -->|"calls transform(inputs)"| UT
    TP -->|"result / error / status"| OP

    S3 -->|"PDF file drop"| FD
    S5 -->|"pipelineLog stream"| LS

    OP --> SC
    OP --> JV
    OP --> CB
    OP --> SB
    OP --> CE
    OP -->|"on error"| ED

    UT -->|"async call"| TS
    UT -->|"onProgress callback → pipelineLog"| S5

    TS -->|"detect sources"| SD
    TS -->|"fan-out extraction"| GE
    TS -->|"fan-out extraction"| RE
    TS -->|"fan-out extraction"| LE
    TS -->|"normalize fields"| DN
    TS -->|"normalize fields"| PN
    TS -->|"normalize fields"| SN
    TS -->|"normalize fields"| EN
    TS -->|"normalize fields"| LN
    TS -->|"normalize fields"| CN
    TS -->|"merge sources"| SA
    TS -->|"resolve conflicts"| CR
    TS -->|"score fields"| CC
    TS -->|"attach provenance"| PB
    TS -->|"build profile"| CB2
    TS -->|"validate schema"| SV
    TS -->|"project fields"| PE

    GE -->|"HTTP GET repos/user/languages"| GH
    RE -->|"parseAsync buffer"| PDFJS

    style GH fill:#24292e,color:#fff,stroke:#555
    style PDFJS fill:#e44d26,color:#fff,stroke:#c0392b
    style TS fill:#2563eb,color:#fff,stroke:#1d4ed8
    style UT fill:#7c3aed,color:#fff,stroke:#5b21b6
    style TP fill:#0f766e,color:#fff,stroke:#0d9488
```

---

### 3. External API Communication

CandidateForge communicates with two external services entirely from the browser (no backend server required).

```mermaid
sequenceDiagram
    actor User
    participant UI as TransformPage (UI)
    participant Hook as useTransform Hook
    participant TS as transformService
    participant GE as githubExtractor
    participant RE as resumeExtractor
    participant GH as api.github.com
    participant PDF as pdf.js Worker

    User->>UI: Clicks "Transform"
    UI->>Hook: transform(inputs)
    Hook->>TS: transformCandidate({ structuredFile, sourceType, sourceUrl, pdfFile, config })

    Note over TS: Stage 1 — Source Detection
    TS->>TS: sourceDetector.detect(inputs)

    Note over TS: Stage 2 — Parallel Extraction
    par GitHub Extraction
        TS->>GE: extract(sourceUrl, token)
        GE->>GH: GET /users/{username}/repos
        GH-->>GE: repo list JSON
        GE->>GH: GET /repos/{owner}/{repo}/languages
        GH-->>GE: language stats JSON
        GE-->>TS: Structured GitHub Profile
    and PDF Extraction
        TS->>RE: extract(pdfFile)
        RE->>PDF: pdfjsLib.getDocument(buffer)
        PDF-->>RE: page text chunks
        RE-->>TS: Parsed Resume Text
    end

    Note over TS: Stage 3 — Normalisation
    TS->>TS: normalizeAll(rawData) — Dates, Phones, Skills, Email, Location

    Note over TS: Stage 4 — Aggregation & Conflict Resolution
    TS->>TS: sourceAggregator.merge(sources)
    TS->>TS: conflictResolver.resolve(aggregated, priorityOrder)

    Note over TS: Stage 5 — Scoring & Provenance
    TS->>TS: confidenceCalculator.score(fields)
    TS->>TS: provenanceBuilder.build(fields)

    Note over TS: Stage 6 — Build & Validate
    TS->>TS: canonicalBuilder.build(scored)
    TS->>TS: schemaValidator.validate(canonical)
    TS->>TS: projectionEngine.project(canonical)

    TS-->>Hook: { success, canonical, conflicts, provenance, log }
    Hook-->>UI: { status: 'success', result, pipelineLog }
    UI->>User: Renders OutputPanel with Canonical Profile
```

---

### 4. State Management & Data Flow

This shows exactly what data is passed between the React state containers and how `wizardData` flows through all wizard steps before being passed to the pipeline.

```mermaid
flowchart LR
    subgraph WizardState["React State in TransformPage"]
        WD["wizardData\n──────────────────\nfileContent\nfileName\nsourceType: github|pdf\nsourceUrl\ngithubToken\npdfFile\npdfFileName\nconfig: { normalizers, conflictStrategy, priorityOrder }"]
    end

    subgraph Steps["Wizard Steps — Read & Update wizardData"]
        S1["Step 1\nUploads JSON/CSV\n→ writes fileContent, fileName"]
        S2["Step 2\nPicks source type\n→ writes sourceType"]
        S3["Step 3\nProvides URL or PDF\n→ writes sourceUrl / pdfFile"]
        S4["Step 4\nEdits pipeline config\n→ writes config object"]
        S5["Step 5\nReads all data\n→ triggers transform"]
    end

    subgraph HookState["useTransform Hook State"]
        ST["status: idle|loading|success|error"]
        RS["result: { canonical, conflicts, provenance }"]
        ER["error: { message, details }"]
        PL["pipelineLog: LogEntry[]"]
    end

    WD --> S1
    WD --> S2
    WD --> S3
    WD --> S4
    WD --> S5

    S1 -->|"update({ fileContent, fileName })"| WD
    S2 -->|"update({ sourceType })"| WD
    S3 -->|"update({ sourceUrl / pdfFile })"| WD
    S4 -->|"update({ config })"| WD
    S5 -->|"transform(wizardData) →"| HookState

    HookState -->|"pipelineLog stream"| S5
    HookState -->|"result / error / status"| OP["OutputPanel"]

    style WD fill:#1e293b,color:#e2e8f0,stroke:#334155
    style HookState fill:#1e1b4b,color:#e0e7ff,stroke:#3730a3
```

---

## Deep Dive: Core Pipeline Logic

To truly understand CandidateForge, you must look under the hood. The application simulates complex backend ETL (Extract, Transform, Load) logic entirely within the client-side architecture.

### 1. Extractor Engines
The pipeline begins by fanning out to specialized extractors based on the detected input types:
- **Structured JSON Extractor:** Parses standard HR data payloads.
- **GitHub API Extractor:** Automatically fires REST calls to `api.github.com` to fetch live repository data, primary languages, and profile metadata.
- **PDF Resume Extractor:** Utilizes `pdf.js` to parse raw buffer data from uploaded resumes into readable text chunks.

### 2. The Normalization Engine
Raw data is rarely clean. The normalizers sanitize data before it hits the conflict resolver:
- **Temporal Normalization:** Dates like `Jan 2023`, `01/23`, and `2023-01-01` are uniformly converted into strict ISO-8601 timestamps (`2023-01-01T00:00:00.000Z`).
- **Telecom Normalization:** Phone numbers strip out spaces and local prefixes, converting them to strict `E.164` international formats (e.g., `+919876543210`).
- **Taxonomy Canonicalization:** Arrays of skills (e.g., `["ReactJS", "react", "JAVA"]`) are forcefully lowercased, stripped of special characters, and deduplicated into a canonical set (`["react", "java"]`).

### 3. Conflict Resolution Strategy
When multiple sources provide the same piece of information (e.g., the JSON says the candidate's title is "Developer", but their Resume says "Senior Engineer"), the system must decide which to trust.
- The user defines a **Source Priority Hierarchy** (e.g., `Resume > GitHub > Structured Data`).
- The engine iterates through the priority list. It selects the highest-priority source that actually contains a valid, non-null value for that specific field.

### 4. Confidence Scoring Algorithm
CandidateForge calculates a mathematical "Trust Score" for every single data point.
- **Base Score:** A value extracted from a single source starts with a baseline confidence (e.g., `0.7`).
- **Cross-Validation Bonus:** If *multiple* sources independently agree on the same value (e.g., both the Resume and the JSON list "Docker" as a skill), the system mathematically boosts the confidence score up to a maximum of `1.0`.

### 5. Provenance Mapping
Data without a verifiable trail is dangerous. CandidateForge attaches a "Provenance Metadata Object" to every finalized field. Instead of just returning `"Chennai"`, the engine returns:
```json
{
  "value": "Chennai",
  "source": "resume",
  "confidence": 0.85,
  "timestamp": "2026-06-30T10:00:00Z"
}
```
This guarantees 100% transparency for downstream systems.

---

## Features

- **Dynamic Pipeline Configuration:** Users can toggle individual normalizers, adjust missing-value behaviors, and reorder priority hierarchies on the fly.
- **Live Output Telemetry:** Real-time visual logs stream into the UI as the pipeline transitions from extraction to normalization to aggregation.
- **Visual Confidence Badges:** The final Output Screen color-codes data points based on their mathematical confidence scores.
- **Automated Fallbacks:** If the GitHub API rate-limits the request or a PDF is entirely blank, the pipeline intelligently skips the source without crashing, falling back to lower-priority data.

---

## Tech Stack

- **Frontend Core:** React.js, TailwindCSS
- **Animations & Transitions:** Framer Motion (used for the seamless 5-step wizard and dynamic logs)
- **Data Parsing:** `pdf.js` (for complex document extraction)
- **State Architecture:** React Context API combined with heavily modularized Custom Hooks to separate UI logic from Pipeline execution.
- **Development Tooling:** Vite, Node.js

---

## Getting Started (Local setup implementation)

Follow these instructions to run the application locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- Git installed on your local machine

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prajin1910/CandidateForge.git
   cd CandidateForge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open the Application:**
   Open your browser and navigate to `http://localhost:5173` (or the port provided in your terminal).

---

## Application Walkthrough & Screens

CandidateForge provides a beautifully designed 5-step wizard to guide users through the pipeline execution.

### 1. Upload (Structured Data)
The first step expects the base payload. This is usually the data retrieved from an existing HR Application Tracking System (ATS).
![Upload Screen](imagesVideo/upload.png)

### 2. Select (Additional Sources)
Here, the pipeline detects any additional attachments. Users can enable dynamic fetchers like the GitHub API or the PDF Resume Parser.
![Select Sources Screen](imagesVideo/select.png)

### 3. Details (Inputs)
Users provide the raw files and API URLs. For example, pasting the GitHub URL or dropping the Resume PDF into the Dropzone.
![Details Input Screen](imagesVideo/details.png)

### 4. Configure (Pipeline Rules)
Users have total control over the backend pipeline rules. You can define how missing values are handled, toggle specific normalizers, and most importantly, drag-and-drop the **Source Priority** list which dictates how the Conflict Resolver behaves.
![Configure Screen](imagesVideo/configuration.png)

### 5. Transform (Execution)
The pipeline is triggered! You can view real-time execution logs as the system fetches API data, parses PDFs locally, and normalizes the payload.
![Transform Screen](imagesVideo/Transformation.png)

### 6. Output Panel
The finalized Canonical Profile is presented with 100% transparency. The UI includes visual confidence badges, conflict resolution logs, and a Provenance map showing exactly which source contributed to each finalized field.
![Output Screen](imagesVideo/output.png)

---

## Automated Edge-Case Validation

To prove the pipeline is production-ready, CandidateForge includes an automated Validation Test suite.
You can view this at the `/validation` route. It validates against:
- **Gold Profile Comparison:** Ensures perfect accuracy against known expected outputs.
- **Duplicate Skills:** Ensures canonicalization accurately deduplicates messy arrays.
- **Missing / Invalid Fallbacks:** Ensures broken API links or empty PDFs do not crash the pipeline.

![Validations Screen](imagesVideo/validations.png)

---

## How to Test This Application

To test the application locally, you can use the provided sample inputs:

1. Copy the contents of the `sample_data.json` file and paste it into **Step 1 (Upload)**.
2. In **Step 3 (Details)**, provide the GitHub repository link: [https://github.com/prajin1910/](https://github.com/prajin1910/)
3. Click through to **Step 5** and hit **Transform**.
4. Witness the pipeline intelligently aggregate your JSON with the live GitHub API data!

---

## Video Explanation

For a full guided walkthrough of the backend architecture, the pipeline codebase, and the frontend wizard UI, please watch the explanation video below:

<div align="left">
  <a href="https://youtu.be/C3RhpsFPYY4">
    <img src="https://img.youtube.com/vi/C3RhpsFPYY4/0.jpg" alt="CandidateForge Video Explanation" width="800" style="border-radius: 10px;">
  </a>
</div>

---

## Contact Me

- **Portfolio:** [prajinkumar-portfolio.vercel.app](https://prajinkumar-portfolio.vercel.app/)
- **LinkedIn:** [prajinkumar1910](https://linkedin.com/in/prajinkumar1910)
- **GitHub:** [prajin1910](https://github.com/prajin1910)
- **Email:** [prajinkumar2020@gmail.com](mailto:prajinkumar2020@gmail.com)
