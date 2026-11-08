import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// Vite emits the local worker as an asset under the deployment's base path.
// A relative filesystem URL works in both the Pages and original server build.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function loadPdf(bytes: Uint8Array) {
  const resources = import.meta.env.PDFJS_RESOURCE_BASE as string | undefined;
  return pdfjs.getDocument({
    data: bytes.slice(),
    isEvalSupported: false,
    // Pages serves these resources locally; never consult a CDN for a document.
    ...(resources ? {
      cMapUrl: `${resources}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${resources}standard_fonts/`,
      wasmUrl: `${resources}wasm/`,
    } : {}),
  }).promise;
}
