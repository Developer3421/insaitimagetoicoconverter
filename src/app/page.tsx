"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearAllConversions,
  ConversionRecord,
  deleteConversion,
  listConversions,
  saveConversion,
} from "./lib/indexeddb";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB — generous limit for high-res source images

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const translations = {
  en: {
    title: "Insait Image to ICO Converter",
    subtitle:
      "Convert your JPEG and PNG images to ICO files entirely in your browser. No server uploads — all processing is local and private.",
    tabConvert: "Convert",
    tabHistory: "History",
    dropTitle: "Drag & drop JPEG or PNG files here",
    dropOr: "or",
    dropClick: "click to browse",
    dropLimit: "— up to 20 MB per file",
    icoSize: "ICO sizes",
    clearAll: "Clear all",
    convertBtn: "Convert",
    convertingBtn: "Converting…",
    download: "↓ Download",
    downloadAll: "↓ Download all",
    remove: "Remove",
    statusPending: "Pending",
    statusConverting: "Converting…",
    statusDone: "Done ✓",
    statusError: "Error",
    converted: "converted",
    files: "file",
    filesPlural: "files",
    historyCount: "saved conversion",
    historyCountPlural: "saved conversions",
    historyIndexedDB: "in IndexedDB",
    clearHistory: "Clear history",
    loading: "Loading…",
    noHistory: "No conversions saved yet. Convert a file to see it here.",
    featLocalTitle: "100% Local",
    featLocalDesc:
      "Conversion runs in your browser using the Canvas API — no server, no uploads.",
    featDBTitle: "IndexedDB Storage",
    featDBDesc:
      "Converted files are saved locally in your browser's IndexedDB for later re-download.",
    featBatchTitle: "Batch Support",
    featBatchDesc: "Upload multiple JPEG or PNG files and convert them all at once.",
    footer: "Insait · Image to ICO Converter",
    sizeStandard: "Standard (16, 32, 48)",
    sizeFull: "Full (16, 32, 48, 64, 128, 256)",
    sizeSmall: "Small (16×16)",
    sizeMedium: "Medium (32×32)",
    sizeLarge: "Large (64×64)",
    sizeXL: "XL (256×256)",
    sizeCustom: "Custom (px)",
    hintStandard: "Generate a standard Windows icon with 16×16, 32×32, and 48×48 layers.",
    hintFull: "Generate a comprehensive ICO with all common sizes: 16, 32, 48, 64, 128, 256.",
    hintSmall: "Single 16×16 icon layer.",
    hintMedium: "Single 32×32 icon layer.",
    hintLarge: "Single 64×64 icon layer.",
    hintXL: "Single 256×256 icon layer.",
    hintCustom: "Specify the pixel size for a single square ICO layer (e.g. 64 → 64×64).",
    customSize: "Size (px)",
    customRequired: "Enter a valid size in pixels (e.g. 64).",
    fileTooLarge: "File exceeds the 20 MB limit.",
    canvasError: "Canvas not supported in this browser.",
    conversionFailed: "ICO conversion failed.",
    loadImageFailed: "Failed to load image.",
    icoSizeLabel: "ICO sizes: {label}.",
  },
  de: {
    title: "Insait Bild-zu-ICO-Konverter",
    subtitle:
      "Konvertieren Sie Ihre JPEG- und PNG-Bilder vollständig im Browser in ICO-Dateien. Kein Server-Upload — die gesamte Verarbeitung erfolgt lokal und privat.",
    tabConvert: "Konvertieren",
    tabHistory: "Verlauf",
    dropTitle: "JPEG- oder PNG-Dateien hier ablegen",
    dropOr: "oder",
    dropClick: "zum Durchsuchen klicken",
    dropLimit: "— bis zu 20 MB pro Datei",
    icoSize: "ICO-Größen",
    clearAll: "Alle löschen",
    convertBtn: "Konvertieren",
    convertingBtn: "Konvertiere…",
    download: "↓ Herunterladen",
    downloadAll: "↓ Alle herunterladen",
    remove: "Entfernen",
    statusPending: "Ausstehend",
    statusConverting: "Konvertiere…",
    statusDone: "Fertig ✓",
    statusError: "Fehler",
    converted: "konvertiert",
    files: "Datei",
    filesPlural: "Dateien",
    historyCount: "gespeicherte Konvertierung",
    historyCountPlural: "gespeicherte Konvertierungen",
    historyIndexedDB: "in IndexedDB",
    clearHistory: "Verlauf löschen",
    loading: "Lade…",
    noHistory:
      "Noch keine Konvertierungen gespeichert. Konvertieren Sie eine Datei, um sie hier zu sehen.",
    featLocalTitle: "100% Lokal",
    featLocalDesc:
      "Die Konvertierung läuft in Ihrem Browser über die Canvas-API — kein Server, keine Uploads.",
    featDBTitle: "IndexedDB-Speicher",
    featDBDesc:
      "Konvertierte Dateien werden lokal in der IndexedDB Ihres Browsers zum späteren Herunterladen gespeichert.",
    featBatchTitle: "Stapelverarbeitung",
    featBatchDesc:
      "Laden Sie mehrere JPEG- oder PNG-Dateien hoch und konvertieren Sie alle auf einmal.",
    footer: "Insait · Bild-zu-ICO-Konverter",
    sizeStandard: "Standard (16, 32, 48)",
    sizeFull: "Vollständig (16, 32, 48, 64, 128, 256)",
    sizeSmall: "Klein (16×16)",
    sizeMedium: "Mittel (32×32)",
    sizeLarge: "Groß (64×64)",
    sizeXL: "XL (256×256)",
    sizeCustom: "Benutzerdefiniert (px)",
    hintStandard: "Erzeugt ein Standard-Windows-Icon mit Schichten 16×16, 32×32 und 48×48.",
    hintFull: "Erzeugt eine umfassende ICO-Datei mit allen gängigen Größen: 16, 32, 48, 64, 128, 256.",
    hintSmall: "Einzelne 16×16-Iconschicht.",
    hintMedium: "Einzelne 32×32-Iconschicht.",
    hintLarge: "Einzelne 64×64-Iconschicht.",
    hintXL: "Einzelne 256×256-Iconschicht.",
    hintCustom: "Pixelgröße für eine einzelne quadratische ICO-Schicht angeben (z. B. 64 → 64×64).",
    customSize: "Größe (px)",
    customRequired: "Gültige Pixelgröße eingeben (z. B. 64).",
    fileTooLarge: "Datei überschreitet das 20-MB-Limit.",
    canvasError: "Canvas wird in diesem Browser nicht unterstützt.",
    conversionFailed: "ICO-Konvertierung fehlgeschlagen.",
    loadImageFailed: "Bild konnte nicht geladen werden.",
    icoSizeLabel: "ICO-Größen: {label}.",
  },
} as const;

