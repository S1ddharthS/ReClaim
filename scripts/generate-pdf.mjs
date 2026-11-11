import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const evidenceDir = path.join(ROOT, 'ReClaim_Evidence');

const screenshots = [
  {
    num: 1,
    name: 'Project Creation & Summary Dashboard',
    file: '01_Project_Dashboard.png',
    req: 'Jira project creation/project dashboard',
    desc: 'Shows project key RECL, project name ReClaim, description, active boards, and project navigation on Jira Cloud.'
  },
  {
    num: 2,
    name: 'Product Backlog with User Stories and Sprints',
    file: '02_Product_Backlog.png',
    req: 'Product Backlog (minimum 10 stories)',
    desc: 'Product Backlog view showing 16 User Stories across 5 Epics, active Sprint 2 (23 pts), and uncommitted backlog (26 pts).'
  },
  {
    num: 3,
    name: 'User Story Details with Description & Acceptance Criteria',
    file: '03_User_Story_Details.png',
    req: 'User story with description & acceptance criteria',
    desc: 'Detailed view of RECL-20 (Inspect Material Quality) displaying role statement, context narrative, numbered acceptance criteria, 5 story points, and High priority.'
  },
  {
    num: 4,
    name: 'Sprint 1 Planning — Committed Scope (26 Points)',
    file: '04_Sprint_1_Planning.png',
    req: 'Sprint 1 planning',
    desc: 'Sprint 1 committed scope (Filter 10001): 6 user stories (24 pts) plus regression bug RECL-33 (2 pts) = 26 points.'
  },
  {
    num: 5,
    name: 'Scrum Board Execution Workflow',
    file: '05_Scrum_Board_Execution.png',
    req: 'Scrum Board during execution',
    desc: 'Live Scrum Board execution demonstrating issue movement across To Do, In Progress, and Done status columns.'
  },
  {
    num: 6,
    name: 'Assigned Issues to Project Owner Siddharth Sanjay',
    file: '06_Assigned_Issues.png',
    req: 'Assigned tasks/issues',
    desc: 'Jira filter 10004 displaying tasks and user stories assigned to project owner Siddharth Sanjay (24c52.siddharth@sjec.ac.in).'
  },
  {
    num: 7,
    name: 'Bug Created, Tracked & Resolved (RECL-33)',
    file: '07_Bug_Tracking.png',
    req: 'Bug created and its status',
    desc: 'Defect RECL-33 (Reserved Stock Incorrectly Remains Available in Inventory): High priority, reproduction steps, atomic fix verified, status Done, resolution Fixed.'
  },
  {
    num: 8,
    name: 'Completed Sprint 1 / Sprint Completion Report',
    file: '08_Sprint_1_Report.png',
    req: 'Completed Sprint / Sprint Report',
    desc: 'Sprint 1 completed outcome (Filter 10002): All 7 committed items Done, 26 story points delivered, zero carry-over.'
  },
  {
    num: 9,
    name: 'Sprint 2 Board (Active Sprint with In Progress Work)',
    file: '09_Sprint_2_Board.png',
    req: 'Sprint 2 board',
    desc: 'Active Sprint 2 (Sprint 2 - Find Materials, 23 pts) board showing RECL-22 In Progress and remaining stories in To Do.'
  },
  {
    num: 10,
    name: 'Final Project Dashboard & Reporting Gadgets',
    file: '10_Final_Dashboard.png',
    req: 'Final project dashboard/report',
    desc: 'Jira Dashboard 10001 configured with Activity Stream, Sprint Burndown, Sprint Health, Assigned to Me, and Filter Results gadgets.'
  }
];

