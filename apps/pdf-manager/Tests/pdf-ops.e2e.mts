import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  addSignature,
  addText,
  arrangePdf,
  cropPdf,
  fillFormFields,
  imageFilesToPdf,
  mergePdfs,
  pageCount,
  parsePageGroups,
  readFormFields,
  repairPdf,
  splitPdf,
  summarizeText,
} from "../lib/pdf-ops";

async function fixturePdf(labels: string[]): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  labels.forEach((label) => {
    const page = document.addPage([612, 792]);
    page.drawText(label, { x: 64, y: 700, size: 24, font });
  });
  return document.save();
}

const first = await fixturePdf(["Alpha", "Beta"]);
const second = await fixturePdf(["Gamma"]);

const merged = await mergePdfs([
  { name: "first.pdf", type: "application/pdf", bytes: first },
  { name: "second.pdf", type: "application/pdf", bytes: second },
]);
assert.equal(await pageCount(merged), 3);

assert.deepEqual(parsePageGroups("1-2,3", 3), [[0, 1], [2]]);
const parts = await splitPdf(merged, "1-2,3");
assert.equal(parts.length, 2);
assert.equal(await pageCount(parts[0]), 2);
assert.equal(await pageCount(parts[1]), 1);

const arranged = await arrangePdf(merged, [
  { sourceIndex: 2, rotation: 90 },
  { sourceIndex: 0, rotation: 0 },
]);
const arrangedDocument = await PDFDocument.load(arranged);
assert.equal(arrangedDocument.getPageCount(), 2);
assert.equal(arrangedDocument.getPage(0).getRotation().angle, 90);

const cropped = await cropPdf(first, 24);
const cropBox = (await PDFDocument.load(cropped)).getPage(0).getCropBox();
assert.equal(cropBox.x, 24);
assert.equal(cropBox.width, 564);

const edited = await addText(first, 0, "Approved");
const signed = await addSignature(edited, 0, "Alex Example");
assert.equal(await pageCount(signed), 2);
assert.ok((await repairPdf(signed)).byteLength > 0);

const formDocument = await PDFDocument.create();
const formPage = formDocument.addPage([612, 792]);
formDocument.getForm().createTextField("customer_name").addToPage(formPage, {
  x: 60,
  y: 680,
  width: 240,
  height: 32,
});
const formBytes = await formDocument.save();
assert.deepEqual((await readFormFields(formBytes)).map((field) => field.name), [
  "customer_name",
]);
const filled = await fillFormFields(formBytes, { customer_name: "Taylor" });
assert.equal(
  (await readFormFields(filled)).find((field) => field.name === "customer_name")
    ?.value,
  "Taylor",
);

const onePixelPng = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zr9sAAAAASUVORK5CYII=",
    "base64",
  ),
);
const imagePdf = await imageFilesToPdf([
  { name: "pixel.png", type: "image/png", bytes: onePixelPng },
]);
assert.equal(await pageCount(imagePdf), 1);

const summary = summarizeText(
  "Revenue increased this quarter. Revenue growth came from subscriptions. Costs stayed stable. The team launched a new product. Customer retention improved. The outlook remains positive. A new office opened.",
  3,
);
assert.ok(summary.split(/[.!?]/).filter(Boolean).length <= 3);

console.log("PASS: browser PDF engine end-to-end fixtures");
