import { analyzeResume } from "./analysis.js";
import { addReview, deleteAllReviews, deleteReview, getAllReviews } from "./database.js";
import { readResumeFile } from "./file-reader.js";

const elements = {
  resumeFile: document.querySelector("#resume-file"),
  resumeText: document.querySelector("#resume-text"),
  jobDescription: document.querySelector("#job-description"),
  uploadZone: document.querySelector("#upload-zone"),
  uploadMain: document.querySelector("#upload-main"),
  fileStatus: document.querySelector("#file-status"),
  resumeCount: document.querySelector("#resume-count"),
  jobCount: document.querySelector("#job-count"),
  analyzeButton: document.querySelector("#analyze-button"),
  sampleButton: document.querySelector("#sample-button"),
  clearButton: document.querySelector("#clear-button"),
  deleteAllButton: document.querySelector("#delete-all-button"),
  formMessage: document.querySelector("#form-message"),
  resultsContent: document.querySelector("#results-content"),
  resultsPanel: document.querySelector("#results-panel"),
  resultsState: document.querySelector("#results-state"),
  savedReviews: document.querySelector("#saved-reviews"),
  savedCount: document.querySelector("#saved-count"),
};

const sampleResume = `Jordan Lee\nProduct Analyst | jordan.lee@email.com | (415) 555-0138 | linkedin.com/in/jordanlee\n\nSUMMARY\nProduct analyst with 4 years of experience translating customer behavior into product decisions. Skilled in SQL, experimentation, and cross-functional collaboration.\n\nEXPERIENCE\nSenior Product Analyst | Northstar Labs | 2022–Present\n- Built SQL dashboards used by 6 product teams, reducing weekly reporting time by 35%.\n- Designed and analyzed 18 A/B tests, contributing to a 12% increase in trial conversion.\n- Partnered with engineering and design to prioritize a roadmap serving 120,000 monthly users.\n\nProduct Analyst | Brightside | 2020–2022\n- Automated recurring reports and improved data accuracy across 3 business units.\n- Analyzed customer cohorts to identify onboarding friction and recommend product improvements.\n\nEDUCATION\nB.S. in Statistics | University of Oregon | 2020\n\nSKILLS\nSQL, Python, Tableau, Amplitude, experimentation, product analytics, stakeholder management\n\nPROJECTS\nCustomer retention analysis: developed a cohort model to track retention trends across 12 months.\n\nCERTIFICATIONS\nGoogle Data Analytics Professional Certificate`;

const sampleJob = `We are looking for a Product Analyst to help our product team make thoughtful, data-informed decisions. You will analyze customer behavior, define product metrics, and translate insights into clear recommendations.\n\nResponsibilities\n- Write SQL queries and build dashboards to monitor product performance and KPIs.\n- Design experiments and partner with engineering, design, and product managers on A/B testing.\n- Analyze customer cohorts, funnel conversion, and retention trends.\n- Communicate findings to stakeholders and influence the product roadmap.\n\nQualifications\n- 3+ years of experience in product analytics or data analysis.\n- Strong SQL skills; experience with Python, Tableau, or Amplitude is a plus.\n- Proven ability to turn complex data into actionable insights.\n- Excellent communication and cross-functional collaboration skills.`;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function updateWordCounts() {
  const countWords = (value) => (value.trim().match(/\S+/g) || []).length;
  elements.resumeCount.textContent = `${countWords(elements.resumeText.value)} words`;
  elements.jobCount.textContent = `${countWords(elements.jobDescription.value)} words`;
}