type Language = keyof typeof translations;
type T = (typeof translations)[Language];

// ---------------------------------------------------------------------------
// ICO size presets
// ---------------------------------------------------------------------------
const ICO_PRESETS = [
  { value: "standard" as const, sizes: [16, 32, 48], labelKey: "sizeStandard" as const },
  { value: "full" as const, sizes: [16, 32, 48, 64, 128, 256], labelKey: "sizeFull" as const },
  { value: "16" as const, sizes: [16], labelKey: "sizeSmall" as const },
  { value: "32" as const, sizes: [32], labelKey: "sizeMedium" as const },
  { value: "64" as const, sizes: [64], labelKey: "sizeLarge" as const },
  { value: "256" as const, sizes: [256], labelKey: "sizeXL" as const },
];

type IcoPresetValue = (typeof ICO_PRESETS)[number]["value"];
type OutputSizeValue = IcoPresetValue | "custom";

function getPreset(value: IcoPresetValue) {
  return ICO_PRESETS.find((p) => p.value === value) ?? ICO_PRESETS[0];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
interface ConvertFile {
  id: string;
  file: File;
  status: "pending" | "converting" | "done" | "error";
  error?: string;
  objectUrl?: string;
  outputName?: string;
  outputSize?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

// ---------------------------------------------------------------------------
// ICO encoder
// ---------------------------------------------------------------------------

/**
 * Render an image at `size × size` pixels onto a canvas and return the PNG
 * byte array (as Uint8Array).
 */
function renderSizeToPng(
  img: HTMLImageElement,
  size: number,
  t: T
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error(t.canvasError));
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(t.conversionFailed));
        return;
      }
      blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab))).catch(reject);
    }, "image/png");
  });
}

/**
 * Assemble multiple PNG byte arrays into a valid ICO binary.
 * Uses PNG-inside-ICO format (supported since Windows Vista).
 */
