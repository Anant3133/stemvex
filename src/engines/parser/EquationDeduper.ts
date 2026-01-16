import { ParsedEquation } from "./types";

export class EquationDeduper {
    /**
     * Deduplicate by normalizedKey; keep the first occurrence only.
     */
    static dedupe(equations: ParsedEquation[]): ParsedEquation[] {
        const seen = new Set<string>();
        const out: ParsedEquation[] = [];

        for (const eq of equations) {
            if (!eq.normalizedKey) continue;
            if (seen.has(eq.normalizedKey)) continue;
            seen.add(eq.normalizedKey);
            out.push(eq);
        }

        return out;
    }
}


