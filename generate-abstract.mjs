import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  TableBorders, convertInchesToTwip, PageOrientation, SectionType,
  VerticalAlign, UnderlineType
} from "docx";
import fs from "fs";

const BOLD = true;
const ITALIC = true;

// ── helpers ──────────────────────────────────────────────────────────────────
const hr = () =>
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
    spacing: { after: 80 },
  });

const heading = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 160, after: 60 },
  });

const body = (runs) =>
  new Paragraph({
    children: runs,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80 },
  });

const run = (text, opts = {}) =>
  new TextRun({ text, ...opts, size: 20 }); // 10pt = 20 half-points

const boldRun = (text) => run(text, { bold: BOLD });
const codeRun = (text) =>
  new TextRun({ text, font: "Courier New", size: 18, color: "333333" });

const bullet = (children) =>
  new Paragraph({
    children,
    bullet: { level: 0 },
    spacing: { after: 40 },
  });

const numberedItem = (num, boldText, restText) =>
  new Paragraph({
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 20 }),
      new TextRun({ text: boldText, bold: true, size: 20 }),
      new TextRun({ text: restText, size: 20 }),
    ],
    spacing: { after: 30 },
    indent: { left: convertInchesToTwip(0.25) },
  });

const twoColTable = (leftChildren, rightChildren) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TableBorders.NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: leftChildren,
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: {
              right: { style: BorderStyle.SINGLE, size: 4, color: "cccccc" },
              top: TableBorders.NONE.top,
              bottom: TableBorders.NONE.bottom,
              left: TableBorders.NONE.left,
            },
            margins: { right: convertInchesToTwip(0.15) },
          }),
          new TableCell({
            children: rightChildren,
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: TableBorders.NONE,
            margins: { left: convertInchesToTwip(0.15) },
          }),
        ],
      }),
    ],
  });

const simpleTable = (headerRow, dataRows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headerRow.map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, bold: true, size: 18 })],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "EEEEEE" },
              borders: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
            })
        ),
      }),
      ...dataRows.map(
        (row) =>
          new TableRow({
            children: row.map((cell, i) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      typeof cell === "string"
                        ? i === 0
                          ? new TextRun({ text: cell, font: "Courier New", size: 18 })
                          : new TextRun({ text: cell, size: 18 })
                        : cell,
                    ],
                  }),
                ],
                borders: {
                  bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" },
                  top: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                margins: { top: 30, bottom: 30, left: 80, right: 80 },
              })
            ),
          })
      ),
    ],
  });

// ── Diagram as ASCII art (SVG can't go in docx easily) ──────────────────────
const diagramLines = [
  "  ┌─────────────┐                                                              ",
  "  │  JSON / CSV │──┐                                                           ",
  "  └─────────────┘  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     ",
  "  ┌─────────────┐  ├──▶│  Extractors │─▶│ Normalizers │─▶│ Aggregator  │──┐  ",
  "  │ PDF Résumé  │──┤   │  (Parallel) │  │Date·Phone·  │  │+ Conflict   │  │  ",
  "  └─────────────┘  │   └─────────────┘  │Skill        │  │  Resolver   │  │  ",
  "  ┌─────────────┐  │      Stage 3       └─────────────┘  └─────────────┘  │  ",
  "  │  GitHub API │──┘                       Stage 4          Stages 5–6    │  ",
  "  └─────────────┘                                                          │  ",
  "      Inputs           ┌──────────────────────────────────────────────────┘  ",
  "                       │   ┌──────────────────┐   ┌───────────────────────┐  ",
  "                       └──▶│  Scorer &        │──▶│   Canonical Profile   │  ",
  "                           │  Provenance      │   │   (Schema Validated)  │  ",
  "                           └──────────────────┘   └───────────────────────┘  ",
  "                                Stages 7–8               Stages 9–10         ",
];

// ── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Georgia", size: 20, color: "000000" },
        paragraph: { spacing: { line: 276 } },
      },
    },
    paragraphStyles: [
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: { bold: true, size: 21, color: "000000", font: "Georgia" },
        paragraph: {
          spacing: { before: 160, after: 60 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" } },
        },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.85),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(0.9),
            right: convertInchesToTwip(0.9),
          },
        },
      },
      children: [

        // ── TITLE BLOCK ──────────────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: "CandidateForge", bold: true, size: 52, font: "Georgia" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Multi-Source Candidate Data Transformer & Canonical Profile Builder", italics: true, size: 22, font: "Georgia" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Prajin Kumar", bold: true, size: 20 }), new TextRun({ text: "  |  Full-Stack Developer", size: 20 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "prajinkumar2020@gmail.com  ·  github.com/prajin1910  ·  linkedin.com/in/prajinkumar1910  ·  June 2026", size: 18, color: "444444" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Live Demo: ", size: 18, color: "444444" }),
            new TextRun({ text: "candidateforge.vercel.app", bold: true, size: 18 }),
            new TextRun({ text: "   ·   Source: ", size: 18, color: "444444" }),
            new TextRun({ text: "github.com/prajin1910/CandidateForge", bold: true, size: 18 }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        hr(),

        // ── ABSTRACT ─────────────────────────────────────────────────────────
        heading("Abstract"),
        body([
          boldRun("CandidateForge"),
          run(" is a browser-native ETL (Extract, Transform, Load) application built with React.js that consolidates fragmented candidate data from multiple sources into a single, mathematically verified "),
          boldRun("Canonical Profile"),
          run(". In modern HR workflows, candidate information is spread across structured ATS databases (JSON/CSV), uploaded résumé documents (PDF), and live developer profiles (GitHub). CandidateForge extracts data from all three sources in parallel, normalises every field to strict international standards, resolves conflicts using a user-defined priority hierarchy, and attaches confidence scores and full provenance metadata to each field. The entire pipeline runs client-side with zero backend dependency, powered by the GitHub REST API and a pdf.js WASM worker for document parsing."),
        ]),

        // ── DIAGRAM ──────────────────────────────────────────────────────────
        heading("System Architecture & Data Flow"),
        new Paragraph({
          children: [new TextRun({ text: "10-Stage Pipeline — runs entirely client-side in the browser", italics: true, size: 18, color: "666666" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        ...diagramLines.map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line, font: "Courier New", size: 16, color: "222222" })],
              spacing: { after: 0, before: 0, line: 220 },
            })
        ),
        new Paragraph({ text: "", spacing: { after: 80 } }),

        // ── TWO-COLUMN SECTION ───────────────────────────────────────────────
        twoColTable(
          // LEFT COLUMN
          [
            heading("Problem Statement"),
            body([
              run("Organisations manage candidate profiles across disconnected systems — ATS databases (JSON/CSV), uploaded PDF résumés, and GitHub developer profiles. Merging these manually is error-prone, leading to duplicated and inconsistent records. CandidateForge automates this process deterministically through a structured pipeline."),
            ]),

            heading("10-Stage Transformation Pipeline"),
            numberedItem(1,  "Config Loader",       " — reads user-defined pipeline settings"),
            numberedItem(2,  "Source Detection",     " — identifies available input types"),
            numberedItem(3,  "Parallel Extraction",  " — JSON parser, GitHub API, pdf.js run concurrently"),
            numberedItem(4,  "Field Normalisation",  " — dates (ISO-8601), phones (E.164), skills (canonical)"),
            numberedItem(5,  "Source Aggregation",   " — merges all extracted records into one object"),
            numberedItem(6,  "Conflict Resolution",  " — user priority order; highest non-null value wins"),
            numberedItem(7,  "Confidence Scoring",   " — cross-source agreement boosts score from 0.7 to 1.0"),
            numberedItem(8,  "Provenance Builder",   " — attaches source, score, and timestamp to each field"),
            numberedItem(9,  "Canonical Builder",    " — assembles the final unified profile object"),
            numberedItem(10, "Schema Validation",    " — validates output against the canonical JSON schema"),
            new Paragraph({ text: "", spacing: { after: 60 } }),

            heading("Normalisation Engines"),
            simpleTable(
              ["Module", "Output Standard"],
              [
                ["dateNormalizer",    "ISO-8601 timestamps"],
                ["phoneNormalizer",   "E.164 international format"],
                ["skillNormalizer",   "Lowercase, deduplicated canonical set"],
                ["emailNormalizer",   "Lowercase, trimmed"],
                ["locationNormalizer","City, Country format"],
                ["countryNormalizer", "ISO 3166 country codes"],
              ]
            ),
          ],

          // RIGHT COLUMN
          [
            heading("Key Features"),
            bullet([boldRun("Parallel Extraction"), run(" — GitHub REST API, pdf.js WASM worker, and JSON parser execute concurrently in the browser event loop.")]),
            bullet([boldRun("Conflict Resolution Engine"), run(" — drag-and-drop source priority hierarchy; field-level winner selection is deterministic.")]),
            bullet([boldRun("Confidence Scoring"), run(" — trust score per field: 0.70 (single source) up to 1.0 (all sources agree).")]),
            bullet([boldRun("Full Provenance Chain"), run(" — every output field carries "), codeRun("{ value, source, confidence, timestamp }"), run(".")]),
            bullet([boldRun("Live Telemetry"), run(" — real-time pipeline log stream in the UI as each stage executes.")]),
            bullet([boldRun("Automated Validation Suite"), run(" — test runner at "), codeRun("/validation"), run(" for duplicates, null fallbacks, and schema failures.")]),
            bullet([boldRun("Zero Backend"), run(" — fully client-side; deployed as a static site on Vercel.")]),
            new Paragraph({ text: "", spacing: { after: 40 } }),

            heading("Technology Stack"),
            simpleTable(
              ["Technology", "Role"],
              [
                ["React 18",         "UI framework, component architecture"],
                ["Vite",             "Build tooling and development server"],
                ["TailwindCSS",      "Utility-first styling"],
                ["Framer Motion",    "Wizard step transitions and animations"],
                ["pdf.js",           "In-browser PDF parsing (WASM worker)"],
                ["GitHub REST API",  "Live repository and language data"],
                ["React Query",      "Async state management"],
                ["React Router v6",  "Client-side routing"],
              ]
            ),
            new Paragraph({ text: "", spacing: { after: 60 } }),

            heading("Application Flow"),
            body([
              run("The user navigates a 5-step wizard: "),
              boldRun("(1)"),
              run(" upload structured JSON/CSV, "),
              boldRun("(2)"),
              run(" select additional sources, "),
              boldRun("(3)"),
              run(" provide the GitHub URL or PDF file, "),
              boldRun("(4)"),
              run(" configure pipeline rules and source priority order, "),
              boldRun("(5)"),
              run(" trigger the transform and view real-time logs. The output screen displays the Canonical Profile with confidence badges, a conflict log, and a provenance map for every field."),
            ]),

            heading("Testing & Validation"),
            body([
              run("The "),
              codeRun("/validation"),
              run(" route runs an automated test suite verifying: Gold Profile Comparison (accuracy against expected outputs), Duplicate Skill Detection (canonicalisation correctness), and Missing Value Fallbacks (graceful handling of failed API calls or blank PDFs)."),
            ]),
          ]
        ),

        // ── FOOTER LINE ──────────────────────────────────────────────────────
        new Paragraph({ text: "", spacing: { after: 120 } }),
        hr(),
        new Paragraph({
          children: [
            new TextRun({ text: "CandidateForge  ·  Prajin Kumar  ·  June 2026", size: 16, color: "666666" }),
            new TextRun({ text: "          candidateforge.vercel.app  ·  github.com/prajin1910/CandidateForge", size: 16, color: "666666" }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 0 },
        }),
      ],
    },
  ],
});

// ── Write file ───────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("CandidateForge_Abstract.docx", buffer);
  console.log("✅ CandidateForge_Abstract.docx created successfully!");
});
