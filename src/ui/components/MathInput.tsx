/**
 * MathInput - React component for LaTeX equation input
 * Provides a text area for LaTeX input and a button to insert equations
 */

import React, { useState, useRef } from "react";
import { MathEngine } from "../../engines/math/MathEngine";
import {
  AddOnSDKAPI,
  RuntimeType,
} from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";

// Access to the AddOn SDK is passed from index.tsx
// We'll receive it via props instead
interface MathInputProps {
  addOnUISdk: AddOnSDKAPI;
  latex?: string;
  onLatexChange?: (latex: string) => void;
}

export const MathInput: React.FC<MathInputProps> = ({
  addOnUISdk,
  latex: externalLatex,
  onLatexChange,
}) => {
  const latex = externalLatex ?? "E = mc^{2}";
  const setLatex = onLatexChange ?? (() => {});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Lazy initialize MathEngine only when needed
  const mathEngineRef = useRef<MathEngine | null>(null);

  const getMathEngine = () => {
    if (!mathEngineRef.current) {
      mathEngineRef.current = new MathEngine();
    }
    return mathEngineRef.current;
  };

  const handleInsert = async () => {
    setError(null);
    setSuccess(false);

    // Clean up LaTeX: remove dollar signs if present
    let cleanedLatex = latex.trim();
    // Remove leading/trailing $ or $$
    cleanedLatex = cleanedLatex.replace(/^\$+|\$+$/g, "");

    // Validate LaTeX
    const validation = MathEngine.validateLaTeX(cleanedLatex);
    if (!validation.valid) {
      setError(validation.error || "Invalid LaTeX");
      return;
    }

    setIsProcessing(true);

    try {
      // Convert LaTeX to PNG in the UI
      const mathResult = await getMathEngine().convertToPNG(cleanedLatex);

      // Convert Blob to ArrayBuffer for transfer to sandbox
      const arrayBuffer = await mathResult.imageData.arrayBuffer();

      // Get the document sandbox API
      const sandboxApi =
        await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(
          RuntimeType.documentSandbox
        );

      // Send the image data to the sandbox for rendering
      await sandboxApi.insertMath({
        imageData: arrayBuffer,
        width: mathResult.width,
        height: mathResult.height,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to insert equation"
      );
      console.error("Insert math error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleEquations = [
    // Basic examples
    { label: "Einstein", latex: "E = mc^{2}" },
    { label: "Pythagorean", latex: "a^{2} + b^{2} = c^{2}" },

    // Fractions
    { label: "Fraction", latex: "\\frac{a}{b} = \\frac{c}{d}" },
    {
      label: "Quadratic",
      latex: "x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}",
    },

    // Calculus - Integrals
    { label: "Integral", latex: "\\int_{a}^{b} f(x) \\, dx" },
    { label: "Double Integral", latex: "\\iint_{D} f(x,y) \\, dA" },

    // Calculus - Derivatives
    { label: "Derivative", latex: "\\frac{d}{dx} f(x) = f'(x)" },
    { label: "Partial Derivative", latex: "\\frac{\\partial f}{\\partial x}" },

    // Summations and Products
    { label: "Summation", latex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" },
    { label: "Product", latex: "\\prod_{i=1}^{n} x_{i}" },

    // Limits
    { label: "Limit", latex: "\\lim_{x \\to \\infty} \\frac{1}{x} = 0" },

    // Subscripts & Superscripts
    { label: "Subscript", latex: "x_{1}, x_{2}, \\ldots, x_{n}" },
    { label: "Power Tower", latex: "x^{y^{z}}" },

    // Greek letters
    {
      label: "Greek",
      latex: "\\alpha, \\beta, \\gamma, \\delta, \\pi, \\theta",
    },
    { label: "Euler", latex: "e^{i\\pi} + 1 = 0" },

    // Trigonometry
    { label: "Trig Identity", latex: "\\sin^{2}(x) + \\cos^{2}(x) = 1" },

    // Matrix (simple)
    {
      label: "Matrix",
      latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
    },

    // Complex expressions
    {
      label: "Complex",
      latex: "\\frac{\\partial^{2} u}{\\partial t^{2}} = c^{2} \\nabla^{2} u",
    },
  ];

  return (
    <div style={{ padding: "16px" }}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: "12px",
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        Math Engine
      </h3>

      <p style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
        Enter LaTeX equations (without $ delimiters). Use braces for
        superscripts/subscripts: x^{"{2}"}, x_{"{i}"}
      </p>

      {/* LaTeX Input */}
      <textarea
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        placeholder="Enter LaTeX (e.g., E = mc^{2})"
        style={{
          width: "100%",
          minHeight: "80px",
          padding: "8px",
          fontSize: "14px",
          fontFamily: "monospace",
          border: "1px solid #ccc",
          borderRadius: "4px",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      {/* Error/Success Messages */}
      {error && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#fee",
            color: "#c00",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#efe",
            color: "#070",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          ✓ Equation inserted successfully!
        </div>
      )}

      {/* Insert Button */}
      <button
        onClick={handleInsert}
        disabled={isProcessing || !latex.trim()}
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "10px",
          backgroundColor: isProcessing ? "#ccc" : "#0d66d0",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: 500,
          cursor: isProcessing ? "not-allowed" : "pointer",
        }}
      >
        {isProcessing ? "Processing..." : "Insert Equation"}
      </button>

      {/* Example Equations */}
      <div style={{ marginTop: "16px" }}>
        <p style={{ fontSize: "12px", fontWeight: 500, marginBottom: "8px" }}>
          Examples (click to use):
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            maxHeight: "200px",
            overflowY: "auto",
            padding: "4px",
            border: "1px solid #eee",
            borderRadius: "4px",
          }}
        >
          {exampleEquations.map((eq) => (
            <button
              key={eq.label}
              onClick={() => setLatex(eq.latex)}
              style={{
                padding: "6px 10px",
                fontSize: "11px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "4px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {eq.label}
            </button>
          ))}
        </div>
      </div>

      {/* LaTeX Cheatsheet */}
      <details style={{ marginTop: "16px", fontSize: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: 500 }}>
          LaTeX Quick Reference
        </summary>
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#f9f9f9",
            borderRadius: "4px",
          }}
        >
          <p>
            <code>^{"{}"}</code> - Superscript: <code>x^{"{2}"}</code> → x²
          </p>
          <p>
            <code>_{"{}"}</code> - Subscript: <code>x_{"{i}"}</code> → xᵢ
          </p>
          <p>
            <code>
              \frac{"{a}"}
              {"{b}"}
            </code>{" "}
            - Fraction
          </p>
          <p>
            <code>\sqrt{"{x}"}</code> - Square root
          </p>
          <p>
            <code>\int</code> - Integral, <code>\sum</code> - Summation
          </p>
          <p>
            <code>\alpha, \beta, \pi</code> - Greek letters
          </p>
          <p style={{ marginTop: "8px", fontStyle: "italic" }}>
            Note: Don't use $ delimiters
          </p>
        </div>
      </details>
    </div>
  );
};
