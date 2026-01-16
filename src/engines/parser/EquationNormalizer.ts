/**
 * EquationNormalizer
 * - Produces a normalized key for deduplication (remove only formatting noise, not values)
 * - Produces a cleaned LaTeX for display/insertion (light cleanup)
 */
export class EquationNormalizer {
  /**
   * Light cleanup for display/insertion:
   * - trim
   * - strip surrounding $ / $$ (common OCR output)
   */
  static cleanLatex(latex: string): string {
    const trimmed = (latex ?? "").trim();
    if (!trimmed) return "";
    return trimmed.replace(/^\$+|\$+$/g, "").trim();
  }

  /**
   * Normalization policy for dedupe (MVP):
   * - Trim leading/trailing whitespace.
   * - Collapse internal whitespace/newlines.
   * - Normalize common bracket wrappers: remove \left / \right tokens.
   * - Remove spacing macros: \,, \!, \;, \: (key only).
   * - Do NOT reorder terms / simplify algebra / remove numbers/constants.
   */
  static toNormalizedKey(latex: string): string {
    let s = EquationNormalizer.cleanLatex(latex);

    // Collapse whitespace/newlines
    s = s.replace(/\s+/g, " ").trim();

    // Normalize \left( -> ( and \right) -> ) (and [], {})
    // We do this by removing the \left/\right tokens only.
    s = s.replace(/\\left\s*/g, "");
    s = s.replace(/\\right\s*/g, "");

    // Remove spacing macros ONLY for key computation
    s = s.replace(/\\[,!;:]/g, "");

    // Collapse whitespace again after removals
    s = s.replace(/\s+/g, " ").trim();

    return s;
  }
}