function buildIco(entries: { width: number; height: number; pngBytes: Uint8Array }[]): Blob {
  const count = entries.length;
  const HEADER_SIZE = 6;
  const DIR_ENTRY_SIZE = 16;
  const dirSize = count * DIR_ENTRY_SIZE;
  const payloadStart = HEADER_SIZE + dirSize;

  let totalSize = payloadStart;
  const offsets: number[] = [];
  for (const e of entries) {
    offsets.push(totalSize);
    totalSize += e.pngBytes.length;
  }

  const buf = new ArrayBuffer(totalSize);
  const view = new DataView(buf);
  const uint8 = new Uint8Array(buf);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: 1 = ICO
  view.setUint16(4, count, true);

  // ICONDIRENTRY for each image
  entries.forEach((e, i) => {
    const base = HEADER_SIZE + i * DIR_ENTRY_SIZE;
    view.setUint8(base, e.width >= 256 ? 0 : e.width);   // bWidth  (0 means 256)
    view.setUint8(base + 1, e.height >= 256 ? 0 : e.height); // bHeight
    view.setUint8(base + 2, 0);  // bColorCount (0 = no palette)
    view.setUint8(base + 3, 0);  // bReserved
    view.setUint16(base + 4, 1, true);  // wPlanes
    view.setUint16(base + 6, 32, true); // wBitCount
    view.setUint32(base + 8, e.pngBytes.length, true);  // dwBytesInRes
    view.setUint32(base + 12, offsets[i], true);        // dwImageOffset
  });

  // Image data
  entries.forEach((e, i) => {
    uint8.set(e.pngBytes, offsets[i]);
  });

  return new Blob([buf], { type: "image/x-icon" });
}

/**
 * Convert an image File to an ICO Blob entirely in the browser.
 */
