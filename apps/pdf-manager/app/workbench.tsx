"use client";

import {
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  Combine,
  Crop,
  Download,
  FileImage,
  FileOutput,
  FilePenLine,
  FilePlus2,
  FileText,
  Files,
  Languages,
  LockKeyhole,
  LogOut,
  Menu,
  Minimize2,
  PenLine,
  Plus,
  RefreshCw,
  RotateCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatGPTUser } from "./chatgpt-auth";
import {
  type ByteFile,
  type FormField,
  type PagePlan,
  addSignature,
  addText,
  arrangePdf,
  createDocxFromText,
  cropPdf,
  extractText,
  fillFormFields,
  imageFilesToPdf,
  mergePdfs,
  pageCount,
  readFormFields,
  repairPdf,
  splitPdf,
  summarizeText,
  wordToPdf,
} from "../lib/pdf-ops";

type ToolId =
  | "organize"
  | "merge"
  | "split"
  | "compress"
  | "pdf-word"
  | "word-pdf"
  | "images-pdf"
  | "edit"
  | "sign"
  | "repair"
  | "crop"
  | "forms"
  | "summary"
  | "translate";

type ResultFile = {
  name: string;
  bytes: Uint8Array;
  type: string;
};

type Tool = {
  id: ToolId;
  name: string;
  description: string;
  icon: typeof Files;
  group: "Pages" | "Convert" | "Edit" | "AI";
};

const tools: Tool[] = [
  { id: "organize", name: "Organize pages", description: "Reorder, rotate, remove", icon: Files, group: "Pages" },
  { id: "merge", name: "Merge PDFs", description: "Combine complete files", icon: Combine, group: "Pages" },
  { id: "split", name: "Split & extract", description: "Create page groups", icon: Scissors, group: "Pages" },
  { id: "compress", name: "Compress PDF", description: "Reduce file size", icon: Minimize2, group: "Convert" },
  { id: "pdf-word", name: "PDF to Word", description: "Export editable text", icon: FileText, group: "Convert" },
  { id: "word-pdf", name: "Word to PDF", description: "Render a DOCX", icon: FileOutput, group: "Convert" },
  { id: "images-pdf", name: "Images to PDF", description: "JPG, PNG, HEIC & more", icon: FileImage, group: "Convert" },
  { id: "edit", name: "Edit PDF", description: "Add text to a page", icon: FilePenLine, group: "Edit" },
  { id: "sign", name: "Sign PDF", description: "Place a visual signature", icon: PenLine, group: "Edit" },
  { id: "repair", name: "Repair PDF", description: "Rebuild readable pages", icon: ArchiveRestore, group: "Edit" },
  { id: "crop", name: "Crop PDF", description: "Trim page edges", icon: Crop, group: "Edit" },
  { id: "forms", name: "PDF forms", description: "Fill interactive fields", icon: FilePlus2, group: "Edit" },
  { id: "summary", name: "Smart summary", description: "Summarize locally", icon: Sparkles, group: "AI" },
  { id: "translate", name: "Translate PDF", description: "Browser-native translation", icon: Languages, group: "AI" },
];

