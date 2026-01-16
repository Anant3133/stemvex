import { MathOcrCandidate } from "./types";

declare const __STEMVEX_MATH_OCR_API_KEY__: string;
declare const __STEMVEX_MATH_OCR_ENDPOINT__: string;

type GenericOcrResponse = {
  equations?: Array<{ latex: string; confidence?: number }>;
};

/**
 * MathOcrClient
 * MVP: client-side call to a math OCR endpoint.
 *
 * Supported modes:
 * - Generic endpoint (recommended): expects JSON { equations: [{ latex, confidence? }] }
 *   Request: JSON { imageBase64, mimeType, multipleEquations: true }
 *   Auth: Authorization: Bearer <MATH_OCR_API_KEY>
 *
 * - Mathpix adapter (best-effort): if endpoint includes "mathpix.com"
 *   API key format expected: "<app_id>:<app_key>" in MATH_OCR_API_KEY
 *   Returns 1 equation from latex_styled/latex if available.
 *
 * Note: Do NOT log the API key.
 */
export class MathOcrClient {
  private readonly apiKey: string;
  private readonly endpoint: string;

  constructor(opts?: { apiKey?: string; endpoint?: string }) {
    this.apiKey = (opts?.apiKey ?? "").trim();
    this.endpoint = (opts?.endpoint ?? "").trim();
  }

  static fromEnv(): MathOcrClient {
    const apiKey = (
      typeof __STEMVEX_MATH_OCR_API_KEY__ === "string"
        ? __STEMVEX_MATH_OCR_API_KEY__
        : ""
    ).trim();
    const endpoint = (
      typeof __STEMVEX_MATH_OCR_ENDPOINT__ === "string"
        ? __STEMVEX_MATH_OCR_ENDPOINT__
        : ""
    ).trim();
    return new MathOcrClient({ apiKey, endpoint });
  }

  async parseImage(file: File): Promise<MathOcrCandidate[]> {
    if (!this.endpoint) {
      throw new Error(
        "Math OCR endpoint is not configured. Set MATH_OCR_ENDPOINT."
      );
    }
    if (!this.apiKey) {
      throw new Error(
        "Math OCR API key is not configured. Set MATH_OCR_API_KEY."
      );
    }

    const dataUrl = await MathOcrClient.fileToDataUrl(file);

    if (this.endpoint.includes("mathpix.com")) {
      return await this.parseWithMathpix(dataUrl);
    }
    return await this.parseWithGenericEndpoint(dataUrl, file.type);
  }

  private async parseWithGenericEndpoint(
    imageBase64: string,
    mimeType: string
  ): Promise<MathOcrCandidate[]> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        multipleEquations: true,
      }),
    });

    if (!res.ok) {
      const text = await MathOcrClient.safeReadText(res);
      throw new Error(
        `OCR request failed (${res.status}): ${text || res.statusText}`
      );
    }

    const json = (await res.json()) as GenericOcrResponse;
    const equations = json.equations ?? [];
    return equations
      .filter((e) => typeof e.latex === "string" && e.latex.trim().length > 0)
      .map((e) => ({ latex: e.latex, confidence: e.confidence }));
  }

  private async parseWithMathpix(
    srcDataUrl: string
  ): Promise<MathOcrCandidate[]> {
    // Expect "<app_id>:<app_key>"
    const [appId, appKey] = this.apiKey.split(":");
    if (!appId || !appKey) {
      throw new Error('For Mathpix, set MATH_OCR_API_KEY="<app_id>:<app_key>"');
    }

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        app_id: appId,
        app_key: appKey,
      },
      body: JSON.stringify({
        src: srcDataUrl,
        formats: ["latex_styled", "latex"],
        ocr: ["math", "text"],
      }),
    });

    if (!res.ok) {
      const text = await MathOcrClient.safeReadText(res);
      throw new Error(
        `OCR request failed (${res.status}): ${text || res.statusText}`
      );
    }

    const json = (await res.json()) as {
      latex_styled?: string;
      latex?: string;
      error?: string;
    };
    const latex = (json.latex_styled ?? json.latex ?? "").trim();
    if (!latex) return [];
    // Mathpix does not provide a stable 0..1 confidence for the whole equation here.
    return [{ latex }];
  }

  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  private static async safeReadText(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
}
