/**
 * MathEngine - Converts LaTeX to bitmap image for rendering in Adobe Express
 *
 * Uses KaTeX for fast, reliable LaTeX rendering, then converts to PNG
 * Adobe Express SDK has limited support for vector graphics, so we use raster for reliability
 *
 * Why this lives in the UI:
 * - Needs DOM and Canvas API for rendering
 * - The Document Sandbox has no DOM access
 * - We process the LaTeX here and create bitmap data to send to sandbox
 */

import katex from "katex";
import html2canvas from "html2canvas";

export interface MathResult {
  imageData: Blob; // PNG image data
  width: number; // Image width in pixels
  height: number; // Image height in pixels
}

export class MathEngine {
  /**
   * Convert LaTeX string to PNG image
   * @param latex - LaTeX equation (e.g., "E = mc^2")
   * @returns MathResult with PNG data and dimensions
   */
  async convertToPNG(latex: string, color: string = "#000000"): Promise<MathResult> {
    if (!latex || latex.trim() === "") {
      throw new Error("LaTeX input cannot be empty");
    }

    try {
      console.log("Converting LaTeX to PNG:", latex);

      // Render LaTeX to HTML using KaTeX
      const htmlString = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: true,
        output: "html",
        strict: false,
        trust: false
      });

      console.log("KaTeX rendered successfully");

      // Create a temporary container to measure and render
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px"; // Off-screen but visible
      container.style.top = "-9999px";
      container.style.fontSize = "18px"; // Small standard size
      container.style.color = color;
      container.style.fontFamily = "KaTeX_Main, Times New Roman, serif";
      container.style.padding = "4px";
      container.style.backgroundColor = "transparent"; // Transparent background
      container.style.display = "inline-block"; // Shrink to content
      container.innerHTML = htmlString;
      document.body.appendChild(container);

      try {
        // Render using html2canvas
        return await this.renderToCanvas(container);
      } finally {
        if (container.parentNode) {
          document.body.removeChild(container);
        }
      }
    } catch (error) {
      console.error("LaTeX to PNG conversion error:", error);
      throw new Error(`Failed to convert LaTeX: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render HTML element to canvas and return as PNG blob with dimensions
   * Uses html2canvas to avoid tainted canvas issues with foreignObject
   */
  private async renderToCanvas(element: HTMLElement): Promise<MathResult> {
    // Use html2canvas to render the KaTeX HTML directly to canvas
    // This avoids the tainted canvas issue with SVG foreignObject
    const renderedCanvas = await html2canvas(element, {
      backgroundColor: null, // Transparent background
      scale: 1.5, // Slight scale for decent quality but small size
      logging: true, // Enable logging to debug
      useCORS: true,
      allowTaint: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    console.log(`html2canvas created: ${renderedCanvas.width}x${renderedCanvas.height}`);

    // Convert the rendered canvas directly to PNG blob
    const imageData = await new Promise<Blob>((resolve, reject) => {
      renderedCanvas.toBlob(
        blob => {
          if (blob) {
            console.log(`PNG blob created: ${blob.size} bytes`);
            resolve(blob);
          } else {
            reject(new Error("Failed to create PNG blob"));
          }
        },
        "image/png",
        1.0
      ); // Quality 1.0 for maximum quality
    });

    return {
      imageData,
      width: renderedCanvas.width,
      height: renderedCanvas.height
    };
  }

  /**
   * Validate LaTeX syntax before conversion (basic check)
   */
  static validateLaTeX(latex: string): { valid: boolean; error?: string } {
    if (!latex || latex.trim() === "") {
      return { valid: false, error: "LaTeX string is empty" };
    }

    // Basic bracket matching
    const openBrackets = (latex.match(/{/g) || []).length;
    const closeBrackets = (latex.match(/}/g) || []).length;

    if (openBrackets !== closeBrackets) {
      return { valid: false, error: "Mismatched curly braces" };
    }

    // Check for common errors
    if (latex.includes("\\\\") && !latex.includes("\\begin")) {
      return { valid: false, error: "Line breaks (\\\\) should be used inside environments like \\begin{array}" };
    }

    return { valid: true };
  }
}
