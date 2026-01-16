/**
 * LatexParser - Parses mixed text to identify math formulas
 */

export type TokenType = 'text' | 'inline-math' | 'display-math';

export interface Token {
    type: TokenType;
    content: string; // The text content or the latex formula
    raw: string;     // The original substring including delimiters
}

export class LatexParser {
    /**
     * Parse a text string into a list of tokens
     * Example: "Solve $x^2$" -> [{text: "Solve "}, {inline: "x^2"}]
     */
    static parse(input: string): Token[] {
        if (!input) return [];

        const tokens: Token[] = [];

        // Regex Logic:
        // 1. $$ ... $$  (Display Math)
        // 2. \[ ... \]  (Display Math)
        // 3. $ ... $    (Inline Math) - Careful to avoid \\$
        // 4. \( ... \)  (Inline Math)

        // Note: The order matters. Display strings usually take precedence.
        const regex = /(\$\$([\s\S]+?)\$\$)|(\\\[([\s\S]+?)\\\])|(\$((?:\\[\s\S]|[^\$\\])+?)\$)|(\\\(([\s\S]+?)\\\))/g;

        let lastIndex = 0;
        let match;

        while ((match = regex.exec(input)) !== null) {
            // 1. Capture preceding text
            if (match.index > lastIndex) {
                tokens.push({
                    type: 'text',
                    content: input.slice(lastIndex, match.index),
                    raw: input.slice(lastIndex, match.index)
                });
            }

            // 2. Identify which group matched to determine type
            // match[0] is the full match (e.g. $$x$$)

            let type: TokenType = 'text';
            let content = '';

            if (match[1]) {
                // $$...$$
                type = 'display-math';
                content = match[2];
            } else if (match[3]) {
                // \[...\]
                type = 'display-math';
                content = match[4];
            } else if (match[5]) {
                // $...$
                type = 'inline-math';
                content = match[6];
            } else if (match[7]) {
                // \(...\)
                type = 'inline-math';
                content = match[8];
            }

            tokens.push({
                type,
                content: content.trim(),
                raw: match[0]
            });

            lastIndex = regex.lastIndex;
        }

        // 3. Capture remaining text
        if (lastIndex < input.length) {
            tokens.push({
                type: 'text',
                content: input.slice(lastIndex),
                raw: input.slice(lastIndex)
            });
        }

        // PASS 2: Heuristic Parsing for "Implicit Math"
        // Scan "text" tokens for patterns like "E = mc^2" or "sin(x)" or "x^2"
        return tokens.reduce((acc: Token[], token) => {
            if (token.type !== 'text') {
                acc.push(token);
                return acc;
            }

            // 1. Full Equations: e.g. "P(x) = \sum ..." or "(fg)' = f'g + fg"
            // Captures LHS = RHS.
            // RHS Logic: Match math symbols/tokens, allowing spaces, BUT stop if we see:
            // - A Capitalized word (Start of sentence) like "This", "The"
            // - Common english non-math words > 3 chars (unless known functions)
            // - A period followed by space
            const equationRegex = /(?:[a-zA-Z0-9\(\)'′\[\]\{\}\\_]+\s*[=≈≡→]\s*(?:(?![A-Z][a-z]+|\b(and|the|this|that|then|where|allows|linearity)\b)[\w\d\+\-\*\/\^\(\)\{\}\[\]_\\∑∫∏∂∇√∞!]+(?:\s+(?![A-Z][a-z]{2,}|\b(and|the|this|that|then|where|allows|linearity)\b)[\w\d\+\-\*\/\^\(\)\{\}\[\]_\\∑∫∏∂∇√∞!]+)*))(?=[.,;:?!]?(?:\s|$))/g;

            // 2. Complex Structure Glue: e.g. "\sum a_i" or "∫ f(x) dx"
            const complexRegex = /(?:[∑∫∏∂∇√]\s*(?:(?![A-Z][a-z]+)[\w\d\+\-\*\/\^\(\)\{\}\[\]_\\=]+(?:\s+(?![A-Z][a-z]{2,})[\w\d\+\-\*\/\^\(\)\{\}\[\]_\\=]+)*))(?=[.,;:?!]?(?:\s|$))/g;

            // 3. Standalone Terms
            const termsRegex = /([a-zA-Z0-9]+\^[a-zA-Z0-9\(\)\{\}\-]+|[a-zA-Z0-9]+_[a-zA-Z0-9\(\)\{\}\-]+|\b(?:sin|cos|tan|log|ln|lim|sum|int|sqrt)\b\s*[\(\[].*?[\)\]])/g;

            // Combined regex logic with the new strict patterns
            const combinedRegex = new RegExp(`${equationRegex.source}|${complexRegex.source}|${termsRegex.source}`, 'g');

            const subTokens: Token[] = [];
            let remainingText = token.content;
            let currentIdx = 0;

            // Helper to add text segment
            const addText = (text: string) => {
                if (text) subTokens.push({ type: 'text', content: text, raw: text });
            };

            let lastIndex = 0;
            let match;

            while ((match = combinedRegex.exec(remainingText)) !== null) {
                const fullMatch = match[0];

                // Extra Validation: 
                // Ensure the match actually looks like math and not just "x = y" that happens to be text.
                // Equations with = are usually safe.

                // If the match is just one word, ignore it (safety).
                if (!/[=\+\-\*\/\^\_\\]|[\u2200-\u22FF]/.test(fullMatch)) {
                    continue;
                }

                if (match.index > lastIndex) {
                    addText(remainingText.slice(lastIndex, match.index));
                }

                subTokens.push({
                    type: 'inline-math',
                    content: fullMatch.trim(),
                    raw: fullMatch
                });

                lastIndex = combinedRegex.lastIndex;
            }

            if (lastIndex < remainingText.length) {
                addText(remainingText.slice(lastIndex));
            }

            if (subTokens.length > 0) {
                acc.push(...subTokens);
            } else {
                acc.push(token);
            }
            return acc;
        }, []);
    }

    /**
     * Extracts ONLY the math formulas from a text
     */
    static extractFormulas(input: string): string[] {
        return this.parse(input)
            .filter(t => t.type !== 'text')
            .map(t => t.content);
    }
}
