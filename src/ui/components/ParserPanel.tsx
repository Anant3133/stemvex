import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AddOnSDKAPI,
  RuntimeType,
} from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { MathEngine } from "../../engines/math/MathEngine";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { EquationClassifier } from "../../engines/parser/EquationClassifier";
import { EquationDeduper } from "../../engines/parser/EquationDeduper";
import { EquationNormalizer } from "../../engines/parser/EquationNormalizer";
import { MathOcrClient } from "../../engines/parser/MathOcrClient";
import { ParsedEquation } from "../../engines/parser/types";

interface ParserPanelProps {
  addOnUISdk: AddOnSDKAPI;
  onShowInMathEngine?: (latex: string) => void;
}

function makeId(): string {
  // crypto.randomUUID is supported in modern browsers; fallback for safety.
  const maybe = (globalThis.crypto as Crypto | undefined)?.randomUUID?.();
  return maybe ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatPct(conf?: number): string {
  if (conf === undefined || Number.isNaN(conf)) return "—";
  const clamped = Math.max(0, Math.min(1, conf));
  return `${Math.round(clamped * 100)}%`;
}

const ITEMS_PER_PAGE = 3;

export const ParserPanel: React.FC<ParserPanelProps> = ({
  addOnUISdk,
  onShowInMathEngine,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<ParsedEquation[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanInfo, setScanInfo] = useState<string | null>(null);
  const [isInsertingAll, setIsInsertingAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mathEngineRef = useRef<MathEngine | null>(null);
  const ocrClient = useMemo(() => MathOcrClient.fromEnv(), []);

  const getMathEngine = () => {
    if (!mathEngineRef.current) mathEngineRef.current = new MathEngine();
    return mathEngineRef.current;
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const setFile = async (file: File | null) => {
    setSelectedFile(file);
    setScanError(null);
    setScanInfo(null);
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    await setFile(file);
    // allow selecting same file again
    e.target.value = "";
  };

  const handlePasteImage = async () => {
    setScanError(null);
    setScanInfo(null);

    if (!navigator.clipboard?.read) {
      setScanError(
        "Clipboard image paste is not supported in this browser context."
      );
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const file = new File(
          [blob],
          `pasted-${Date.now()}.${imageType.split("/")[1] || "png"}`,
          {
            type: imageType,
          }
        );
        await setFile(file);
        return;
      }
      setScanError("Clipboard does not contain an image.");
    } catch (err) {
      setScanError(
        err instanceof Error ? err.message : "Failed to read from clipboard."
      );
    }
  };

  const scan = async () => {
    setScanError(null);
    setScanInfo(null);

    if (!selectedFile) {
      setScanError("Select an image first (Upload or Paste).");
      return;
    }

    setIsScanning(true);
    try {
      const candidates = await ocrClient.parseImage(selectedFile);
      const parsed = candidates.map((c) => {
        const cleanedLatex = EquationNormalizer.cleanLatex(c.latex);
        const normalizedKey = EquationNormalizer.toNormalizedKey(cleanedLatex);
        const classification = EquationClassifier.classify(cleanedLatex);
        const eq: ParsedEquation = {
          id: makeId(),
          latex: cleanedLatex,
          normalizedKey,
          ocrConfidence: c.confidence,
          label: classification.label,
          labelConfidence: classification.labelConfidence,
          source: "image",
        };
        return eq;
      });

      const deduped = EquationDeduper.dedupe(parsed);
      setResults(deduped);
      setCurrentPage(0);

      if (deduped.length === 0) {
        setScanInfo("0 equations found.");
      } else if (deduped.length < parsed.length) {
        setScanInfo(
          `Found ${deduped.length} unique equation(s) (deduped from ${parsed.length}).`
        );
      } else {
        setScanInfo(`Found ${deduped.length} equation(s).`);
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const insertOne = async (
    latex: string,
    position?: { x: number; y: number }
  ) => {
    // Validate LaTeX
    const cleanedLatex = EquationNormalizer.cleanLatex(latex);
    const validation = MathEngine.validateLaTeX(cleanedLatex);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid LaTeX");
    }

    const mathResult = await getMathEngine().convertToPNG(cleanedLatex);
    const arrayBuffer = await mathResult.imageData.arrayBuffer();
    const sandboxApi =
      await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(
        RuntimeType.documentSandbox
      );
    await sandboxApi.insertMath({
      imageData: arrayBuffer,
      width: mathResult.width,
      height: mathResult.height,
      position,
    });

    return mathResult;
  };

  const handleInsert = async (eq: ParsedEquation) => {
    setScanError(null);
    try {
      await insertOne(eq.latex);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Insert failed.");
    }
  };

  const handleInsertAll = async () => {
    setScanError(null);
    if (results.length === 0) return;
    setIsInsertingAll(true);

    try {
      let y = 0;
      for (const eq of results) {
        const mathResult = await insertOne(eq.latex, { x: 0, y });
        y += mathResult.height + 20;
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Insert all failed.");
    } finally {
      setIsInsertingAll(false);
    }
  };

  const handleShowInMathEngine = (latex: string) => {
    if (onShowInMathEngine) {
      onShowInMathEngine(EquationNormalizer.cleanLatex(latex));
    }
  };

  const handleClear = () => {
    setResults([]);
    setCurrentPage(0);
    setScanError(null);
    setScanInfo(null);
  };

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-base font-semibold">Parser (Image)</h3>
        <button
          onClick={handleClear}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          disabled={results.length === 0 && !scanError && !scanInfo}
        >
          Clear results
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-600">
        Uploaded images are sent to an OCR service for equation extraction.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex gap-2">
          <button
            onClick={handleUploadClick}
            className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
            disabled={isScanning || isInsertingAll}
          >
            Upload Image
          </button>
          <button
            onClick={handlePasteImage}
            className="flex-1 px-3 py-2 border rounded hover:bg-gray-50"
            disabled={isScanning || isInsertingAll}
          >
            Paste Image
          </button>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-3 text-xs text-gray-700">
            <div className="flex-1">
              <div className="font-medium truncate">{selectedFile.name}</div>
              <div className="text-gray-500">
                {Math.round(selectedFile.size / 1024)} KB
              </div>
            </div>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected"
                className="w-16 h-12 object-cover border rounded"
              />
            )}
          </div>
        )}

        <button
          onClick={scan}
          disabled={isScanning || isInsertingAll || !selectedFile}
          className={`w-full px-3 py-2 rounded text-white ${
            isScanning ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isScanning ? "Scanning..." : "Scan"}
        </button>

        {scanError && (
          <div className="text-xs p-2 rounded bg-red-50 text-red-700 border border-red-200">
            {scanError}
          </div>
        )}
        {scanInfo && !scanError && (
          <div className="text-xs p-2 rounded bg-gray-50 text-gray-700 border border-gray-200">
            {scanInfo}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Results</div>
        <button
          onClick={handleInsertAll}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
          disabled={results.length === 0 || isScanning || isInsertingAll}
          title="Insert all equations in a vertical stack"
        >
          {isInsertingAll ? "Inserting..." : "Insert all"}
        </button>
      </div>

      <div className="mt-2 border rounded">
        {results.length === 0 ? (
          <div className="p-3 text-xs text-gray-500">No results yet.</div>
        ) : (
          <>
            <div className="divide-y">
              {paginatedResults.map((eq) => (
                <div key={eq.id} className="p-3 flex flex-col gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">
                        {eq.label}
                      </span>
                      <span className="mx-2">•</span>
                      <span>OCR {formatPct(eq.ocrConfidence)}</span>
                      {eq.ocrConfidence !== undefined &&
                        eq.ocrConfidence < 0.5 && (
                          <span className="ml-2 text-amber-700">
                            Low confidence
                          </span>
                        )}
                    </div>
                    <div className="mt-1 text-xs font-mono whitespace-pre-wrap break-words">
                      {eq.latex}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInsert(eq)}
                      className="px-3 py-1.5 text-xs rounded text-white bg-blue-600 hover:bg-blue-700"
                      disabled={isScanning || isInsertingAll}
                    >
                      Insert
                    </button>
                    <button
                      onClick={() => handleShowInMathEngine(eq.latex)}
                      className="flex-1 text-xs px-2 py-1.5 border rounded hover:bg-gray-50"
                      disabled={isScanning || isInsertingAll}
                    >
                      Show in Math Engine
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="p-2 border-t flex items-center justify-between text-xs">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
