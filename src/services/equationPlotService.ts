/**
 * Equation Plot Service
 *
 * Client-side service for communicating with the Python equation plotting server.
 * Sends LaTeX equations and receives mathematical function graph images.
 */

// Server URL - same as plot server
const PLOT_SERVER_URL = "http://localhost:8000";

// Type definitions
export interface EquationPlotRequest {
  latex: string;
  x_min?: number;
  x_max?: number;
  y_min?: number | null;
  y_max?: number | null;
  title?: string;
  color?: string;
  line_width?: number;
  grid?: boolean;
  show_axes?: boolean;
  num_points?: number;
}

export interface ParseResponse {
  valid: boolean;
  python_expr?: string;
  error?: string;
  latex_cleaned?: string;
}

export interface EquationExample {
  latex: string;
  description: string;
}

/**
 * Parse and validate a LaTeX equation
 */
export async function parseEquation(latex: string): Promise<ParseResponse> {
  const response = await fetch(`${PLOT_SERVER_URL}/equation/parse?latex=${encodeURIComponent(latex)}`, {
    method: "POST"
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    return {
      valid: false,
      error: error.detail || error.message || "Failed to parse equation"
    };
  }

  return response.json();
}

/**
 * Render equation graph and get PNG blob
 */
export async function renderEquationPng(request: EquationPlotRequest): Promise<Blob> {
  const response = await fetch(`${PLOT_SERVER_URL}/equation/render-png`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      latex: request.latex,
      x_min: request.x_min ?? -10,
      x_max: request.x_max ?? 10,
      y_min: request.y_min,
      y_max: request.y_max,
      title: request.title,
      color: request.color ?? "#416afd",
      line_width: request.line_width ?? 2.0,
      grid: request.grid ?? true,
      show_axes: request.show_axes ?? true,
      num_points: request.num_points ?? 500
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.detail || error.message || "Failed to render equation");
  }

  return response.blob();
}

/**
 * Get example equations
 */
export async function getEquationExamples(): Promise<EquationExample[]> {
  try {
    const response = await fetch(`${PLOT_SERVER_URL}/equation/examples`);
    if (!response.ok) {
      return DEFAULT_EXAMPLES;
    }
    return response.json();
  } catch {
    return DEFAULT_EXAMPLES;
  }
}

/**
 * Default examples (fallback if server unavailable)
 */
export const DEFAULT_EXAMPLES: EquationExample[] = [
  { latex: "x^2", description: "Parabola" },
  { latex: "x^3 - x", description: "Cubic" },
  { latex: "\\sin(x)", description: "Sine wave" },
  { latex: "\\cos(x)", description: "Cosine wave" },
  { latex: "e^{-x^2}", description: "Gaussian" },
  { latex: "\\frac{1}{x}", description: "Hyperbola" },
  { latex: "\\sqrt{x}", description: "Square root" },
  { latex: "\\ln(x)", description: "Natural log" },
  { latex: "x^2 + \\sin(x)", description: "Polynomial + Trig" },
  { latex: "2^x", description: "Exponential" }
];

/**
 * Validate if an equation looks plottable (basic client-side check)
 */
export function isPlottableEquation(latex: string): boolean {
  if (!latex || !latex.trim()) return false;

  const cleaned = latex
    .trim()
    .replace(/^[yY]\s*=\s*/, "")
    .replace(/^[fFgG]\s*\([^)]*\)\s*=\s*/, "");

  // Must contain x variable
  if (!/x/i.test(cleaned)) {
    // Unless it's a constant
    if (!/\d/.test(cleaned) && !/\\pi|\\e/.test(cleaned)) {
      return false;
    }
  }

  // Check for common math patterns
  const hasMath = /[0-9x]|\^|\\sin|\\cos|\\tan|\\log|\\ln|\\sqrt|\\frac|\\exp/i.test(cleaned);

  return hasMath;
}
