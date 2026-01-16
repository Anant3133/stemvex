import { EquationLabel } from "./types";
import { EquationNormalizer } from "./EquationNormalizer";

export type ClassificationResult = {
    label: EquationLabel;
    labelConfidence: number; // 0..1
};

export class EquationClassifier {
    /**
     * Rule-based MVP classifier.
     * Matching is done on a lightly-normalized string (remove whitespace, remove \left/\right, strip some spacing macros).
     */
    static classify(latex: string): ClassificationResult {
        const cleaned = EquationNormalizer.cleanLatex(latex);
        if (!cleaned) return { label: "Unknown", labelConfidence: 0 };

        let s = cleaned;
        s = s.replace(/\s+/g, "");
        s = s.replace(/\\left/g, "").replace(/\\right/g, "");
        s = s.replace(/\\[,!;:]/g, "");

        // Einstein: E=mc^2 (allow braces around exponent)
        if (/E=mc\^\{?2\}?/i.test(s)) {
            return { label: "Einstein", labelConfidence: 0.95 };
        }

        // Euler identity: e^{i\pi} + 1 = 0
        if (/e\^\{?i\\pi\}?(\+1)?=0/i.test(s) || /e\^\{?i\\pi\}?\+1=0/i.test(s)) {
            return { label: "Euler", labelConfidence: 0.95 };
        }

        // Pythagorean: a^2 + b^2 = c^2 (allow any single-letter variables)
        // Example: x^{2}+y^{2}=z^{2}
        if (/([a-zA-Z])\^\{?2\}?\+([a-zA-Z])\^\{?2\}?=([a-zA-Z])\^\{?2\}?/.test(s)) {
            return { label: "Pythagorean", labelConfidence: 0.85 };
        }

        // Quadratic formula: detect core markers (robust to variable naming differences)
        // Typical: \frac{-b \pm \sqrt{b^{2} - 4ac}}{2a}
        if (
            s.includes("\\frac") &&
            s.includes("\\pm") &&
            s.includes("\\sqrt") &&
            /4[a-zA-Z][a-zA-Z]/.test(s) && // "4ac" pattern
            /2[a-zA-Z]/.test(s) && // "2a"
            /-([a-zA-Z])/.test(s)
        ) {
            return { label: "Quadratic", labelConfidence: 0.8 };
        }

        // Integral: contains \int (covers definite/indefinite)
        if (s.includes("\\int")) {
            return { label: "Integral", labelConfidence: 0.7 };
        }

        return { label: "Unknown", labelConfidence: 0 };
    }
}


