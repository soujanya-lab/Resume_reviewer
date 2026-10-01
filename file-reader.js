const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function readResumeFile(file) {
  if (!file) throw new Error("Choose a resume file first.");
  if (file.size > MAX_FILE_SIZE) throw new Error("This file is larger than 10 MB. Choose a smaller resume file.");

  const extension = file.name.split(".").pop().toLowerCase();
  if (["txt", "md"].includes(extension)) return file.text();

  if (extension === "pdf") {
    if (!window.pdfjsLib) throw new Error("PDF support could not load. Check your internet connection and try again.");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const document = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    const text = pages.join("\n").trim();
    if (!text) throw new Error("No selectable text was found in this PDF. Try a text-based PDF or paste the resume text instead.");
    return text;
  }

  if (extension === "docx") {
    if (!window.mammoth) throw new Error("DOCX support could not load. Check your internet connection and try again.");
    const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    if (!result.value.trim()) throw new Error("No readable text was found in this DOCX file.");
    return result.value;
  }

  throw new Error("Unsupported file type. Choose a PDF, DOCX, TXT, or MD file.");
}