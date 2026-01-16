/**
 * MathInput - React component with Template Builder and Live Preview
 */

import React, { useState, useRef, useEffect } from "react";
import katex from "katex";
import { MathEngine } from "../../engines/math/MathEngine";
import { AddOnSDKAPI, RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";

interface MathInputProps {
  addOnUISdk: AddOnSDKAPI;
  onNavigateToGraph?: (latex: string) => void;
}

interface Template {
  name: string;
  display: string;
  template: string;
  category: string;
}

type Category = "basic" | "trigonometric" | "calculus" | "greek" | "arrows" | "fractions" | "script" | "limits";

export const MathInput: React.FC<MathInputProps> = ({ addOnUISdk, onNavigateToGraph }) => {
  const [latex, setLatex] = useState("E = mc^{2}");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>("calculus");
  const [preview, setPreview] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mathEngineRef = useRef<MathEngine | null>(null);

  const getMathEngine = () => {
    if (!mathEngineRef.current) {
      mathEngineRef.current = new MathEngine();
    }
    return mathEngineRef.current;
  };

  // Update preview when latex changes
  useEffect(() => {
    try {
      // Replace placeholders with boxes for preview
      const cleanLatex = latex.replace(/\[([^\]]+)\]/g, "\\boxed{$1}");
      const html = katex.renderToString(cleanLatex, {
        throwOnError: false,
        displayMode: true,
        output: "html"
      });
      setPreview(html);
    } catch (e) {
      setPreview('<span style="color: red;">Invalid LaTeX</span>');
    }
  }, [latex]);

  const handleInsert = async () => {
    setError(null);
    setSuccess(false);

    let cleanedLatex = latex.trim().replace(/^\$+|\$+$/g, "");
    // Remove placeholder brackets
    cleanedLatex = cleanedLatex.replace(/\[([^\]]+)\]/g, "$1");

    const validation = MathEngine.validateLaTeX(cleanedLatex);

    if (!validation.valid) {
      setError(validation.error || "Invalid LaTeX");
      return;
    }

    setIsProcessing(true);

    try {
      const mathResult = await getMathEngine().convertToPNG(cleanedLatex);
      const arrayBuffer = await mathResult.imageData.arrayBuffer();
      const sandboxApi = await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(RuntimeType.documentSandbox);

      await sandboxApi.insertMath({
        imageData: arrayBuffer,
        width: mathResult.width,
        height: mathResult.height
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to insert equation");
      console.error("Insert math error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const insertTemplate = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newText = text.substring(0, start) + template + text.substring(end);
    setLatex(newText);

    // Find first placeholder and position cursor
    setTimeout(() => {
      const firstPlaceholder = template.match(/\[([^\]]+)\]/);
      if (firstPlaceholder) {
        const placeholderStart = start + template.indexOf("[");
        const placeholderEnd = placeholderStart + firstPlaceholder[0].length;
        textarea.focus();
        textarea.setSelectionRange(placeholderStart + 1, placeholderEnd - 1);
      } else {
        textarea.focus();
        textarea.setSelectionRange(start + template.length, start + template.length);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const text = textarea.value;
      const cursorPos = textarea.selectionEnd;

      // Find next placeholder after cursor
      const remainingText = text.substring(cursorPos);
      const match = remainingText.match(/\[([^\]]+)\]/);

      if (match && match.index !== undefined) {
        const placeholderStart = cursorPos + match.index;
        const placeholderEnd = placeholderStart + match[0].length;
        textarea.setSelectionRange(placeholderStart + 1, placeholderEnd - 1);
      }
    }
  };

  // Template definitions with placeholders
  const templates: Template[] = [
    // Calculus Templates
    { name: "Integral", display: "∫", template: "\\int [f(x)] \\, dx", category: "calculus" },
    { name: "Definite Integral", display: "∫ᵃᵇ", template: "\\int_{[a]}^{[b]} [f(x)] \\, dx", category: "calculus" },
    { name: "Double Integral", display: "∬", template: "\\iint_{[D]} [f(x,y)] \\, dA", category: "calculus" },
    { name: "Derivative", display: "d/dx", template: "\\frac{d}{dx}[f(x)]", category: "calculus" },
    { name: "Partial", display: "∂/∂x", template: "\\frac{\\partial [f]}{\\partial [x]}", category: "calculus" },
    { name: "Summation", display: "∑", template: "\\sum_{[i=1]}^{[n]} [a_i]", category: "calculus" },
    { name: "Product", display: "∏", template: "\\prod_{[i=1]}^{[n]} [x_i]", category: "calculus" },
    { name: "Limit", display: "lim", template: "\\lim_{[x \\to 0]} [f(x)]", category: "calculus" },

    // Fraction Templates
    { name: "Fraction", display: "a/b", template: "\\frac{[a]}{[b]}", category: "fractions" },
    { name: "Square Root", display: "√", template: "\\sqrt{[x]}", category: "fractions" },
    { name: "Nth Root", display: "ⁿ√", template: "\\sqrt[[n]]{[x]}", category: "fractions" },
    { name: "Superscript", display: "xⁿ", template: "[x]^{[n]}", category: "fractions" },
    { name: "Subscript", display: "xᵢ", template: "[x]_{[i]}", category: "fractions" },
    { name: "Both", display: "xᵢⁿ", template: "[x]_{[i]}^{[n]}", category: "fractions" },

    // Basic Math
    { name: "Times", display: "×", template: " \\times ", category: "basic" },
    { name: "Divide", display: "÷", template: " \\div ", category: "basic" },
    { name: "Plus Minus", display: "±", template: " \\pm ", category: "basic" },
    { name: "Not Equal", display: "≠", template: " \\neq ", category: "basic" },
    { name: "Less Equal", display: "≤", template: " \\leq ", category: "basic" },
    { name: "Greater Equal", display: "≥", template: " \\geq ", category: "basic" },
    { name: "Infinity", display: "∞", template: "\\infty", category: "basic" },

    // Limits & Logs
    { name: "Log", display: "log", template: "\\log_{[10]}[x]", category: "limits" },
    { name: "Natural Log", display: "ln", template: "\\ln[x]", category: "limits" },
    { name: "Limit to Infinity", display: "lim\nx→∞", template: "\\lim_{[x] \\to \\infty} [f(x)]", category: "limits" },

    // Trigonometric
    { name: "Sin", display: "sin", template: "\\sin [x]", category: "trigonometric" },
    { name: "Cos", display: "cos", template: "\\cos [x]", category: "trigonometric" },
    { name: "Tan", display: "tan", template: "\\tan [x]", category: "trigonometric" },
    { name: "Csc", display: "csc", template: "\\csc [x]", category: "trigonometric" },
    { name: "Sec", display: "sec", template: "\\sec [x]", category: "trigonometric" },
    { name: "Cot", display: "cot", template: "\\cot [x]", category: "trigonometric" },
    { name: "Arcsin", display: "sin⁻¹", template: "\\arcsin [x]", category: "trigonometric" },
    { name: "Arccos", display: "cos⁻¹", template: "\\arccos [x]", category: "trigonometric" },
    { name: "Arctan", display: "tan⁻¹", template: "\\arctan [x]", category: "trigonometric" },
    { name: "Sinh", display: "sinh", template: "\\sinh [x]", category: "trigonometric" },
    { name: "Cosh", display: "cosh", template: "\\cosh [x]", category: "trigonometric" },
    { name: "Tanh", display: "tanh", template: "\\tanh [x]", category: "trigonometric" },

    // Greek Letters
    { name: "Alpha", display: "α", template: "\\alpha", category: "greek" },
    { name: "Beta", display: "β", template: "\\beta", category: "greek" },
    { name: "Gamma", display: "γ", template: "\\gamma", category: "greek" },
    { name: "Delta", display: "δ", template: "\\delta", category: "greek" },
    { name: "Epsilon", display: "ε", template: "\\epsilon", category: "greek" },
    { name: "Theta", display: "θ", template: "\\theta", category: "greek" },
    { name: "Lambda", display: "λ", template: "\\lambda", category: "greek" },
    { name: "Mu", display: "μ", template: "\\mu", category: "greek" },
    { name: "Pi", display: "π", template: "\\pi", category: "greek" },
    { name: "Rho", display: "ρ", template: "\\rho", category: "greek" },
    { name: "Sigma", display: "σ", template: "\\sigma", category: "greek" },
    { name: "Phi", display: "φ", template: "\\phi", category: "greek" },
    { name: "Omega", display: "ω", template: "\\omega", category: "greek" },
    { name: "Delta (Upper)", display: "Δ", template: "\\Delta", category: "greek" },
    { name: "Gamma (Upper)", display: "Γ", template: "\\Gamma", category: "greek" },
    { name: "Lambda (Upper)", display: "Λ", template: "\\Lambda", category: "greek" },
    { name: "Sigma (Upper)", display: "Σ", template: "\\Sigma", category: "greek" },
    { name: "Omega (Upper)", display: "Ω", template: "\\Omega", category: "greek" },

    // Arrows
    { name: "Right Arrow", display: "→", template: "\\rightarrow", category: "arrows" },
    { name: "Left Arrow", display: "←", template: "\\leftarrow", category: "arrows" },
    { name: "Left-Right", display: "↔", template: "\\leftrightarrow", category: "arrows" },
    { name: "Implies", display: "⇒", template: "\\Rightarrow", category: "arrows" },
    { name: "If Only If", display: "⇔", template: "\\Leftrightarrow", category: "arrows" },
    { name: "Maps To", display: "↦", template: "\\mapsto", category: "arrows" },
    { name: "Up Arrow", display: "↑", template: "\\uparrow", category: "arrows" },
    { name: "Down Arrow", display: "↓", template: "\\downarrow", category: "arrows" },

    // Functions
    { name: "Exponential", display: "exp", template: "\\exp([x])", category: "script" },
    { name: "Max", display: "max", template: "\\max([x])", category: "script" },
    { name: "Min", display: "min", template: "\\min([x])", category: "script" },
    { name: "Determinant", display: "det", template: "\\det([A])", category: "script" },
    { name: "GCD", display: "gcd", template: "\\gcd([a],[b])", category: "script" },
    { name: "DEG", display: "deg", template: "\\deg([x])", category: "script" },
    { name: "Mod", display: "mod", template: "\\pmod{[n]}", category: "script" }
  ];

  const categoryLabels: Record<Category, string> = {
    basic: "Basic Operations",
    trigonometric: "Trigonometric",
    calculus: "Calculus & Analysis",
    greek: "Greek Letters",
    arrows: "Arrows",
    fractions: "Fractions & Powers",
    script: "Functions",
    limits: "Limits & Logs"
  };

  const filteredTemplates = templates.filter(t => t.category === selectedCategory);

  return (
    <div style={{ padding: "16px", background: "#ffffff" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            margin: "0 0 6px 0",
            fontSize: "18px",
            fontWeight: 700,
            color: "#1a202c"
          }}
        >
          Visual Equation Builder
        </h3>
        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
          Click templates to insert • Press Tab to jump between [placeholders]
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            padding: "10px 12px",
            marginBottom: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            border: "1px solid #fca5a5"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "10px 12px",
            marginBottom: "12px",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            border: "1px solid #6ee7b7"
          }}
        >
          ✓ Equation inserted successfully!
        </div>
      )}

      {/* Category Selector */}
      <div style={{ marginBottom: "12px" }}>
        <label
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 600,
            marginBottom: "6px",
            color: "#374151"
          }}
        >
          Template Category
        </label>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as Category)}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "14px",
            border: "2px solid #e2e8f0",
            borderRadius: "6px",
            background: "#ffffff",
            cursor: "pointer",
            outline: "none"
          }}
        >
          {(Object.keys(categoryLabels) as Category[]).map(cat => (
            <option key={cat} value={cat}>
              {categoryLabels[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Template Buttons - 3 per row */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px",
          background: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            width: "100%"
          }}
        >
          {filteredTemplates.map(template => (
            <button
              key={template.name}
              onClick={() => insertTemplate(template.template)}
              title={template.name}
              style={{
                padding: "8px 4px",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid #cbd5e0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                fontSize: "20px",
                fontWeight: 500,
                color: "#1a202c",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                minHeight: "68px",
                boxSizing: "border-box",
                overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#416afd";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
                e.currentTarget.style.color = "#1a202c";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  fontSize: template.display.includes("\n") ? "14px" : "20px",
                  lineHeight: 1.1,
                  whiteSpace: "pre-line",
                  textAlign: "center"
                }}
              >
                {template.display}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  opacity: 0.7,
                  textAlign: "center",
                  lineHeight: 1.2
                }}
              >
                {template.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* LaTeX Input with Tab Navigation */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px"
          }}
        >
          <label
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#374151"
            }}
          >
            LaTeX Code
          </label>
          <button
            onClick={() => setLatex("")}
            style={{
              padding: "2px 8px",
              fontSize: "11px",
              color: "#64748b",
              background: "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "#fca5a5";
              e.currentTarget.style.background = "#fef2f2";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "transparent";
            }}
            title="Clear content"
          >
            Clear
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={latex}
          onChange={e => setLatex(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Click templates above or type LaTeX directly"
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "10px",
            fontSize: "13px",
            fontFamily: '"Consolas", "Monaco", monospace',
            border: "2px solid #e2e8f0",
            borderRadius: "6px",
            resize: "vertical",
            boxSizing: "border-box",
            background: "#ffffff",
            outline: "none"
          }}
          onFocus={e => (e.target.style.borderColor = "#416afd")}
          onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
        />
        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
          💡 Tip: Use [brackets] for placeholders, press Tab to navigate between them
        </div>
      </div>

      {/* Live Preview */}
      {/* Live Preview */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#374151",
            marginBottom: "6px"
          }}
        >
          Live Preview
        </div>
        <div
          style={{
            padding: "12px",
            background: "#f9fafb",
            borderRadius: "8px",
            border: "2px solid #e5e7eb",
            minHeight: "60px",
            maxHeight: "120px",
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              fontSize: "20px",
              maxWidth: "100%"
            }}
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            padding: "10px 12px",
            marginBottom: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            border: "1px solid #fca5a5"
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "10px 12px",
            marginBottom: "12px",
            background: "#d1fae5",
            color: "#065f46",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            border: "1px solid #6ee7b7"
          }}
        >
          ✓ Equation inserted successfully!
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Insert Button */}
        <button
          onClick={handleInsert}
          disabled={isProcessing || !latex.trim()}
          style={{
            width: "100%",
            padding: "10px 24px",
            background: isProcessing || !latex.trim() ? "#cbd5e0" : "#416afd",
            color: "white",
            border: "none",
            borderRadius: "9999px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: isProcessing || !latex.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => {
            if (!isProcessing && latex.trim()) {
              e.currentTarget.style.background = "#2546c7";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isProcessing || !latex.trim() ? "#cbd5e0" : "#416afd";
          }}
        >
          {isProcessing ? "Processing..." : "Insert Equation"}
        </button>

        {/* Graph This Equation Button */}
        {onNavigateToGraph && (
          <button
            onClick={() => {
              let cleanedLatex = latex.trim().replace(/^\$+|\$+$/g, "");
              cleanedLatex = cleanedLatex.replace(/\[([^\]]+)\]/g, "$1");
              onNavigateToGraph(cleanedLatex);
            }}
            disabled={!latex.trim()}
            style={{
              width: "100%",
              padding: "10px 24px",
              background: !latex.trim() ? "#e2e8f0" : "#ffffff",
              color: !latex.trim() ? "#94a3b8" : "#416afd",
              border: "2px solid",
              borderColor: !latex.trim() ? "#e2e8f0" : "#416afd",
              borderRadius: "9999px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: !latex.trim() ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onMouseEnter={e => {
              if (latex.trim()) {
                e.currentTarget.style.background = "#416afd";
                e.currentTarget.style.color = "#ffffff";
              }
            }}
            onMouseLeave={e => {
              if (latex.trim()) {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.color = "#416afd";
              }
            }}
          >
            <span>Graph This Equation</span>
          </button>
        )}
      </div>
    </div>
  );
};