function convertImageToIco(
  file: File,
  sizes: number[],
  t: T
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl: string | null = null;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = async () => {
      try {
        const entries = await Promise.all(
          sizes.map(async (s) => ({
            width: s,
            height: s,
            pngBytes: await renderSizeToPng(img, s, t),
          }))
        );
        cleanup();
        resolve(buildIco(entries));
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error(t.loadImageFailed));
    };

    objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({
  status,
  t,
}: {
  status: ConvertFile["status"];
  t: T;
}) {
  const map: Record<ConvertFile["status"], { label: string; cls: string }> = {
    pending: { label: t.statusPending, cls: "badge-pending" },
    converting: { label: t.statusConverting, cls: "badge-converting" },
    done: { label: t.statusDone, cls: "badge-success" },
    error: { label: t.statusError, cls: "badge-error" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`${cls} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// HomePage
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

  const [files, setFiles] = useState<ConvertFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [converting, setConverting] = useState(false);
  const [tab, setTab] = useState<"convert" | "history">("convert");
  const [history, setHistory] = useState<ConversionRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [outputSize, setOutputSize] = useState<OutputSizeValue>("standard");
  const [customSize, setCustomSize] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const records = await listConversions();
      setHistory(records);
    } catch {
      // IndexedDB unavailable (e.g., private browsing in some browsers)
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab, loadHistory]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const images = arr.filter((f) =>
      ["image/jpeg", "image/jpg", "image/png"].includes(f.type)
    );
    if (!images.length) return;
    setFiles((prev) => [
      ...prev,
      ...images.map((f) => ({
        id: `${f.name}-${f.size}-${crypto.randomUUID()}`,
        file: f,
        status: "pending" as const,
      })),
    ]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const convertAll = async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (!pending.length) return;

    // Resolve ICO sizes before processing
    let sizes: number[];
    if (outputSize === "custom") {
      const dim = parseInt(customSize, 10);
      if (!dim || dim <= 0) {
        alert(t.customRequired);
        return;
      }
      sizes = [dim];
    } else {
      sizes = getPreset(outputSize).sizes;
    }

    setConverting(true);

    for (const item of pending) {
      if (item.file.size > MAX_FILE_SIZE) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error", error: t.fileTooLarge }
              : f
          )
        );
        continue;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "converting" } : f))
      );

      try {
        const blob = await convertImageToIco(item.file, sizes, t);
        const outputName = item.file.name.replace(/\.[^.]+$/, "") + ".ico";
        const objectUrl = URL.createObjectURL(blob);

        // Auto-download the converted file
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = outputName;
        a.click();

        // Persist to IndexedDB
        await saveConversion({
          id: item.id,
          originalName: item.file.name,
          outputName,
          originalSize: item.file.size,
          outputSize: blob.size,
          convertedAt: Date.now(),
          blob,
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "done", objectUrl, outputName, outputSize: blob.size }
              : f
          )
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "error",
                  error: err instanceof Error ? err.message : t.statusError,
                }
              : f
          )
        );
      }
    }

    setConverting(false);
  };

  const clearAll = () => {
    files.forEach((f) => {
      if (f.objectUrl) URL.revokeObjectURL(f.objectUrl);
    });
    setFiles([]);
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const downloadHistoryItem = (record: ConversionRecord) => {
    const url = URL.createObjectURL(record.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = record.outputName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeHistoryItem = async (id: string) => {
    await deleteConversion(id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const clearHistory = async () => {
    await clearAllConversions();
    setHistory([]);
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;

  const sizeLabelMap: Record<OutputSizeValue, string> = {
    standard: t.sizeStandard,
    full: t.sizeFull,
    "16": t.sizeSmall,
    "32": t.sizeMedium,
    "64": t.sizeLarge,
    "256": t.sizeXL,
    custom: t.sizeCustom,
  };
  const sizeHintMap: Record<OutputSizeValue, string> = {
    standard: t.hintStandard,
    full: t.hintFull,
    "16": t.hintSmall,
    "32": t.hintMedium,
    "64": t.hintLarge,
    "256": t.hintXL,
    custom: t.hintCustom,
  };
  const currentSizeLabel = sizeLabelMap[outputSize];
  const currentSizeHint = sizeHintMap[outputSize];

  return (
    <div className="gradient-bg min-h-screen flex flex-col items-center justify-start px-4 py-12 font-sans">
      {/* Header */}
      <header className="w-full max-w-3xl mb-10 text-center relative">
        {/* Language toggle */}
        <div className="absolute right-0 top-0 flex gap-1">
          {(["en", "de"] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-all ${
                lang === l
                  ? "btn-primary text-white"
                  : "border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 mb-3">
          <span className="text-4xl">🖼️</span>
        </div>
        <h1 className="text-gradient text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-3">
          {t.title}
        </h1>
        <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
          {t.subtitle}
        </p>
      </header>

      {/* Tabs */}
      <div className="w-full max-w-3xl mb-6 flex gap-2">
        <button
          onClick={() => setTab("convert")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "convert"
              ? "btn-primary text-white"
              : "border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          {t.tabConvert}
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "history"
              ? "btn-primary text-white"
              : "border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
          }`}
        >
          {t.tabHistory}
        </button>
      </div>

      {tab === "convert" && (
        <>
          {/* Drop Zone */}
          <div className="w-full max-w-3xl mb-6">
            <div
              className={`drop-zone rounded-2xl p-10 text-center cursor-pointer select-none ${dragOver ? "drag-over" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(124,58,237,0.2))" }}
                >
                  📁
                </div>
                <div>
                  <p className="text-white font-semibold text-lg mb-1">
                    {t.dropTitle}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {t.dropOr}{" "}
                    <span className="text-orange-400 underline underline-offset-2">
                      {t.dropClick}
                    </span>{" "}
                    {t.dropLimit}
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="w-full max-w-3xl">
              <div
                className="card-glow rounded-2xl overflow-hidden"
                style={{ background: "rgba(13, 0, 20, 0.8)", backdropFilter: "blur(20px)" }}
              >
                {/* Toolbar */}
                <div className="flex flex-col gap-3 px-5 py-4 border-b border-purple-900/40">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-gray-300 text-sm font-medium">
                        {files.length} {files.length !== 1 ? t.filesPlural : t.files}
                        {doneCount > 0 && (
                          <span className="text-green-400 ml-2">• {doneCount} {t.converted}</span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {t.icoSizeLabel.replace("{label}", currentSizeLabel)}{" "}
                        {currentSizeHint}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{t.icoSize}</span>
                        <select
                          value={outputSize}
                          onChange={(e) =>
                            setOutputSize(e.target.value as OutputSizeValue)
                          }
                          disabled={converting}
                          className="rounded-lg border border-gray-700 bg-black/40 px-3 py-1.5 text-gray-200 outline-none transition-colors focus:border-orange-400 disabled:opacity-50"
                        >
                          {ICO_PRESETS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {t[opt.labelKey]}
                            </option>
                          ))}
                          <option value="custom">{t.sizeCustom}</option>
                        </select>
                      </label>
                      <button
                        onClick={clearAll}
                        disabled={converting}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all disabled:opacity-40"
                      >
                        {t.clearAll}
                      </button>
                      <button
                        onClick={convertAll}
                        disabled={converting || pendingCount === 0}
                        className="btn-primary text-white text-sm font-semibold px-5 py-1.5 rounded-lg"
                      >
                        {converting
                          ? t.convertingBtn
                          : `${t.convertBtn}${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
                      </button>
                    </div>
                  </div>

                  {/* Custom pixel size input */}
                  {outputSize === "custom" && (
                    <div className="flex items-center gap-3 pt-1">
                      <label className="text-xs text-gray-400 flex items-center gap-2">
                        <span>{t.customSize}</span>
                        <input
                          type="number"
                          min={1}
                          value={customSize}
                          onChange={(e) => setCustomSize(e.target.value)}
                          disabled={converting}
                          placeholder="e.g. 64"
                          className="w-28 rounded-lg border border-gray-700 bg-black/40 px-3 py-1.5 text-gray-200 outline-none transition-colors focus:border-orange-400 disabled:opacity-50"
                        />
                      </label>
                      <span className="text-gray-500 text-xs">px × px (square)</span>
                    </div>
                  )}
                </div>

                {/* File rows */}
                <ul className="divide-y divide-purple-900/20 max-h-96 overflow-y-auto scrollbar-thin">
                  {files.map((item) => (
                    <li key={item.id} className="file-item px-5 py-3.5 flex items-center gap-4">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                        style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(124,58,237,0.25))" }}
                      >
                        🖼
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.file.name}</p>
                        <p className="text-gray-500 text-xs">
                          {formatBytes(item.file.size)}
                          {item.status === "done" && item.outputSize && (
                            <span className="text-green-400 ml-2">
                              → {formatBytes(item.outputSize)}
                            </span>
                          )}
                        </p>
                        {item.status === "error" && item.error && (
                          <p className="text-red-400 text-xs mt-0.5">{item.error}</p>
                        )}
                      </div>

                      <StatusBadge status={item.status} t={t} />

                      {item.status === "done" && item.objectUrl && (
                        <a
                          href={item.objectUrl}
                          download={item.outputName}
                          className="download-btn text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                        >
                          {t.download}
                        </a>
                      )}

                      <button
                        onClick={() => removeFile(item.id)}
                        disabled={item.status === "converting"}
                        className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors disabled:opacity-30 text-lg leading-none"
                        title={t.remove}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Download all */}
                {doneCount > 1 && (
                  <div className="px-5 py-4 border-t border-purple-900/40 flex justify-end">
                    <button
                      onClick={() => {
                        files
                          .filter((f) => f.status === "done" && f.objectUrl)
                          .forEach((f) => {
                            const a = document.createElement("a");
                            a.href = f.objectUrl!;
                            a.download = f.outputName!;
                            a.click();
                          });
                      }}
                      className="download-btn text-sm font-semibold px-5 py-2 rounded-lg"
                    >
                      {t.downloadAll} ({doneCount})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "history" && (
        <div className="w-full max-w-3xl">
          <div
            className="card-glow rounded-2xl overflow-hidden"
            style={{ background: "rgba(13, 0, 20, 0.8)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/40">
              <p className="text-gray-300 text-sm font-medium">
                {history.length}{" "}
                {history.length !== 1 ? t.historyCountPlural : t.historyCount}{" "}
                {t.historyIndexedDB}
              </p>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-500 transition-all"
                >
                  {t.clearHistory}
                </button>
              )}
            </div>

            {historyLoading && (
              <p className="text-gray-500 text-sm text-center py-10">{t.loading}</p>
            )}

            {!historyLoading && history.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-10">
                {t.noHistory}
              </p>
            )}

            {!historyLoading && history.length > 0 && (
              <ul className="divide-y divide-purple-900/20 max-h-[32rem] overflow-y-auto scrollbar-thin">
                {history.map((record) => (
                  <li key={record.id} className="file-item px-5 py-3.5 flex items-center gap-4">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(124,58,237,0.2))" }}
                    >
                      🖼
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{record.outputName}</p>
                      <p className="text-gray-500 text-xs">
                        {formatBytes(record.originalSize)} → {formatBytes(record.outputSize)}
                        <span className="ml-2 text-gray-600">{formatDate(record.convertedAt)}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => downloadHistoryItem(record)}
                      className="download-btn text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                    >
                      {t.download}
                    </button>

                    <button
                      onClick={() => removeHistoryItem(record.id)}
                      className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                      title={t.remove}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      <div className="w-full max-w-3xl mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "⚡", title: t.featLocalTitle, desc: t.featLocalDesc },
          { icon: "🗄️", title: t.featDBTitle, desc: t.featDBDesc },
          { icon: "📦", title: t.featBatchTitle, desc: t.featBatchDesc },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl p-5 text-center"
            style={{
              background: "rgba(124, 58, 237, 0.07)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
            }}
          >
            <div className="text-3xl mb-2">{f.icon}</div>
            <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-gray-600 text-xs text-center">
        © {new Date().getFullYear()} {t.footer}
      </footer>
    </div>
  );
}
