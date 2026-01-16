/**
 * MathDigitizer - Component for parsing text/images and extracting formulas
 */
import React, { useState, useRef } from 'react';
import { LatexParser, Token } from '../../engines/parser/LatexParser';
import { MathEngine } from '../../engines/math/MathEngine';
import { MathOCR } from '../../engines/ocr/MathOCR';
import { AddOnSDKAPI, RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from '../../models/DocumentSandboxApi';
import katex from 'katex';

interface MathDigitizerProps {
    addOnUISdk: AddOnSDKAPI;
}

export const MathDigitizer: React.FC<MathDigitizerProps> = ({ addOnUISdk }) => {
    const [inputText, setInputText] = useState('');
    const [tokens, setTokens] = useState<Token[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    // Image OCR State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Scan Image for Math
    const handleScanImage = async () => {
        if (!selectedImage) return;

        setIsScanning(true);
        try {
            const result = await MathOCR.scanImage(selectedImage);
            // Append result to text area wrapped in $$ for automatic block detection
            const newText = inputText + (inputText ? '\n\n' : '') + `$$ ${result.latex} $$`;
            setInputText(newText);

            // Auto-trigger analysis
            setTimeout(() => handleAnalyze(newText), 100);
        } catch (e) {
            console.error(e);
        } finally {
            setIsScanning(false);
        }
    };

    // Process text to find math
    const handleAnalyze = (textToAnalyze = inputText) => {
        setIsThinking(true);
        setTimeout(() => {
            const foundTokens = LatexParser.parse(textToAnalyze);
            setTokens(foundTokens);
            setIsThinking(false);
        }, 500);
    };

    // Filter to just math tokens for the list
    const mathTokens = tokens.filter(t => t.type !== 'text');

    const handleInsertEquation = async (latex: string, x = 50, y = 50) => {
        const engine = new MathEngine();
        try {
            const result = await engine.convertToPNG(latex);
            const arrayBuffer = await result.imageData.arrayBuffer();

            const sandboxApi = await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(RuntimeType.documentSandbox);
            await sandboxApi.insertMath({
                imageData: arrayBuffer,
                width: result.width,
                height: result.height,
                position: { x, y }
            });
            return { width: result.width, height: result.height };
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handleInsertAll = async () => {
        let currentX = 50;
        let currentY = 50;
        const PAGE_LIMIT_HEIGHT = 600;

        for (const token of mathTokens) {
            const dims = await handleInsertEquation(token.content, currentX, currentY);
            if (dims) {
                currentY += dims.height + 30; // 30px gap

                // If we go too far down, reset Y and move X (Next Column)
                if (currentY > PAGE_LIMIT_HEIGHT) {
                    currentY = 50;
                    // Move right by the width of this equation + margin, or at least 250px
                    currentX += Math.max(dims.width + 50, 250);
                }
            }
        }
    };

    return (
        <div style={{ padding: '16px', background: '#fff' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 4px 0', color: '#1a202c' }}>
                Smart Math Parser
            </h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 16px 0' }}>
                Digitize math from text or images
            </p>

            {/* Section 1: Image Scanner */}
            <div style={{
                marginBottom: '16px',
                padding: '12px',
                border: '1px dashed #cbd5e0',
                borderRadius: '8px',
                background: '#f8fafc'
            }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    📷 Scan from Image
                </div>

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                />

                {!selectedImage ? (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#fff',
                            border: '1px solid #cbd5e0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontSize: '12px'
                        }}
                    >
                        Click to Upload Screenshot or Photo
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <img
                            src={selectedImage}
                            style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleScanImage}
                                disabled={isScanning}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    background: isScanning ? '#94a3b8' : '#0f172a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: isScanning ? 'wait' : 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {isScanning ? 'Scanning...' : 'Extract Math via OCR'}
                            </button>
                            <button
                                onClick={() => setSelectedImage(null)}
                                style={{
                                    padding: '8px 12px',
                                    background: '#fff',
                                    border: '1px solid #cbd5e0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                }}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '16px 0' }} />

            {/* Section 2: Text Input */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                        📝 Parse Text & Formulas
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                const sandboxApi = await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(RuntimeType.documentSandbox);
                                const text = await sandboxApi.getSelectedText();
                                if (text) {
                                    setInputText(text);
                                    setTimeout(() => handleAnalyze(text), 100);
                                }
                            } catch (e) { console.error(e); }
                        }}
                        style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            color: '#416afd',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ⬇️ Import Selection
                    </button>
                </div>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste text here (or scan image above)..."
                    style={{
                        width: '100%',
                        height: '100px',
                        padding: '10px',
                        fontSize: '13px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
                <button
                    onClick={() => handleAnalyze()}
                    disabled={!inputText.trim()}
                    style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '8px',
                        background: '#416afd',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    {isThinking ? 'Analyzing...' : 'Scan for Formulas'}
                </button>
            </div>

            {/* Results */}
            {mathTokens.length > 0 && (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                            Found {mathTokens.length} Formulas:
                        </div>
                        <button
                            onClick={handleInsertAll}
                            style={{
                                fontSize: '11px',
                                padding: '4px 10px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            ⚡ Insert All
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mathTokens.map((token, idx) => (
                            <div key={idx} style={{
                                padding: '8px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                background: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: katex.renderToString(token.content, { throwOnError: false })
                                    }}
                                    style={{ fontSize: '14px', maxWidth: '180px', overflowX: 'auto' }}
                                />
                                <button
                                    onClick={() => handleInsertEquation(token.content)}
                                    style={{
                                        fontSize: '11px',
                                        padding: '4px 8px',
                                        background: '#fff',
                                        border: '1px solid #cbd5e0',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Insert
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {mathTokens.length === 0 && tokens.length > 0 && (
                <div style={{ padding: '12px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '13px' }}>
                    No formulas found in the text. Try using $...$ delimiters.
                </div>
            )}
        </div>
    );
};