const MAX_AGE_MS = 60 * 60 * 1000;
const languageOptions = [
  { code: "en", label: "English" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
];

export function PDFWorkbench({ user }: { user?: ChatGPTUser }) {
  const [activeTool, setActiveTool] = useState<ToolId>("organize");
  const [files, setFiles] = useState<ByteFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [result, setResult] = useState<ResultFile | null>(null);
  const [status, setStatus] = useState("Files stay in this browser tab only.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(MAX_AGE_MS);
  const [mobileMenu, setMobileMenu] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const [workspaceGeneration, setWorkspaceGeneration] = useState(0);
  const activeFile = files[activeIndex] ?? null;
  const activeToolInfo = tools.find((tool) => tool.id === activeTool) ?? tools[0];
  const ActiveToolIcon = activeToolInfo.icon;

  const clearWorkspace = useCallback(() => {
    generation.current += 1;
    setWorkspaceGeneration(generation.current);
    if (fileInput.current) fileInput.current.value = "";
    setBusy(false);
    setFiles([]);
    setResult(null);
    setActiveIndex(0);
    setExpiresAt(null);
    setRemaining(MAX_AGE_MS);
    setStatus("Workspace cleared. Files and results removed.");
    setError("");
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const next = Math.max(0, expiresAt - Date.now());
      setRemaining(next);
      if (next === 0) {
        clearWorkspace();
      }
    };
    const interval = window.setInterval(tick, 1_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [clearWorkspace, expiresAt]);

  const importFiles = async (incoming: FileList | File[]) => {
    const importGeneration = generation.current;
    const accepted = Array.from(incoming).filter((file) =>
      /\.(pdf|docx|jpe?g|png|heic|webp|gif|bmp|tiff?)$/i.test(file.name),
    );
    if (!accepted.length) {
      setError("Choose PDF, DOCX, JPG, PNG, HEIC, WebP, GIF, BMP, or TIFF files.");
      return;
    }
    const loaded = await Promise.all(
      accepted.map(async (file) => ({
        name: file.name,
        bytes: new Uint8Array(await file.arrayBuffer()),
        type: file.type || mimeFromName(file.name),
      })),
    );
    if (generation.current !== importGeneration) return;
    if (fileInput.current) fileInput.current.value = "";
    setFiles((current) => [...current, ...loaded]);
    setActiveIndex(files.length);
    setExpiresAt((current) => current ?? Date.now() + MAX_AGE_MS);
    setResult(null);
    setError("");
    setStatus(`${loaded.length} file${loaded.length === 1 ? "" : "s"} ready in private memory.`);
  };

  const run = async (label: string, action: () => Promise<void>) => {
    const runGeneration = generation.current;
    setBusy(true);
    setError("");
    setStatus(label);
    try {
      await action();
    } catch (caught) {
      if (generation.current !== runGeneration) return;
      setError(caught instanceof Error ? caught.message : "Processing failed.");
      setStatus("Nothing was uploaded or saved.");
    } finally {
      if (generation.current === runGeneration) setBusy(false);
    }
  };

  const setCurrentResult = (next: ResultFile | null) => {
    if (generation.current === workspaceGeneration) setResult(next);
  };
  const setCurrentStatus = (next: string) => {
    if (generation.current === workspaceGeneration) setStatus(next);
  };
  const setPdfResult = (name: string, bytes: Uint8Array) => {
    setCurrentResult({ name, bytes, type: "application/pdf" });
    setCurrentStatus(`${name} is ready to download.`);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileMenu(true)} aria-label="Open tools">
          <Menu size={20} />
        </button>
        <a className="brand" href="#" aria-label="PDF Manager home">
          <span className="brand-mark"><FileText size={21} /></span>
          <span><strong>PDF</strong> Manager</span>
        </a>
        <div className="privacy-pill">
          <ShieldCheck size={15} />
          <span>Browser-only processing</span>
        </div>
        {user ? <div className="account">
          <span className="avatar">{initials(user.displayName)}</span>
          <span className="account-copy">
            <strong>{user.displayName}</strong>
            <small>Signed in with ChatGPT</small>
          </span>
          <a href="/signout-with-chatgpt?return_to=/" aria-label="Sign out"><LogOut size={17} /></a>
        </div> : <div className="account"><span className="account-copy"><strong>Local workspace</strong><small>Files stay on this device</small></span><LockKeyhole size={19} /></div>}
      </header>

      <aside className={`sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div className="mobile-sidebar-head">
          <span>Choose a tool</span>
          <button onClick={() => setMobileMenu(false)} aria-label="Close tools"><X size={19} /></button>
        </div>
        {(["Pages", "Convert", "Edit", "AI"] as const).map((group) => (
          <section className="tool-group" key={group}>
            <h2>{group}</h2>
            {tools.filter((tool) => tool.group === group).map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  className={`tool-button ${activeTool === tool.id ? "active" : ""}`}
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setMobileMenu(false);
                    setError("");
                  }}
                >
                  <span className="tool-icon"><Icon size={18} /></span>
                  <span><strong>{tool.name}</strong><small>{tool.description}</small></span>
                </button>
              );
            })}
          </section>
        ))}
        <div className="sidebar-note">
          <LockKeyhole size={16} />
          <p><strong>Zero file storage</strong><br />Files never leave this tab and auto-clear within one hour.</p>
        </div>
      </aside>

      <section className="workspace">
        <div className="workspace-head">
          <div>
            <span className="eyebrow">PRIVATE PDF WORKBENCH</span>
            <h1>{activeToolInfo.name}</h1>
            <p>{activeToolInfo.description}. Everything runs on this device.</p>
          </div>
          {expiresAt && (
            <div className="expiry">
              <Clock3 size={16} />
              <span>Auto-clear in <strong>{formatRemaining(remaining)}</strong></span>
              <button onClick={clearWorkspace}>Clear now</button>
            </div>
          )}
        </div>

        <div
          className={`drop-zone ${files.length ? "compact" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void importFiles(event.dataTransfer.files);
          }}
        >
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.docx,.jpg,.jpeg,.png,.heic,.webp,.gif,.bmp,.tif,.tiff"
            onChange={(event) => event.target.files && void importFiles(event.target.files)}
          />
          <span className="upload-orbit"><UploadCloud size={files.length ? 23 : 31} /></span>
          <div>
            <strong>{files.length ? "Add more files" : "Drop documents here"}</strong>
            <p>{files.length ? "Useful for merging or image conversion" : "PDF, Word, JPG, PNG, HEIC and more — up to your browser’s memory limit"}</p>
          </div>
          <button onClick={() => fileInput.current?.click()}>
            <Plus size={16} /> Choose files
          </button>
        </div>

        {files.length > 0 && (
          <div className="file-strip" aria-label="Files in workspace">
            {files.map((file, index) => (
              <button
                key={`${file.name}-${index}`}
                className={`file-chip ${activeIndex === index ? "active" : ""}`}
                onClick={() => setActiveIndex(index)}
              >
                {file.type === "application/pdf" ? <FileText size={17} /> : file.type.includes("image") ? <FileImage size={17} /> : <FileOutput size={17} />}
                <span><strong>{file.name}</strong><small>{formatBytes(file.bytes.byteLength)}</small></span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${file.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
                    setActiveIndex(0);
                  }}
                ><X size={14} /></span>
              </button>
            ))}
          </div>
        )}

        <div className="action-card">
          <div className="action-title">
            <span><ActiveToolIcon size={19} /></span>
            <div><h2>{activeToolInfo.name}</h2><p>{instructionFor(activeTool)}</p></div>
          </div>
          <ToolPanel
            key={workspaceGeneration}
            tool={activeTool}
            files={files}
            activeFile={activeFile}
            busy={busy}
            run={run}
            setPdfResult={setPdfResult}
            setResult={setCurrentResult}
            setStatus={setCurrentStatus}
          />
        </div>

        {(busy || error || result) && (
          <div className={`result-bar ${error ? "error" : result ? "success" : ""}`}>
            <span className="result-status">
              {busy ? <RefreshCw className="spin" size={18} /> : error ? <X size={18} /> : <Check size={18} />}
            </span>
            <div>
              <strong>{busy ? "Processing privately…" : error ? "Could not finish" : "Your file is ready"}</strong>
              <p>{error || status}</p>
            </div>
            {result && !busy && (
              <button onClick={() => downloadResult(result)}>
                <Download size={17} /> Download
              </button>
            )}
          </div>
        )}

        <div className="trust-grid">
          <article><ShieldCheck size={20} /><div><strong>No uploads</strong><p>File bytes stay in browser memory.</p></div></article>
          <article><BadgeCheck size={20} /><div><strong>{user ? "Private session" : "Public app, private files"}</strong><p>{user ? "ChatGPT sign-in gates the entire site." : "No account required. Documents stay in this tab."}</p></div></article>
          <article><Clock3 size={20} /><div><strong>One-hour maximum</strong><p>Automatic memory clearing, sooner on close.</p></div></article>
        </div>
      </section>
      {mobileMenu && <button className="sidebar-backdrop" onClick={() => setMobileMenu(false)} aria-label="Close tools" />}
    </main>
  );
}

function ToolPanel({
  tool,
  files,
  activeFile,
  busy,
  run,
  setPdfResult,
  setResult,
  setStatus,
}: {
  tool: ToolId;
  files: ByteFile[];
  activeFile: ByteFile | null;
  busy: boolean;
  run: (label: string, action: () => Promise<void>) => Promise<void>;
  setPdfResult: (name: string, bytes: Uint8Array) => void;
  setResult: (result: ResultFile | null) => void;
  setStatus: (status: string) => void;
}) {
  const pdfs = files.filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
  const images = files.filter((file) => file.type.startsWith("image/") || /\.(jpe?g|png|heic|webp|gif|bmp|tiff?)$/i.test(file.name));
  const [expression, setExpression] = useState("");
  const [quality, setQuality] = useState(0.62);
  const [inset, setInset] = useState(18);
  const [page, setPage] = useState(1);
  const [text, setText] = useState("");
  const [signature, setSignature] = useState("");
  const [pagePlan, setPagePlan] = useState<PagePlan[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState("");
  const [translation, setTranslation] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("de");

  useEffect(() => {
    setSummary("");
    setTranslation("");
    setFields([]);
    setFieldValues({});
    if (!activeFile || !isPdf(activeFile)) {
      setPagePlan([]);
      setThumbnails([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const count = await pageCount(activeFile.bytes);
      if (!cancelled) {
        setPagePlan(Array.from({ length: count }, (_, sourceIndex) => ({ sourceIndex, rotation: 0 })));
        setPage(Math.min(page, count));
      }
      if (tool === "organize") {
        const rendered = await renderThumbnails(activeFile.bytes);
        if (!cancelled) setThumbnails(rendered);
      }
      if (tool === "forms") {
        const nextFields = await readFormFields(activeFile.bytes);
        if (!cancelled) {
          setFields(nextFields);
          setFieldValues(Object.fromEntries(nextFields.map((field) => [field.name, field.value])));
        }
      }
    })().catch(() => {
      if (!cancelled) setThumbnails([]);
    });
    return () => { cancelled = true; };
  }, [activeFile, tool]);

  const primaryButton = (label: string, icon: React.ReactNode, onClick: () => void, disabled = false) => (
    <button className="primary-action" disabled={disabled || busy} onClick={onClick}>
      {icon}{label}
    </button>
  );

  if (tool === "merge") {
    return (
      <div className="panel-stack">
        <div className="selection-summary"><Files size={18} /><span><strong>{pdfs.length} PDFs selected</strong><small>They merge in the order shown above.</small></span></div>
        {primaryButton("Merge and prepare download", <Combine size={17} />, () =>
          void run("Combining pages in browser memory…", async () => {
            if (pdfs.length < 2) throw new Error("Add at least two PDFs.");
            setPdfResult("merged.pdf", await mergePdfs(pdfs));
          }), pdfs.length < 2)}
      </div>
    );
  }

  if (tool === "split") {
    return (
      <div className="panel-grid">
        <label><span>Page groups</span><input value={expression} onChange={(event) => setExpression(event.target.value)} placeholder="1-3,4,5-8" /><small>Leave blank to extract every page separately.</small></label>
        {primaryButton("Split PDF", <Scissors size={17} />, () =>
          void run("Extracting page groups…", async () => {
            const file = requirePdf(activeFile);
            const parts = await splitPdf(file.bytes, expression);
            if (parts.length === 1) {
              setPdfResult(`${baseName(file.name)}-part-1.pdf`, parts[0]);
              return;
            }
            const { default: JSZip } = await import("jszip");
            const zip = new JSZip();
            parts.forEach((bytes, index) => zip.file(`${baseName(file.name)}-part-${index + 1}.pdf`, bytes));
            const blob = await zip.generateAsync({ type: "uint8array" });
            setResult({ name: `${baseName(file.name)}-split.zip`, bytes: blob, type: "application/zip" });
            setStatus(`${parts.length} PDFs are ready in one ZIP download.`);
          }), !activeFile)}
      </div>
    );
  }

  if (tool === "organize") {
    const move = (index: number, offset: number) => {
      const target = index + offset;
      if (target < 0 || target >= pagePlan.length) return;
      setPagePlan((current) => {
        const next = [...current];
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
    };
    return (
      <div className="panel-stack">
        {!activeFile ? <EmptyHint /> : (
          <>
            <div className="page-grid">
              {pagePlan.map((item, index) => (
                <article className="page-tile" key={`${item.sourceIndex}-${index}`}>
                  <div className="page-preview">
                    {thumbnails[item.sourceIndex] ? <img src={thumbnails[item.sourceIndex]} alt={`Page ${item.sourceIndex + 1}`} style={{ transform: `rotate(${item.rotation}deg)` }} /> : <FileText size={28} />}
                  </div>
                  <div className="page-meta"><strong>Page {item.sourceIndex + 1}</strong><span>Position {index + 1}</span></div>
                  <div className="page-controls">
                    <button onClick={() => move(index, -1)} aria-label="Move left"><ArrowLeft size={14} /></button>
                    <button onClick={() => move(index, 1)} aria-label="Move right"><ArrowRight size={14} /></button>
                    <button onClick={() => setPagePlan((current) => current.map((value, itemIndex) => itemIndex === index ? { ...value, rotation: value.rotation + 90 } : value))} aria-label="Rotate"><RotateCw size={14} /></button>
                    <button onClick={() => setPagePlan((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove"><Trash2 size={14} /></button>
                  </div>
                </article>
              ))}
            </div>
            {primaryButton("Apply page changes", <WandSparkles size={17} />, () =>
              void run("Rebuilding page order…", async () => {
                const file = requirePdf(activeFile);
                setPdfResult(`${baseName(file.name)}-organized.pdf`, await arrangePdf(file.bytes, pagePlan));
              }), pagePlan.length === 0)}
          </>
        )}
      </div>
    );
  }

  if (tool === "compress") {
    return (
      <div className="panel-grid">
        <label><span>Compression quality</span><input type="range" min="0.35" max="0.86" step="0.01" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /><small>{quality < 0.5 ? "Small file" : quality > 0.75 ? "High quality" : "Balanced"} · pages are flattened</small></label>
        {primaryButton("Compress PDF", <Minimize2 size={17} />, () =>
          void run("Rasterizing and compressing locally…", async () => {
            const file = requirePdf(activeFile);
            setPdfResult(`${baseName(file.name)}-compressed.pdf`, await compressPdf(file.bytes, quality));
          }), !activeFile)}
      </div>
    );
  }

  if (tool === "pdf-word") {
    return (
      <div className="panel-stack">
        <Notice>Selectable text is preserved. Complex tables, columns, and images are simplified.</Notice>
        {primaryButton("Create Word document", <FileText size={17} />, () =>
          void run("Extracting text into DOCX…", async () => {
            const file = requirePdf(activeFile);
            const extracted = await extractText(file.bytes);
            if (!extracted) throw new Error("No selectable text was found. Scanned PDFs need OCR first.");
            const blob = await createDocxFromText(extracted);
            setResult({ name: `${baseName(file.name)}.docx`, bytes: new Uint8Array(await blob.arrayBuffer()), type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            setStatus("Editable Word document ready.");
          }), !activeFile)}
      </div>
    );
  }

  if (tool === "word-pdf") {
    const word = files.find((file) => file.name.toLowerCase().endsWith(".docx"));
    return (
      <div className="panel-stack">
        <Notice>Word text is rendered into clean letter-size pages. Advanced layout may be simplified.</Notice>
        {primaryButton("Convert Word to PDF", <FileOutput size={17} />, () =>
          void run("Rendering Word text locally…", async () => {
            if (!word) throw new Error("Add a DOCX file.");
            setPdfResult(`${baseName(word.name)}.pdf`, await wordToPdf(word.bytes));
          }), !word)}
      </div>
    );
  }

  if (tool === "images-pdf") {
    return (
      <div className="panel-stack">
        <div className="selection-summary"><FileImage size={18} /><span><strong>{images.length} images selected</strong><small>Each image becomes one PDF page.</small></span></div>
        {primaryButton("Create image PDF", <FilePlus2 size={17} />, () =>
          void run("Converting images into pages…", async () => {
            if (!images.length) throw new Error("Add one or more images.");
            setPdfResult("images.pdf", await imageFilesToPdf(images));
          }), !images.length)}
      </div>
    );
  }

  if (tool === "edit" || tool === "sign") {
    const isSign = tool === "sign";
    return (
      <div className="panel-grid three">
        <label><span>Page</span><input type="number" min="1" max={Math.max(pagePlan.length, 1)} value={page} onChange={(event) => setPage(Number(event.target.value))} /></label>
        <label className="wide"><span>{isSign ? "Signature text" : "Text to add"}</span><input value={isSign ? signature : text} onChange={(event) => isSign ? setSignature(event.target.value) : setText(event.target.value)} placeholder={isSign ? "Your name" : "Approved for release"} /></label>
        {primaryButton(isSign ? "Place signature" : "Add text", isSign ? <PenLine size={17} /> : <FilePenLine size={17} />, () =>
          void run(isSign ? "Placing signature…" : "Adding text…", async () => {
            const file = requirePdf(activeFile);
            const value = isSign ? signature : text;
            if (!value.trim()) throw new Error(`Enter ${isSign ? "a signature" : "some text"}.`);
            const bytes = isSign ? await addSignature(file.bytes, page - 1, value) : await addText(file.bytes, page - 1, value);
            setPdfResult(`${baseName(file.name)}-${isSign ? "signed" : "edited"}.pdf`, bytes);
          }), !activeFile || !(isSign ? signature : text).trim())}
        {isSign && <Notice>This creates a visual signature, not a certificate-based digital signature.</Notice>}
      </div>
    );
  }

  if (tool === "crop") {
    return (
      <div className="panel-grid">
        <label><span>Trim each edge</span><input type="range" min="0" max="120" value={inset} onChange={(event) => setInset(Number(event.target.value))} /><small>{inset} points · 72 points equals one inch</small></label>
        {primaryButton("Crop all pages", <Crop size={17} />, () =>
          void run("Applying crop boxes…", async () => {
            const file = requirePdf(activeFile);
            setPdfResult(`${baseName(file.name)}-cropped.pdf`, await cropPdf(file.bytes, inset));
          }), !activeFile)}
      </div>
    );
  }

  if (tool === "repair") {
    return (
      <div className="panel-stack">
        <Notice>Repair rewrites every readable page into a clean object structure. Missing or password-protected bytes cannot be recovered.</Notice>
        {primaryButton("Repair and rebuild", <ArchiveRestore size={17} />, () =>
          void run("Rebuilding readable PDF objects…", async () => {
            const file = requirePdf(activeFile);
            setPdfResult(`${baseName(file.name)}-repaired.pdf`, await repairPdf(file.bytes));
          }), !activeFile)}
      </div>
    );
  }

  if (tool === "forms") {
    return (
      <div className="panel-stack">
        {!activeFile ? <EmptyHint /> : fields.length === 0 ? <Notice>No supported interactive text fields were found in this PDF.</Notice> : (
          <>
            <div className="form-fields">
              {fields.map((field) => (
                <label key={field.name}><span>{field.name}<em>{field.kind}</em></span><input value={fieldValues[field.name] ?? ""} onChange={(event) => setFieldValues((current) => ({ ...current, [field.name]: event.target.value }))} /></label>
              ))}
            </div>
            {primaryButton("Fill form and download", <FilePlus2 size={17} />, () =>
              void run("Writing form values…", async () => {
                const file = requirePdf(activeFile);
                setPdfResult(`${baseName(file.name)}-filled.pdf`, await fillFormFields(file.bytes, fieldValues));
              }))}
          </>
        )}
      </div>
    );
  }

  if (tool === "summary") {
    return (
      <div className="panel-stack">
        <Notice>Every summary is written in English. Non-English text is translated to English on-device first, then summarized locally. Nothing is sent to this site.</Notice>
        <LanguageSelect
          label="Document language"
          value={sourceLanguage}
          onChange={setSourceLanguage}
        />
        {primaryButton("Summarize document", <Sparkles size={17} />, () =>
          void run("Preparing an English summary…", async () => {
            const file = requirePdf(activeFile);
            const extracted = await extractText(file.bytes);
            const englishText =
              sourceLanguage === "en"
                ? extracted
                : await translateInBrowser(extracted, sourceLanguage, "en");
            setSummary(summarizeText(englishText));
            setResult(null);
            setStatus("English summary ready.");
          }), !activeFile)}
        {summary && <OutputText title="English summary" value={summary} />}
      </div>
    );
  }

  return (
    <div className="panel-stack">
      <Notice>Translation uses the browser’s on-device Translator API when available. No document text is sent to this site.</Notice>
      <div className="language-grid">
        <LanguageSelect
          label="Document language"
          value={sourceLanguage}
          onChange={setSourceLanguage}
        />
        <LanguageSelect
          label="Target language"
          value={targetLanguage}
          onChange={setTargetLanguage}
        />
      </div>
      {primaryButton("Translate document", <Languages size={17} />, () =>
        void run("Starting private browser translation…", async () => {
          const file = requirePdf(activeFile);
          const source = await extractText(file.bytes);
          const translated = await translateInBrowser(
            source,
            sourceLanguage,
            targetLanguage,
          );
          setTranslation(translated);
          setResult(null);
          setStatus("Private translation ready.");
        }), !activeFile)}
      {translation && <OutputText title="Translation" value={translation} />}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="notice"><LockKeyhole size={16} /><p>{children}</p></div>;
}

function EmptyHint() {
  return <div className="empty-hint"><UploadCloud size={21} /><span>Add a PDF above to use this tool.</span></div>;
}

function OutputText({ title, value }: { title: string; value: string }) {
  return (
    <div className="text-output">
      <div><strong>{title}</strong><button onClick={() => void navigator.clipboard.writeText(value)}>Copy</button></div>
      <p>{value}</p>
    </div>
  );
}

function LanguageSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="language-select">
      <span>{label}</span>
      <span className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {languageOptions.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label}
            </option>
          ))}
        </select>
        <ChevronDown size={15} />
      </span>
    </label>
  );
}

function instructionFor(tool: ToolId): string {
  const instructions: Record<ToolId, string> = {
    organize: "Choose a PDF, then change the visual page sequence.",
    merge: "Add two or more PDFs in the order you want them combined.",
    split: "Extract individual pages or comma-separated page ranges.",
    compress: "Flatten pages to efficient JPEG-backed PDF pages.",
    "pdf-word": "Extract selectable text into an editable DOCX.",
    "word-pdf": "Turn a DOCX into clean, printable PDF pages.",
    "images-pdf": "Add images in order; each becomes one page.",
    edit: "Add visible text to a selected PDF page.",
    sign: "Place a typed visual signature on a selected page.",
    repair: "Rebuild readable pages into a fresh PDF structure.",
    crop: "Trim the visible bounds of every page.",
    forms: "Discover and fill interactive PDF text fields.",
    summary: "Produce an English summary from any supported document language.",
    translate: "Choose both the document language and the target language.",
  };
  return instructions[tool];
}

async function compressPdf(bytes: Uint8Array, quality: number): Promise<Uint8Array> {
  const { loadPdf } = await import("../lib/pdfjs");
  const source = await loadPdf(bytes);
  try {
    const output = await PDFDocument.create();
    const scale = quality < 0.5 ? 0.9 : quality > 0.75 ? 1.65 : 1.25;
    for (let index = 1; index <= source.numPages; index += 1) {
      const page = await source.getPage(index);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas rendering is unavailable.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const blob = await canvasBlob(canvas, "image/jpeg", quality);
      const image = await output.embedJpg(await blob.arrayBuffer());
      const pdfPage = output.addPage([viewport.width / scale, viewport.height / scale]);
      pdfPage.drawImage(image, { x: 0, y: 0, width: pdfPage.getWidth(), height: pdfPage.getHeight() });
    }
    return output.save({ useObjectStreams: true });
  } finally {
    await source.destroy();
  }
}

async function renderThumbnails(bytes: Uint8Array): Promise<string[]> {
  const { loadPdf } = await import("../lib/pdfjs");
  const source = await loadPdf(bytes);
  try {
    const thumbnails: string[] = [];
    for (let index = 1; index <= source.numPages; index += 1) {
      const page = await source.getPage(index);
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 135 / original.height });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) continue;
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      thumbnails.push(canvas.toDataURL("image/jpeg", 0.72));
    }
    return thumbnails;
  } finally {
    await source.destroy();
  }
}

async function translateInBrowser(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> {
  if (sourceLanguage === targetLanguage) return text;
  const browser = window as typeof window & {
    Translator?: {
      availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
      create(options: { sourceLanguage: string; targetLanguage: string }): Promise<{ translate(value: string): Promise<string> }>;
    };
  };
  if (!browser.Translator) {
    throw new Error("On-device translation is not available in this browser yet. Use Chrome with built-in AI translation enabled.");
  }
  const availability = await browser.Translator.availability({
    sourceLanguage,
    targetLanguage,
  });
  if (availability === "unavailable") {
    throw new Error("This language pair is unavailable for private on-device translation.");
  }
  const translator = await browser.Translator.create({
    sourceLanguage,
    targetLanguage,
  });
  const chunks = text.match(/[\s\S]{1,3500}(?:\s|$)/g) ?? [text];
  const output: string[] = [];
  for (const chunk of chunks) output.push(await translator.translate(chunk));
  return output.join("\n\n");
}

function requirePdf(file: ByteFile | null): ByteFile {
  if (!file || !isPdf(file)) throw new Error("Choose a PDF first.");
  return file;
}

function isPdf(file: ByteFile): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function downloadResult(result: ResultFile) {
  const url = URL.createObjectURL(new Blob([result.bytes.slice()], { type: result.type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = result.name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas export failed.")), type, quality);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatRemaining(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function mimeFromName(name: string): string {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  return `image/${extension ?? "unknown"}`;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}
