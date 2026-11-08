import {
  PDFDocument,
  PDFTextField,
  StandardFonts,
  degrees,
  rgb,
} from "pdf-lib";

export type ByteFile = {
  name: string;
  bytes: Uint8Array;
  type: string;
};

export type PagePlan = {
  sourceIndex: number;
  rotation: number;
};

export type FormField = {
  name: string;
  value: string;
  kind: string;
};

export async function mergePdfs(files: ByteFile[]): Promise<Uint8Array> {
  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(file.bytes, {
      ignoreEncryption: true,
    });
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  return output.save({ useObjectStreams: true });
}

export function parsePageGroups(
  expression: string,
  pageCount: number,
): number[][] {
  if (!expression.trim()) {
    return Array.from({ length: pageCount }, (_, index) => [index]);
  }

  return expression.split(",").map((rawGroup) => {
    const group = rawGroup.trim();
    if (/^\d+$/.test(group)) {
      const page = Number(group);
      if (page < 1 || page > pageCount) {
        throw new Error(`Page ${page} is outside this document.`);
      }
      return [page - 1];
    }

    const match = group.match(/^(\d+)-(\d+)$/);
    if (!match) {
      throw new Error("Use page groups such as 1-3,4,5-8.");
    }
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start < 1 || end < start || end > pageCount) {
      throw new Error(`Invalid page group ${group}.`);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
  });
}

export async function splitPdf(
  bytes: Uint8Array,
  expression: string,
): Promise<Uint8Array[]> {
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const groups = parsePageGroups(expression, source.getPageCount());
  return Promise.all(
    groups.map(async (indices) => {
      const output = await PDFDocument.create();
      const pages = await output.copyPages(source, indices);
      pages.forEach((page) => output.addPage(page));
      return output.save({ useObjectStreams: true });
    }),
  );
}

export async function arrangePdf(
  bytes: Uint8Array,
  plan: PagePlan[],
): Promise<Uint8Array> {
  if (plan.length === 0) {
    throw new Error("Keep at least one page.");
  }
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const output = await PDFDocument.create();
  for (const item of plan) {
    const [page] = await output.copyPages(source, [item.sourceIndex]);
    page.setRotation(degrees(normalizeRotation(item.rotation)));
    output.addPage(page);
  }
  return output.save({ useObjectStreams: true });
}

export async function cropPdf(
  bytes: Uint8Array,
  insetPoints: number,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true });
  for (const page of document.getPages()) {
    const { width, height } = page.getSize();
    const inset = Math.max(0, Math.min(insetPoints, width / 2 - 1, height / 2 - 1));
    page.setCropBox(inset, inset, width - inset * 2, height - inset * 2);
  }
  return document.save({ useObjectStreams: true });
}

export async function addText(
  bytes: Uint8Array,
  pageIndex: number,
  text: string,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const page = document.getPage(pageIndex);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  page.drawText(text, {
    x: 52,
    y: Math.max(52, height - 110),
    size: 16,
    font,
    color: rgb(0.08, 0.1, 0.16),
    maxWidth: page.getWidth() - 104,
    lineHeight: 21,
  });
  return document.save({ useObjectStreams: true });
}

export async function addSignature(
  bytes: Uint8Array,
  pageIndex: number,
  signature: string,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const page = document.getPage(pageIndex);
  const font = await document.embedFont(StandardFonts.TimesRomanItalic);
  page.drawText(signature, {
    x: 56,
    y: 64,
    size: 30,
    font,
    color: rgb(0.08, 0.1, 0.16),
  });
  page.drawLine({
    start: { x: 54, y: 57 },
    end: { x: Math.min(330, 72 + signature.length * 16), y: 57 },
    thickness: 0.7,
    color: rgb(0.25, 0.28, 0.34),
  });
  return document.save({ useObjectStreams: true });
}

export async function repairPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const source = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, source.getPageIndices());
  pages.forEach((page) => output.addPage(page));
  output.setProducer("PDF Manager Private Repair");
  return output.save({ useObjectStreams: true, addDefaultPage: false });
}

export async function readFormFields(bytes: Uint8Array): Promise<FormField[]> {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return document
    .getForm()
    .getFields()
    .map((field) => ({
      name: field.getName(),
      value: field instanceof PDFTextField ? field.getText() ?? "" : "",
      kind: field.constructor.name.replace(/^PDF/, ""),
    }));
}

