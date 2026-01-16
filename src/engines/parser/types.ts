export type EquationLabel =
  | "Einstein"
  | "Pythagorean"
  | "Quadratic"
  | "Euler"
  | "Integral"
  | "Unknown";

export type ParsedEquation = {
  id: string; // stable id for UI list (uuid)
  latex: string; // raw LaTeX from OCR (cleaned)
  normalizedKey: string; // used for dedupe
  ocrConfidence?: number; // provider confidence (0..1)
  label: EquationLabel;
  labelConfidence?: number; // 0..1
  source: "image";
};

export type MathOcrCandidate = {
  latex: string;
  confidence?: number; // 0..1
};
