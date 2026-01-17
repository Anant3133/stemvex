import React, { useState } from "react";
import { Button } from "@swc-react/button";

interface AiInputProps {
    onGenerate: (prompt: string) => Promise<void>;
    isLoading: boolean;
    onCancel?: () => void;
}

const SUGGESTIONS = [
    "Bar chart of coffee consumpion by country",
    "Line graph showing bitcoin price in 2024",
    "Scatter plot of GDP vs Life Expectancy",
    "Pie chart of my monthly expenses"
];

export const AiInput: React.FC<AiInputProps> = ({ onGenerate, isLoading, onCancel }) => {
    const [prompt, setPrompt] = useState("");

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || isLoading) return;
        onGenerate(prompt);
    };

    return (
        <div className="section ai-input-section">
            <div className="ai-header">
                <span style={{ fontSize: "24px" }}>✨</span>
                <h3 className="section-title" style={{ margin: 0 }}>Data Storyteller</h3>
            </div>

            <p className="section-description">
                Describe the chart you want to see, and I'll generate the data and design for you.
            </p>

            <div className="form-group">
                <textarea
                    className="ai-textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Show me a bar chart of the top 10 tech companies by market cap..."
                    rows={3}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontFamily: "inherit",
                        fontSize: "14px",
                        resize: "vertical"
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
            </div>

            <div className="action-row">
                <Button
                    variant="cta"
                    onClick={() => handleSubmit()}
                    disabled={isLoading || !prompt.trim()}
                >
                    {isLoading ? "Dreaming up chart..." : "Generate with AI"}
                </Button>
            </div>

            <div className="ai-suggestions" style={{ marginTop: "20px" }}>
                <p className="field-label">Try asking for:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            className="suggestion-chip"
                            onClick={() => {
                                setPrompt(s);
                                // Optional: auto-submit? No, let user edit.
                            }}
                            style={{
                                background: "#f0f0f0",
                                border: "none",
                                borderRadius: "16px",
                                padding: "6px 12px",
                                fontSize: "12px",
                                cursor: "pointer",
                                color: "#333"
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