export async function fillFormFields(
  bytes: Uint8Array,
  values: Record<string, string>,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = document.getForm();
  const font = await document.embedFont(StandardFonts.Helvetica);
  for (const [name, value] of Object.entries(values)) {
    const field = form.getFieldMaybe(name);
    if (field instanceof PDFTextField) {
      field.setText(value);
    }
  }
  form.updateFieldAppearances(font);
  return document.save({ useObjectStreams: true });
}

export async function imageFilesToPdf(files: ByteFile[]): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  for (const file of files) {
    const normalized = await normalizeImage(file);
    const image =
      normalized.type === "image/png"
        ? await document.embedPng(normalized.bytes)
        : await document.embedJpg(normalized.bytes);
    const page = document.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }
  return document.save({ useObjectStreams: true });
}

export async function pageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPageCount();
}

export async function extractText(bytes: Uint8Array): Promise<string> {
  const { loadPdf } = await import("./pdfjs");
  const document = await loadPdf(bytes);
  try {
    const pages: string[] = [];
    for (let index = 1; index <= document.numPages; index += 1) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
      );
    }
    return pages.filter(Boolean).join("\n\n");
  } finally {
    await document.destroy();
  }
}

export function summarizeText(text: string, sentenceLimit = 6): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) {
    throw new Error("No selectable text was found. Scanned PDFs need OCR first.");
  }
  const sentences =
    clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((value) => value.trim()) ?? [clean];
  if (sentences.length <= sentenceLimit) {
    return sentences.join(" ");
  }
  const words = clean
    .toLowerCase()
    .match(/[a-zÀ-ž][a-zÀ-ž'-]{2,}/g) ?? [];
  const stopWords = new Set([
    "the", "and", "that", "this", "with", "from", "have", "will", "were", "been",
    "for", "are", "but", "not", "you", "your", "their", "they", "our", "its",
    "into", "about", "than", "then", "also", "which", "when", "where", "what",
  ]);
  const frequency = new Map<string, number>();
  words.forEach((word) => {
    if (!stopWords.has(word)) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  });
  return sentences
    .map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().match(/[a-zÀ-ž][a-zÀ-ž'-]{2,}/g) ?? [];
      const score =
        sentenceWords.reduce((sum, word) => sum + (frequency.get(word) ?? 0), 0) /
        Math.max(sentenceWords.length, 1);
      return { sentence, index, score: score + (index < 2 ? 0.2 : 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceLimit)
    .sort((a, b) => a.index - b.index)
    .map(({ sentence }) => sentence)
    .join(" ");
}

export async function createDocxFromText(text: string): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.folder("_rels")?.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  const paragraphs = text
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(paragraph)}</w:t></w:r></w:p>`,
    )
    .join("");
  zip.folder("word")?.file(
    "document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`,
  );
  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export async function wordToPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const mammoth = await import("mammoth/mammoth.browser");
  const { value } = await mammoth.extractRawText({
    arrayBuffer: new Uint8Array(bytes).buffer,
  });
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const lines = pdf.splitTextToSize(value.trim(), 500) as string[];
  let y = 68;
  pdf.setFont("times", "normal");
  pdf.setFontSize(12);
  for (const line of lines) {
    if (y > 730) {
      pdf.addPage();
      y = 68;
    }
    pdf.text(line, 56, y);
    y += 17;
  }
  return new Uint8Array(pdf.output("arraybuffer"));
}

async function normalizeImage(file: ByteFile): Promise<ByteFile> {
  if (file.type === "image/png" || file.type === "image/jpeg") {
    return file;
  }
  if (typeof document === "undefined") {
    throw new Error(`${file.name} needs browser image conversion.`);
  }
  const blob = new Blob([file.bytes.slice()], { type: file.type });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image conversion is unavailable.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const jpeg = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Image conversion failed."))),
      "image/jpeg",
      0.92,
    );
  });
  return {
    name: file.name,
    bytes: new Uint8Array(await jpeg.arrayBuffer()),
    type: "image/jpeg",
  };
}

function normalizeRotation(rotation: number): number {
  return ((rotation % 360) + 360) % 360;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