// Helper: load image as base64
function getBase64Image(filename) {
  const filePath = path.join(evidenceDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing image file: ${filePath}`);
    return '';
  }
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

// Generate the HTML for the 10-screenshot report (5 pages, strictly 2 screenshots per page)
function generate10ScreenshotHtml() {
  const pagesHtml = [];

  for (let i = 0; i < screenshots.length; i += 2) {
    const s1 = screenshots[i];
    const s2 = screenshots[i + 1];
    const pageNum = Math.floor(i / 2) + 1;
    const isFirstPage = pageNum === 1;

    pagesHtml.push(`
      <div class="pdf-page">
        ${isFirstPage ? `
          <div class="doc-header">
            <div class="header-main">
              <div>
                <h1 class="doc-title">Software Engineering Assignment 1 — Scrum & Jira</h1>
                <div class="doc-subtitle">Practical Implementation & Screenshot Evidence Report: ReClaim (RECL)</div>
              </div>
              <div class="doc-badge">100% VERIFIED</div>
            </div>
            <div class="meta-row">
              <div class="meta-pill">Student: <strong>Siddharth Sanjay</strong></div>
              <div class="meta-pill">Email: <strong>24c52.siddharth@sjec.ac.in</strong></div>
              <div class="meta-pill">Project Key: <strong>RECL</strong> (ID: 10000)</div>
              <div class="meta-pill">Jira Site: <strong>sjec-team-xyntwxhy.atlassian.net</strong></div>
            </div>
          </div>
        ` : `
          <div class="doc-header-compact">
            <span>ReClaim (RECL) — Jira Scrum Evidence Submission</span>
            <span>Student: Siddharth Sanjay (24c52.siddharth@sjec.ac.in)</span>
            <span>Page ${pageNum} of 5</span>
          </div>
        `}

        <!-- Screenshot Item 1 -->
        <div class="screenshot-box">
          <div class="screenshot-header">
            <div class="screenshot-title-group">
              <span class="screenshot-number">Screenshot ${s1.num}</span>
              <span class="screenshot-name">${s1.name}</span>
            </div>
            <span class="screenshot-req">${s1.req}</span>
          </div>
          <div class="screenshot-img-wrap">
            <img src="${getBase64Image(s1.file)}" alt="${s1.name}">
          </div>
          <div class="screenshot-footer">
            <span class="screenshot-filename">File: <code>${s1.file}</code></span>
            <span class="screenshot-desc">${s1.desc}</span>
          </div>
        </div>

        <!-- Screenshot Item 2 -->
        <div class="screenshot-box">
          <div class="screenshot-header">
            <div class="screenshot-title-group">
              <span class="screenshot-number">Screenshot ${s2.num}</span>
              <span class="screenshot-name">${s2.name}</span>
            </div>
            <span class="screenshot-req">${s2.req}</span>
          </div>
          <div class="screenshot-img-wrap">
            <img src="${getBase64Image(s2.file)}" alt="${s2.name}">
          </div>
          <div class="screenshot-footer">
            <span class="screenshot-filename">File: <code>${s2.file}</code></span>
            <span class="screenshot-desc">${s2.desc}</span>
          </div>
        </div>

        <div class="page-footer">
          <span>Software Engineering — Jira & Scrum Framework Implementation</span>
          <span>Page ${pageNum} of 5</span>
        </div>
      </div>
    `);
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>ReClaim Jira Evidence Submission Report</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0F172A;
          background: #FFFFFF;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }

        .pdf-page {
          page-break-after: always;
          height: 275mm;
          max-height: 275mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .pdf-page:last-child {
          page-break-after: avoid;
        }

        /* Header */
        .doc-header {
          background: #0F766E;
          color: white;
          padding: 10px 14px;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .doc-title { font-size: 1.15rem; font-weight: 800; color: white; line-height: 1.2; }
        .doc-subtitle { font-size: 0.8rem; opacity: 0.95; }
        .doc-badge {
          background: #CCFBF1;
          color: #115E59;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .meta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .meta-pill {
          background: rgba(255,255,255,0.18);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
        }
        .meta-pill strong { color: #CCFBF1; }

        .doc-header-compact {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: #64748B;
          border-bottom: 1px solid #CBD5E1;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }

        /* Screenshot Box */
        .screenshot-box {
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          background: #F8FAFC;
          overflow: hidden;
          margin-bottom: 6px;
          display: flex;
          flex-direction: column;
          height: 122mm;
          max-height: 122mm;
        }
        .screenshot-header {
          background: #FFFFFF;
          padding: 5px 10px;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .screenshot-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .screenshot-number {
          background: #0F766E;
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .screenshot-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F172A;
        }
        .screenshot-req {
          font-size: 0.7rem;
          color: #475569;
          background: #E2E8F0;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .screenshot-img-wrap {
          flex: 1;
          background: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 94mm;
          max-height: 98mm;
        }
        .screenshot-img-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        .screenshot-footer {
          background: #FFFFFF;
          padding: 4px 10px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.7rem;
          color: #475569;
        }
        .screenshot-filename code {
          background: #F1F5F9;
          color: #0F766E;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 700;
        }
        .screenshot-desc {
          color: #64748B;
          max-width: 65%;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .page-footer {
          border-top: 1px solid #E2E8F0;
          padding-top: 4px;
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          color: #94A3B8;
        }
      </style>
    </head>
    <body>
      ${pagesHtml.join('')}
    </body>
    </html>
  `;
}

// Generate the HTML for a 1-page document with exactly 2 screenshots
function generateSinglePage2ScreenshotHtml() {
  const s1 = screenshots[0]; // 01_Project_Dashboard.png
  const s2 = screenshots[4]; // 05_Scrum_Board_Execution.png

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>ReClaim Jira Evidence — 2 Screenshots Summary</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0F172A;
          background: #FFFFFF;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }

        .pdf-page {
          height: 275mm;
          max-height: 275mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .doc-header {
          background: #0F766E;
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 8px;
        }
        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .doc-title { font-size: 1.25rem; font-weight: 800; color: white; }
        .doc-subtitle { font-size: 0.85rem; opacity: 0.95; }
        .doc-badge {
          background: #CCFBF1;
          color: #115E59;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .meta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .meta-pill {
          background: rgba(255,255,255,0.18);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .meta-pill strong { color: #CCFBF1; }

        .screenshot-box {
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          background: #F8FAFC;
          overflow: hidden;
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
          height: 120mm;
          max-height: 120mm;
        }
        .screenshot-header {
          background: #FFFFFF;
          padding: 6px 12px;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .screenshot-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .screenshot-number {
          background: #0F766E;
          color: white;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .screenshot-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F172A;
        }
        .screenshot-req {
          font-size: 0.72rem;
          color: #475569;
          background: #E2E8F0;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .screenshot-img-wrap {
          flex: 1;
          background: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-height: 92mm;
          max-height: 96mm;
        }
        .screenshot-img-wrap img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
        }

        .screenshot-footer {
          background: #FFFFFF;
          padding: 4px 12px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          color: #475569;
        }
        .screenshot-filename code {
          background: #F1F5F9;
          color: #0F766E;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 700;
        }

        .page-footer {
          border-top: 1px solid #E2E8F0;
          padding-top: 4px;
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #94A3B8;
        }
      </style>
    </head>
    <body>
      <div class="pdf-page">
        <div class="doc-header">
          <div class="header-main">
            <div>
              <h1 class="doc-title">Software Engineering Assignment 1 — Scrum & Jira</h1>
              <div class="doc-subtitle">Practical Implementation & Screenshot Evidence: ReClaim (RECL)</div>
            </div>
            <div class="doc-badge">VERIFIED IN JIRA</div>
          </div>
          <div class="meta-row">
            <div class="meta-pill">Student: <strong>Siddharth Sanjay</strong></div>
            <div class="meta-pill">Email: <strong>24c52.siddharth@sjec.ac.in</strong></div>
            <div class="meta-pill">Project Key: <strong>RECL</strong> (ID: 10000)</div>
            <div class="meta-pill">Jira Site: <strong>sjec-team-xyntwxhy.atlassian.net</strong></div>
          </div>
        </div>

        <!-- Screenshot 1 -->
        <div class="screenshot-box">
          <div class="screenshot-header">
            <div class="screenshot-title-group">
              <span class="screenshot-number">Screenshot 1</span>
              <span class="screenshot-name">${s1.name}</span>
            </div>
            <span class="screenshot-req">${s1.req}</span>
          </div>
          <div class="screenshot-img-wrap">
            <img src="${getBase64Image(s1.file)}" alt="${s1.name}">
          </div>
          <div class="screenshot-footer">
            <span class="screenshot-filename">File: <code>${s1.file}</code></span>
            <span>${s1.desc}</span>
          </div>
        </div>

        <!-- Screenshot 2 -->
        <div class="screenshot-box">
          <div class="screenshot-header">
            <div class="screenshot-title-group">
              <span class="screenshot-number">Screenshot 2</span>
              <span class="screenshot-name">${s2.name}</span>
            </div>
            <span class="screenshot-req">${s2.req}</span>
          </div>
          <div class="screenshot-img-wrap">
            <img src="${getBase64Image(s2.file)}" alt="${s2.name}">
          </div>
          <div class="screenshot-footer">
            <span class="screenshot-filename">File: <code>${s2.file}</code></span>
            <span>${s2.desc}</span>
          </div>
        </div>

        <div class="page-footer">
          <span>Software Engineering Assignment — Agile Scrum Implementation</span>
          <span>1-Page Evidence Summary</span>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function main() {
  console.log('Launching headless Chromium to render PDFs...');
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  try {
    // 1. Generate the complete 10-screenshot report (5 pages, exactly 2 screenshots per page)
    console.log('Generating ReClaim_Jira_Evidence_Report.pdf (10 screenshots, 2 per page across 5 pages)...');
    const page10 = await browser.newPage();
    const html10 = generate10ScreenshotHtml();
    fs.writeFileSync(path.join(ROOT, 'docs', 'ReClaim_Evidence_Report.html'), html10, 'utf8');
    await page10.setContent(html10, { waitUntil: 'load' });
    await page10.pdf({
      path: path.join(ROOT, 'ReClaim_Jira_Evidence_Report.pdf'),
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '12mm', right: '12mm' }
    });
    fs.copyFileSync(
      path.join(ROOT, 'ReClaim_Jira_Evidence_Report.pdf'),
      path.join(ROOT, 'docs', 'ReClaim_Jira_Evidence_Report.pdf')
    );
    fs.copyFileSync(
      path.join(ROOT, 'ReClaim_Jira_Evidence_Report.pdf'),
      path.join(ROOT, 'ReClaim_Evidence', 'ReClaim_Jira_Evidence_Report.pdf')
    );
    console.log('-> Generated: ReClaim_Jira_Evidence_Report.pdf (saved to root, docs/, and ReClaim_Evidence/)');

    // 2. Generate the single-page PDF with exactly 2 screenshots
    console.log('Generating ReClaim_2_Screenshots_Page.pdf (1 page with 2 screenshots)...');
    const page2 = await browser.newPage();
    const html2 = generateSinglePage2ScreenshotHtml();
    fs.writeFileSync(path.join(ROOT, 'docs', 'ReClaim_2_Screenshots.html'), html2, 'utf8');
    await page2.setContent(html2, { waitUntil: 'load' });
    await page2.pdf({
      path: path.join(ROOT, 'ReClaim_2_Screenshots_Page.pdf'),
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '12mm', right: '12mm' }
    });
    fs.copyFileSync(
      path.join(ROOT, 'ReClaim_2_Screenshots_Page.pdf'),
      path.join(ROOT, 'docs', 'ReClaim_2_Screenshots_Page.pdf')
    );
    fs.copyFileSync(
      path.join(ROOT, 'ReClaim_2_Screenshots_Page.pdf'),
      path.join(ROOT, 'ReClaim_Evidence', 'ReClaim_2_Screenshots_Page.pdf')
    );
    console.log('-> Generated: ReClaim_2_Screenshots_Page.pdf (saved to root, docs/, and ReClaim_Evidence/)');

    console.log('\nAll PDF reports generated successfully!');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});