function showMessage(message = "") {
  elements.formMessage.textContent = message;
  elements.formMessage.hidden = !message;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function renderTagList(values, isMissing = false) {
  if (!values.length) return `<span class="tag-empty">${isMissing ? "No missing keywords" : "None detected"}</span>`;
  return values.map((value) => `<span class="keyword-tag${isMissing ? " missing" : ""}">${escapeHTML(value)}</span>`).join("");
}

function renderResults(review) {
  const sectionMarkup = Object.entries(review.sections).map(([name, found]) => `<div class="section-item${found ? " found" : ""}"><span class="section-check" aria-hidden="true">${found ? "✓" : "·"}</span>${escapeHTML(name)}</div>`).join("");
  const contactValues = [...review.contact.emails, ...review.contact.phones, ...review.contact.links];
  const contactText = contactValues.length ? contactValues.join(" · ") : "No email, phone, or professional link detected";
  const metricText = review.metrics.length ? review.metrics.slice(0, 6).join(" · ") : "No measurable results detected";
  const actionText = review.actionVerbs.length ? review.actionVerbs.slice(0, 8).join(", ") : "No action verbs detected";

  elements.resultsContent.innerHTML = `
    <div class="score-overview">
      <div class="score-card overall-card"><span class="score-label">Overall score</span><span class="score-value">${review.overallScore}<small>/100</small></span><span class="score-caption">Role + resume fit</span></div>
      <div class="score-card"><span class="score-label">Keyword match</span><span class="score-value">${review.keywordScore}<small>%</small></span><span class="score-caption">Relevant terms found</span></div>
      <div class="score-card"><span class="score-label">Resume health</span><span class="score-value">${review.healthScore}<small>/100</small></span><span class="score-caption">Structure + impact</span></div>
    </div>
    <div class="result-block">
      <div class="result-title-row"><h3 class="result-title">Keyword alignment</h3><span class="result-meta">${review.matchedKeywords.length} / ${review.matchedKeywords.length + review.missingKeywords.length} matched</span></div>
      <div class="progress-track" role="progressbar" aria-label="Keyword match score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${review.keywordScore}"><div class="progress-fill" style="width:${review.keywordScore}%"></div></div>
      <div class="keyword-columns"><div><p class="keyword-heading">Matched</p><div class="tag-list">${renderTagList(review.matchedKeywords.slice(0, 10))}</div></div><div><p class="keyword-heading">Worth adding</p><div class="tag-list">${renderTagList(review.missingKeywords.slice(0, 10), true)}</div></div></div>
    </div>
    <div class="result-block">
      <div class="result-title-row"><h3 class="result-title">Resume sections</h3><span class="result-meta">${Object.values(review.sections).filter(Boolean).length} / ${Object.keys(review.sections).length} found</span></div>
      <div class="section-grid">${sectionMarkup}</div>
    </div>
    <div class="result-block">
      <div class="detail-grid"><div><p class="detail-label">Contact details</p><p class="detail-value">${escapeHTML(contactText)}</p></div><div><p class="detail-label">Action verbs</p><p class="detail-value">${escapeHTML(actionText)}</p></div><div><p class="detail-label">Measurable results</p><p class="detail-value">${escapeHTML(metricText)}</p></div><div><p class="detail-label">Weak phrases</p><p class="detail-value">${review.weakPhrases.length ? escapeHTML(review.weakPhrases.join(", ")) : "None detected"}</p></div></div>
    </div>
    <div class="result-block">
      <div class="result-title-row"><h3 class="result-title">Ways to strengthen it</h3></div>
      <ul class="suggestion-list">${review.suggestions.map((suggestion) => `<li>${escapeHTML(suggestion)}</li>`).join("")}</ul>
    </div>
    <div class="result-block">
      <div class="result-title-row"><h3 class="result-title">Resume snapshot</h3><span class="result-meta">${review.statistics.characters.toLocaleString()} characters</span></div>
      <div class="stats-row"><div class="stat-item"><span class="stat-value">${review.statistics.words}</span><span class="stat-label">Words</span></div><div class="stat-item"><span class="stat-value">${review.statistics.sentences}</span><span class="stat-label">Sentences</span></div><div class="stat-item"><span class="stat-value">${review.statistics.bullets}</span><span class="stat-label">Bullets</span></div><div class="stat-item"><span class="stat-value">${review.metrics.length}</span><span class="stat-label">Metrics</span></div></div>
    </div>`;
  elements.resultsState.innerHTML = '<span class="state-dot"></span> REVIEW COMPLETE';
  elements.resultsState.classList.add("is-ready");
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function renderSavedReviews() {
  try {
    const reviews = await getAllReviews();
    elements.savedCount.textContent = String(reviews.length);
    elements.deleteAllButton.disabled = reviews.length === 0;
    if (!reviews.length) {
      elements.savedReviews.innerHTML = '<p class="saved-empty">Your completed reviews will appear here.</p>';
      return;
    }
    elements.savedReviews.innerHTML = reviews.map((review) => `<article class="saved-review"><span class="saved-score" aria-label="Score ${review.overallScore} out of 100">${review.overallScore}</span><div class="saved-info"><span class="saved-role">${escapeHTML(review.label)}</span><span class="saved-date">${escapeHTML(formatDate(review.analyzedAt))}</span><span class="saved-match">${review.keywordScore}% keyword match · ${review.matchedKeywords.length} terms matched</span></div><button class="saved-delete" type="button" data-delete-id="${escapeHTML(review.id)}" aria-label="Delete review for ${escapeHTML(review.label)}" title="Delete review">×</button></article>`).join("");
  } catch (error) {
    elements.savedReviews.innerHTML = `<p class="saved-empty">Could not load saved reviews: ${escapeHTML(error.message)}</p>`;
  }
}

async function analyzeCurrentResume() {
  showMessage();
  const resumeText = elements.resumeText.value.trim();
  const jobDescription = elements.jobDescription.value.trim();
  if (!resumeText || !jobDescription) {
    showMessage("Add both your resume and the job description before analyzing.");
    (!resumeText ? elements.resumeText : elements.jobDescription).focus();
    return;
  }

  elements.analyzeButton.disabled = true;
  elements.resultsPanel.classList.add("loading");
  elements.resultsPanel.setAttribute("aria-busy", "true");
  elements.resultsState.innerHTML = '<span class="state-dot"></span> ANALYZING';
  elements.resultsState.classList.remove("is-ready");
  try {
    const analysis = analyzeResume(resumeText, jobDescription);
    const firstLine = resumeText.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    const review = {
      id: createId(),
      label: firstLine?.slice(0, 80) || "Resume review",
      analyzedAt: analysis.analyzedAt,
      resumeText,
      jobDescription,
      ...analysis,
    };
    renderResults(review);
    await addReview(review);
    await renderSavedReviews();
  } catch (error) {
    showMessage(`Analysis could not be completed: ${error.message}`);
    elements.resultsState.innerHTML = '<span class="state-dot"></span> NOT SAVED';
  } finally {
    elements.analyzeButton.disabled = false;
    elements.resultsPanel.classList.remove("loading");
    elements.resultsPanel.setAttribute("aria-busy", "false");
  }
}

async function handleFile(file) {
  if (!file) return;
  showMessage();
  elements.fileStatus.textContent = `Reading ${file.name}...`;
  try {
    const text = await readResumeFile(file);
    elements.resumeText.value = text;
    elements.uploadMain.innerHTML = `<span>${escapeHTML(file.name)}</span>`;
    elements.fileStatus.textContent = `${(file.size / 1024).toFixed(1)} KB · Ready to review`;
    updateWordCounts();
  } catch (error) {
    elements.fileStatus.textContent = "Your resume stays on this device";
    showMessage(error.message);
  }
}

function clearInputs() {
  elements.resumeFile.value = "";
  elements.resumeText.value = "";
  elements.jobDescription.value = "";
  elements.uploadMain.innerHTML = 'Drop a file here or <span>browse</span>';
  elements.fileStatus.textContent = "Your resume stays on this device";
  elements.resultsContent.innerHTML = `<div class="empty-results"><div class="empty-graphic" aria-hidden="true"><span class="graphic-sheet"></span><span class="graphic-lens"></span><span class="graphic-spark">✳</span></div><p class="empty-kicker">A clearer picture starts here</p><p class="empty-copy">Add your resume and a job description to get a practical, role-specific review.</p><div class="empty-rule"><span></span><span></span><span></span></div><p class="empty-foot">KEYWORDS <b>·</b> STRUCTURE <b>·</b> IMPACT</p></div>`;
  elements.resultsState.innerHTML = '<span class="state-dot"></span> AWAITING INPUT';
  elements.resultsState.classList.remove("is-ready");
  showMessage();
  updateWordCounts();
}

elements.resumeFile.addEventListener("change", (event) => handleFile(event.target.files[0]));
elements.resumeText.addEventListener("input", updateWordCounts);
elements.jobDescription.addEventListener("input", updateWordCounts);
elements.analyzeButton.addEventListener("click", analyzeCurrentResume);
elements.sampleButton.addEventListener("click", () => {
  elements.resumeText.value = sampleResume;
  elements.jobDescription.value = sampleJob;
  elements.resumeFile.value = "";
  elements.uploadMain.innerHTML = 'Drop a file here or <span>browse</span>';
  elements.fileStatus.textContent = "Sample resume loaded · edit as needed";
  showMessage();
  updateWordCounts();
});
elements.clearButton.addEventListener("click", clearInputs);
elements.uploadZone.addEventListener("dragover", (event) => { event.preventDefault(); elements.uploadZone.classList.add("is-dragging"); });
elements.uploadZone.addEventListener("dragleave", () => elements.uploadZone.classList.remove("is-dragging"));
elements.uploadZone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.uploadZone.classList.remove("is-dragging");
  handleFile(event.dataTransfer.files[0]);
});
elements.savedReviews.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;
  try {
    await deleteReview(button.dataset.deleteId);
    await renderSavedReviews();
  } catch (error) {
    showMessage(`Could not delete this review: ${error.message}`);
  }
});
elements.deleteAllButton.addEventListener("click", async () => {
  try {
    await deleteAllReviews();
    await renderSavedReviews();
  } catch (error) {
    showMessage(`Could not delete saved reviews: ${error.message}`);
  }
});

updateWordCounts();
renderSavedReviews();