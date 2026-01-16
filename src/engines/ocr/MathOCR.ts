/**
 * MathOCR - Service to convert images to Text/LaTeX
 * Supports:
 * 1. Cloud LLM (OpenAI/Compatible/Gemini) -> Full Paragraph Reconstruction
 */

export interface OCRResult {
    latex: string;
    confidence: number;
    error?: string;
}

export interface OCRConfig {
    apiKey?: string;
    apiUrl?: string;
    model?: string;
}

const SYSTEM_PROMPT = `You are a document understanding and math reconstruction engine.

Your task is to reconstruct clean, editable academic text from OCR outputs of textbook or research images.

INPUT YOU WILL RECEIVE:
1. Plain OCR text extracted from an image (may contain errors, broken symbols, or math written in natural text)
2. Optional LaTeX equations extracted separately from math OCR (pix2tex / LaTeX-OCR)

YOUR GOAL:
- Produce a clean academic paragraph
- Preserve the original meaning exactly
- Convert ALL mathematical expressions into LaTeX when possible
- Use inline math ($...$) for symbols inside sentences
- Use display math (\\[ ... \\]) for standalone equations
- Output LaTeX-first; if conversion is ambiguous, keep readable text

STRICT RULES:
- DO NOT explain your reasoning
- DO NOT summarize or simplify content
- DO NOT solve equations
- DO NOT invent symbols or values
- DO NOT add references or citations
- DO NOT change scientific meaning
- DO NOT output markdown or comments

MATH RULES:
- Greek letters -> LaTeX (\\gamma, \\theta, \\rho)
- Superscripts/subscripts -> ^ and _
- Fractions -> \\frac{numerator}{denominator}
- Inequalities -> proper LaTeX (>, <, \\geq, \\leq)
- Units remain plain text unless mathematical
- Use \\cos, \\sin, \\log, etc. (never plain text)

FORMATTING RULES:
- Maintain paragraph structure
- Inline math -> $...$
- Display equations -> \\[ ... \\]
- One equation per display block
- Balanced braces required
- Output must compile in LaTeX

ERROR HANDLING:
- If a mathematical expression is unreadable or ambiguous, keep it as plain text
- NEVER guess math
- Prefer correctness over elegance

OUTPUT FORMAT:
- Return ONLY the reconstructed text
- No headers, no explanations, no metadata
- LaTeX-compatible plain text only

You are optimized for scientific textbooks, physics, mathematics, and engineering content.
Accuracy and faithfulness are more important than stylistic polish.`;

export class MathOCR {

    /**
     * Converts an image to LaTeX/Text using Cloud LLM
     */
    static async scanImage(imageBase64: string, config: OCRConfig): Promise<OCRResult> {

        // Ensure API Key exists
        if (!config.apiKey) {
            return {
                latex: '',
                confidence: 0,
                error: 'Missing Cloud API Key. Please configure LLM_API_KEY in .env file.'
            };
        }

        return MathOCR.scanWithLLM(imageBase64, config);
    }

    private static async scanWithLLM(imageBase64: string, config: OCRConfig): Promise<OCRResult> {
        console.log("MathOCR: Starting Cloud Scan...");
        console.log("MathOCR: Config Provider:", process.env.LLM_PROVIDER);
        console.log("MathOCR: Config Model:", config.model);
        console.log("MathOCR: API Key Start:", config.apiKey ? config.apiKey.substring(0, 5) + "..." : "NONE");

        // Force reload of provider from env if passed config is generic
        const provider = process.env.LLM_PROVIDER || 'openai';

        // Route to Gemini
        if (config.model?.includes('gemini') || provider === 'gemini') {
            console.log("MathOCR: Routing to Gemini Engine.");
            return MathOCR.scanWithGemini(imageBase64, config);
        }

        console.log("MathOCR: Routing to OpenAI Engine.");
        try {
            console.log("Sending to LLM Cloud (OpenAI Format)...");
            const apiUrl = config.apiUrl || 'https://api.openai.com/v1/chat/completions';
            const model = config.model || 'gpt-4o';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Please reconstruct the text and math from this image." },
                                { type: "image_url", image_url: { url: imageBase64 } }
                            ]
                        }
                    ],
                    max_tokens: 1000
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error.message);
            if (!data.choices?.length) throw new Error('No response from AI');

            let content = data.choices[0].message.content.trim();
            // Clean markdown fences
            content = content.replace(/^```(latex|text)?\s*/, '').replace(/```$/, '');

            return { latex: content, confidence: 0.95 };

        } catch (e) {
            console.error("LLM Error:", e);
            return { latex: '', confidence: 0, error: `Cloud OCR Failed: ${e}` };
        }
    }

    private static async scanWithGemini(imageBase64: string, config: OCRConfig): Promise<OCRResult> {
        let currentModel = config.model || 'gemini-1.5-flash';

        // Image must be pure base64 without header
        const cleanBase64 = imageBase64.split(',')[1];
        console.log("MathOCR: Image payload size:", cleanBase64.length);

        // Helper to run request
        const runGeminiRequest = async (modelName: string) => {
            console.log(`MathOCR: Requesting Gemini Model: ${modelName}`);
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`;

            return fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: SYSTEM_PROMPT },
                            {
                                inline_data: {
                                    mime_type: "image/png",
                                    data: cleanBase64
                                }
                            }
                        ]
                    }]
                })
            });
        };

        try {
            console.log("MathOCR: Preparing Gemini Request...");

            // First Attempt
            let response = await runGeminiRequest(currentModel);

            // Retry if 404 (Model Not Found) or 429 (Rate Limit / Quota Exceeded)
            // or 400 (Bad Request - sometimes implies model access issues)
            if (!response.ok) {
                const errText = await response.clone().text();
                console.warn(`MathOCR: Model ${currentModel} failed (${response.status}). Body: ${errText.substring(0, 100)}...`);
                console.warn(`MathOCR: Retrying with available models from your list...`);

                // Fallback 1: Flash Lite (Often has separate/higher quota)
                // From your logs: gemini-2.0-flash-lite-preview-02-05
                console.log("MathOCR: Trying fallback 'gemini-2.0-flash-lite-preview-02-05'...");
                response = await runGeminiRequest('gemini-2.0-flash-lite-preview-02-05');

                // Fallback 2: Generic Flash Alias
                if (!response.ok) {
                    console.warn("MathOCR: Lite failed. Retrying with 'gemini-flash-latest'...");
                    response = await runGeminiRequest('gemini-flash-latest');
                }
            }

            console.log("MathOCR: Gemini Response Status:", response.status);
            const data = await response.json();

            if (data.error) {
                console.error("MathOCR: Gemini API Error Body:", data.error);
                throw new Error(data.error.message || 'Gemini API Error');
            }
            if (!data.candidates?.length) throw new Error('No response candidates from Gemini');

            let content = data.candidates[0].content.parts[0].text;
            console.log("MathOCR: Raw Content Received (truncated):", content.substring(0, 50) + "...");

            content = content.replace(/^```(latex|text)?\s*/, '').replace(/```$/, '');

            return { latex: content, confidence: 0.99 };

        } catch (e) {
            console.error("Gemini Error:", e);
            // Diagnostic can remain for future debugging
            return { latex: '', confidence: 0, error: `Gemini OCR Failed: ${e}` };
        }
    }
}
