const STOP_WORDS = new Set(`a an and are as at be been being by for from had has have he her hers him his i in into is it its me my of on or our ours she that the their theirs them they this to was we were which who will with you your yours about above after again against all am any because before below between both but can did do does doing down during each few further here how if more most no nor not off once only other out over own same so some such than then there these through too under until up very what when where while why would`.split(" "));

const SECTION_PATTERNS = {
  Contact: /\b(contact|email|phone|linkedin|github|portfolio)\b/i,
  Summary: /\b(summary|profile|professional summary|objective|about me)\b/i,
  Experience: /\b(experience|employment|work history|professional history)\b/i,
  Education: /\b(education|academic|university|college)\b/i,
  Skills: /\b(skills|technical skills|core competencies|technologies)\b/i,
  Projects: /\b(projects|selected projects|personal projects)\b/i,
  Certifications: /\b(certifications?|licenses?|credentials)\b/i,
};

const ACTION_VERBS = new Set(`achieved analyzed automated built collaborated created decreased delivered designed developed drove enabled established exceeded executed expanded generated improved increased initiated launched led managed optimized organized produced reduced resolved streamlined transformed`.split(" "));
const WEAK_PHRASES = ["responsible for", "worked on", "helped with", "assisted with"];

function normalizeText(text) {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9+#.\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function extractKeywords(jobDescription, limit = 30) {
  const normalized = normalizeText(jobDescription);
  const words = normalized.match(/[a-z][a-z0-9+#.-]*/g) || [];
  const candidates = new Map();

  words.forEach((word, index) => {
    if (word.length > 1 && !STOP_WORDS.has(word)) {
      candidates.set(word, (candidates.get(word) || 0) + 1);
    }
    const next = words[index + 1];
    if (next && !STOP_WORDS.has(word) && !STOP_WORDS.has(next) && word.length > 1 && next.length > 1) {
      const phrase = `${word} ${next}`;
      candidates.set(phrase, (candidates.get(phrase) || 0) + 1);
    }
  });

  return [...candidates.entries()]
    .map(([keyword, frequency]) => ({ keyword, frequency, words: keyword.split(" ").length }))
    .sort((a, b) => (b.words - a.words) || (b.frequency - a.frequency) || a.keyword.localeCompare(b.keyword))
    .slice(0, limit)
    .map(({ keyword }) => keyword);
}

function findContactInfo(text) {
  const emails = [...new Set(text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) || [])];
  const phones = [...new Set(text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [])].map((phone) => phone.trim());
  const links = [...new Set(text.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/\S+|github\.com\/\S+|[\w-]+\.com\/\S+)/gi) || [])];
  return { emails, phones, links };
}

function getWordCount(text) {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}+#.'-]*/gu) || []).length;
}

function getResumeStatistics(text) {
  const words = getWordCount(text);
  const sentences = (text.match(/[.!?]+(?=\s|$)/g) || []).length;
  const bullets = (text.match(/^\s*(?:[-*•▪]|\d+[.)])\s+/gm) || []).length;
  return { words, characters: text.length, sentences, bullets };
}

export function analyzeResume(resumeText, jobDescription) {
  if (!resumeText.trim() || !jobDescription.trim()) {
    throw new Error("Add both your resume and the job description before analyzing.");
  }

  const normalizedResume = normalizeText(resumeText);
  const keywords = extractKeywords(jobDescription);
  const matchedKeywords = keywords.filter((keyword) => normalizedResume.includes(normalizeText(keyword)));
  const missingKeywords = keywords.filter((keyword) => !matchedKeywords.includes(keyword));
  const keywordScore = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 100) : 0;
  const sections = Object.fromEntries(Object.entries(SECTION_PATTERNS).map(([name, pattern]) => [name, pattern.test(resumeText)]));
  const contact = findContactInfo(resumeText);
  const metrics = [...new Set(resumeText.match(/\b\d+(?:[,.]\d+)?\s?(?:%|percent|x|\+|k|m|million|billion|users|customers|clients|projects|people|hours|days|years)?\b/gi) || [])];
  const foundActionVerbs = [...new Set((normalizedResume.match(/[a-z]+/g) || []).filter((word) => ACTION_VERBS.has(word)))];
  const weakPhrases = WEAK_PHRASES.filter((phrase) => normalizedResume.includes(phrase));
  const statistics = getResumeStatistics(resumeText);

  let healthScore = 0;
  healthScore += Object.values(sections).filter(Boolean).length / Object.keys(sections).length * 35;
  healthScore += (contact.emails.length || contact.phones.length ? 1 : 0) * 15;
  healthScore += Math.min(metrics.length / 4, 1) * 20;
  healthScore += Math.min(foundActionVerbs.length / 6, 1) * 15;
  healthScore += (statistics.words >= 100 && statistics.words <= 1000 ? 1 : statistics.words >= 50 ? 0.5 : 0) * 15;
  healthScore -= Math.min(weakPhrases.length * 5, 15);
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  const overallScore = Math.round(keywordScore * 0.55 + healthScore * 0.45);
  const suggestions = [];
  if (missingKeywords.length) suggestions.push(`Consider adding relevant experience with: ${missingKeywords.slice(0, 5).join(", ")}.`);
  if (!contact.emails.length || !contact.phones.length) suggestions.push(`Make your contact details easy to find${!contact.emails.length ? " by adding an email address" : ""}${!contact.phones.length ? `${!contact.emails.length ? " and" : ""} a phone number` : ""}.`);
  if (Object.values(sections).filter(Boolean).length < 5) suggestions.push("Use clear section headings so recruiters and screening systems can scan your experience quickly.");
  if (!metrics.length) suggestions.push("Add measurable results, such as percentages, volume, time saved, or project scope, to show your impact.");
  if (weakPhrases.length) suggestions.push(`Replace vague wording such as “${weakPhrases.join("”, “")}” with specific actions and outcomes.`);
  if (statistics.words < 50) suggestions.push("Add more detail about your responsibilities, results, and relevant skills.");
  if (!suggestions.length) suggestions.push("Good foundation. Tailor your strongest accomplishments to the most important needs in this role.");

  return {
    keywordScore,
    healthScore,
    overallScore,
    matchedKeywords,
    missingKeywords,
    sections,
    contact,
    metrics,
    actionVerbs: foundActionVerbs,
    weakPhrases,
    suggestions,
    statistics,
    analyzedAt: new Date().toISOString(),
  };
}