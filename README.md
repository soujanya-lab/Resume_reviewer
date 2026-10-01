# Folio / Resume Review Studio

A private, browser-based resume reviewer that compares resume content with a target job description. It highlights keyword alignment, resume structure, contact details, measurable impact, and practical ways to strengthen the application. All analysis runs on your device; completed reviews are stored in your browser.

## Features

- Upload PDF, DOCX, TXT, or Markdown resumes, or paste and edit resume text directly.
- Compare role-specific keywords and see matched and missing terms.
- Review section coverage, contact details, action verbs, measurable achievements, and weak phrases.
- Get keyword match, resume health, and combined overall scores with targeted suggestions.
- See word, character, sentence, bullet, and metric counts.
- Save reviews locally, remove individual entries, or clear the archive.
- Responsive, keyboard-accessible interface with sample content and useful validation errors.
- No account, backend, or resume upload to a remote service.

## Technologies

- Semantic HTML5
- CSS3 with responsive layouts
- Vanilla JavaScript ES modules
- IndexedDB for local review storage
- PDF.js for text-based PDF extraction
- Mammoth.js for DOCX text extraction

## Project structure

```text
Resume-Reviewer/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── analysis.js
│   ├── database.js
│   └── file-reader.js
├── assets/
│   └── screenshots/
│       └── resume-review-desktop.png
├── README.md
└── .gitignore
```

## Setup and run in VS Code

1. Open the `Resume-Reviewer` folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Open `index.html`, then select **Go Live** in the VS Code status bar (or right-click the file and choose **Open with Live Server**).
4. Use the local URL opened by Live Server. ES modules and IndexedDB require the page to run from a local web server; opening the HTML directly with `file://` is not supported.
5. PDF.js and Mammoth.js are loaded from CDNs, so an internet connection is needed for PDF and DOCX support. TXT/MD reading and analysis work without those libraries.

No package installation or build step is required.

## How to use

1. Choose a resume file or paste resume text into the resume field. Uploaded text can be edited before analysis.
2. Paste the target job description into its field.
3. Select **Analyze resume**. The analysis appears in the right-hand panel and the completed review is saved in the local archive.
4. Use **Load sample** to populate example inputs, or **Clear inputs** to reset the current form and results.
5. Delete a single saved entry with its `×` button or select **Delete all** to clear the archive.

## Example input

**Resume excerpt**

```text
Jordan Lee | jordan.lee@email.com | (415) 555-0138
EXPERIENCE
Product Analyst, Northstar Labs
- Built SQL dashboards used by 6 product teams, reducing reporting time by 35%.
SKILLS
SQL, Python, Tableau, experimentation, product analytics
EDUCATION
B.S. in Statistics, University of Oregon
```

**Job description excerpt**

```text
Seeking a Product Analyst to define product metrics, analyze customer behavior,
write SQL queries, build dashboards, design A/B tests, and communicate findings
to cross-functional stakeholders. Python and Tableau experience are a plus.
```

## Expected output

The review reports three scores, a list of matched and missing job-description terms, detected resume sections and contact information, metrics and action verbs found, any weak phrases, resume statistics, and improvement suggestions. Scores are heuristic indicators to guide editing, not hiring predictions or guarantees.

## JavaScript modules

- `js/app.js` connects the form, file upload, results display, sample and clear actions, and saved review controls.
- `js/analysis.js` extracts job-description terms, compares them with resume text, evaluates sections and writing signals, and calculates scores and suggestions.
- `js/database.js` opens the IndexedDB database and provides add, list, delete, and clear operations.
- `js/file-reader.js` extracts text from PDF and DOCX with the CDN libraries, and reads TXT/MD using the browser File API.

## Browser storage and privacy

Reviews are stored in the browser's IndexedDB under the `folio-review-studio` database. The saved entry contains the resume text, job description, analysis, and timestamp so it can be retained locally. Data is isolated to the browser profile and site origin, is not synced to a backend, and may be removed by clearing browser site data. Use **Delete all** to remove saved entries from the application. Avoid using shared browser profiles for sensitive resumes.

Resume analysis itself happens locally. External resources are PDF.js and Mammoth.js from cdnjs, and typography from Google Fonts; loading these resources contacts their respective providers. TXT/MD reading and the analysis engine do not require either parser library.

## External libraries

- [PDF.js 3.11.174](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js) via cdnjs
- [Mammoth.js 1.8.0](https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js) via cdnjs
- DM Sans, Manrope, and DM Mono via Google Fonts

## Screenshots

<img src="assets/screenshots/resume-review-desktop.png" alt="Resume Reviewer desktop screenshot" width="100%">

## Future improvements

- Add downloadable review reports and side-by-side resume editing.
- Improve phrase extraction and weighting with configurable role-specific vocabularies.
- Add optional resume version labels and search across saved reviews.
- Add automated tests for analysis edge cases and browser storage behavior.
- Offer local OCR guidance for image-only PDFs.