/**
 * MathDigitizer - Component for parsing text/images and extracting formulas
 */
import React, { useState, useRef } from "react";
import { LatexParser, Token } from "../../engines/parser/LatexParser";
import { MathEngine } from "../../engines/math/MathEngine";
import { MathOCR } from "../../engines/ocr/MathOCR";
import { AddOnSDKAPI, RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import katex from "katex";

interface MathDigitizerProps {
  addOnUISdk: AddOnSDKAPI;
  savedInputText: string;
  setSavedInputText: (s: string) => void;
  savedTokens: Token[];
  setSavedTokens: (t: Token[]) => void;
  savedImage: string | null;
  setSavedImage: (i: string | null) => void;
}

const CustomPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => (
  <div style={{ display: "flex", gap: "4px" }}>
    <button
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
      style={{
        width: "24px",
        height: "24px",
        cursor: currentPage === 1 ? "not-allowed" : "pointer",
        background: "#fff",
        border: "1px solid #cbd5e0",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px"
      }}
    >
      ←
    </button>
    <button
      disabled={currentPage === totalPages}
      onClick={() => onPageChange(currentPage + 1)}
      style={{
        width: "24px",
        height: "24px",
        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        background: "#fff",
        border: "1px solid #cbd5e0",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px"
      }}
    >
      →
    </button>
  </div>
);

export const MathDigitizer: React.FC<MathDigitizerProps> = ({
  addOnUISdk,
  savedInputText,
  setSavedInputText,
  savedTokens,
  setSavedTokens,
  savedImage,
  setSavedImage
}) => {
  const [isThinking, setIsThinking] = useState(false);

  // Image OCR State
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color state
  const [globalColor, setGlobalColor] = useState<string>("#000000");
  const [individualColors, setIndividualColors] = useState<Record<number, string>>({});

  // Debounce ref
  // @ts-ignore
  const debounceTimerRef = useRef<any>(null);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSavedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Scan Image for Math
  const handleScanImage = async () => {
    if (!savedImage) return;

    // @ts-ignore
    const apiKey = process.env.LLM_API_KEY;
    // @ts-ignore
    const apiUrl = process.env.LLM_API_URL;
    // @ts-ignore
    const model = process.env.LLM_MODEL;

    setIsScanning(true);
    try {
      // If apiKey exists, MathOCR uses Cloud Mode. If not, Local Mode.
      const result = await MathOCR.scanImage(savedImage, {
        apiKey,
        apiUrl,
        model
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      // Append result to text area.
      // If cloud mode used, it returns full text, so we add newlines.
      const newText = savedInputText + (savedInputText ? "\n\n" : "") + result.latex;
      setSavedInputText(newText);

      // Auto-trigger analysis
      setTimeout(() => handleAnalyze(newText), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  // Process text to find math
  const handleAnalyze = (textToAnalyze = savedInputText) => {
    setIsThinking(true);
    setTimeout(() => {
      const foundTokens = LatexParser.parse(textToAnalyze);
      setSavedTokens(foundTokens);
      setIsThinking(false);
    }, 500);
  };

  // Debounced text change handler
  const handleTextChange = (newText: string) => {
    setSavedInputText(newText);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newText.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        handleAnalyze(newText);
      }, 800); // 800ms debounce
    } else {
      setSavedTokens([]);
    }
  };

  // Filter to just math tokens for the list
  const mathTokens = savedTokens.filter(t => t.type !== "text");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.ceil(mathTokens.length / ITEMS_PER_PAGE);
  const displayedTokens = mathTokens.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleInsertEquation = async (latex: string, color: string, x = 50, y = 50) => {
    const engine = new MathEngine();
    try {
      const result = await engine.convertToPNG(latex, color);
      const arrayBuffer = await result.imageData.arrayBuffer();

      const sandboxApi = await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(RuntimeType.documentSandbox);
      await sandboxApi.insertMath({
        imageData: arrayBuffer,
        width: result.width,
        height: result.height,
        position: { x, y }
      });
      return { width: result.width, height: result.height };
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleInsertAll = async () => {
    let currentX = 50;
    let currentY = 50;
    const PAGE_LIMIT_HEIGHT = 600;

    for (let i = 0; i < mathTokens.length; i++) {
      const token = mathTokens[i];
      const tokenColor = individualColors[i] || globalColor;
      const dims = await handleInsertEquation(token.content, tokenColor, currentX, currentY);
      if (dims) {
        currentY += dims.height + 30; // 30px gap

        // If we go too far down, reset Y and move X (Next Column)
        if (currentY > PAGE_LIMIT_HEIGHT) {
          currentY = 50;
          // Move right by the width of this equation + margin, or at least 250px
          currentX += Math.max(dims.width + 50, 250);
        }
      }
    }
  };

  // Heuristic classifier (no API needed)
  const classifyEquation = (latex: string): string => {
    const s = latex.toLowerCase();
    if (/\\?(sin|cos|tan|sec|csc|cot)\b/.test(s)) return "Trigonometry";
    if (/\\int|\\frac\{d|\\lim|\\partial|\\nabla|'/.test(s)) return "Calculus";
    if (/\\begin\{[pbv]?matrix|\\pmatrix|\\bmatrix/.test(s)) return "Linear Algebra";
    if (/e\^|\\exp|\\mathrm\{e\}|\\Re|\\Im/.test(s)) return "Complex Numbers";
    if (/\\log|\\ln/.test(s)) return "Exponential/Logarithmic";
    if (/=/.test(s)) return "Algebra";
    return "Mathematics";
  };

  return (
    <div style={{ padding: "16px", background: "#fff" }}>
      <h3
        style={{
          fontSize: "20px",
          margin: "0 0 4px 0",
          color: "#1a202c"
        }}
      >
        Smart Math Parser
      </h3>
      <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 16px 0" }}>Digitize math from text or images</p>

      {/* Section 1: Image Scanner */}
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          border: "1px dashed #cbd5e0",
          borderRadius: "8px",
          background: "#f8fafc"
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#475569",
            marginBottom: "8px"
          }}
        >
          Scan from Image
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        {!savedImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              padding: "12px",
              background: "#fff",
              border: "1px solid #cbd5e0",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#64748b",
              fontSize: "12px"
            }}
          >
            Click to Upload Screenshot or Photo
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <img
              src={savedImage}
              style={{
                maxWidth: "100%",
                maxHeight: "150px",
                objectFit: "contain",
                borderRadius: "4px",
                border: "1px solid #e2e8f0"
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleScanImage}
                disabled={isScanning}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: isScanning ? "#94a3b8" : "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isScanning ? "wait" : "pointer",
                  fontSize: "12px"
                }}
              >
                {isScanning ? "Scanning..." : "Extract Math via OCR"}
              </button>
              <button
                onClick={() => setSavedImage(null)}
                style={{
                  padding: "8px 12px",
                  background: "#fff",
                  border: "1px solid #cbd5e0",
                  borderRadius: "6px",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: "1px", background: "#e2e8f0", margin: "16px 0" }} />

      {/* Section 2: Text Input */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px"
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#475569"
            }}
          >
            Parse Text & Formulas
          </div>
          <button
            onClick={async () => {
              try {
                const sandboxApi = await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(
                  RuntimeType.documentSandbox
                );
                const selectedText = await sandboxApi.getSelectedText();
                if (selectedText) {
                  setSavedInputText(selectedText);
                  handleAnalyze(selectedText);
                } else {
                  alert("No text selected in document");
                }
              } catch (err) {
                console.error("Import selection error:", err);
                alert("Failed to import selected text");
              }
            }}
            style={{
              fontSize: "11px",
              padding: "4px 10px",
              background: "#416afd",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Import Selection
          </button>
        </div>
        <textarea
          value={savedInputText}
          onChange={e => handleTextChange(e.target.value)}
          placeholder="Paste text here (or scan image above)..."
          style={{
            width: "100%",
            height: "100px",
            padding: "10px",
            fontSize: "13px",
            border: "2px solid #e2e8f0",
            borderRadius: "6px",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* Results */}
      {mathTokens.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px"
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
              Page {currentPage} of {totalPages}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              <button
                onClick={handleInsertAll}
                style={{
                  fontSize: "11px",
                  padding: "4px 10px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                ⚡ Insert All
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayedTokens.map((token, idx) => {
              const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx;
              const currentColor = individualColors[actualIndex] || globalColor;
              return (
                <div
                  key={idx}
                  style={{
                    padding: "8px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    position: "relative"
                  }}
                >
                  <input
                    type="color"
                    value={currentColor}
                    onChange={e => {
                      setIndividualColors(prev => ({
                        ...prev,
                        [actualIndex]: e.target.value
                      }));
                    }}
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      width: "20px",
                      height: "20px",
                      padding: 0,
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                    title="Set color for this equation"
                  />
                  <div
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(token.content, {
                        throwOnError: false
                      })
                    }}
                    style={{ fontSize: "14px", overflowX: "auto", color: currentColor, paddingRight: "36px" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleInsertEquation(token.content, currentColor)}
                      style={{
                        fontSize: "11px",
                        padding: "6px 10px",
                        background: "#fff",
                        border: "1px solid #cbd5e0",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Insert
                    </button>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#475569",
                        fontWeight: 600
                      }}
                    >
                      {classifyEquation(token.content)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mathTokens.length === 0 && savedTokens.length > 0 && (
        <div
          style={{
            padding: "12px",
            background: "#fef2f2",
            color: "#991b1b",
            borderRadius: "6px",
            fontSize: "13px"
          }}
        >
          No formulas found in the text. Try using $...$ delimiters.
        </div>
      )}
    </div>
  );
};
