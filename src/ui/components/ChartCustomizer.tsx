/**
 * ChartCustomizer - Collapsible panel for comprehensive chart customization
 */
import React, { useState } from "react";
import {
    FigureConfig,
    FontConfig,
    TitleConfig,
    LabelConfig,
    TickConfig,
    GridConfig,
    LegendConfig,
    SpineConfig,
    StyleConfig,
    DEFAULT_CUSTOMIZATION,
    COLOR_PALETTES,
    FontFamily,
    FontWeight,
    LineStyle,
    GridAxis,
    LegendPosition,
    PlotType,
} from "../../services/plotService";
import "./ChartCustomizer.css";

// Section collapse state
interface SectionState {
    figure: boolean;
    title: boolean;
    grid: boolean;
    legend: boolean;
    style: boolean;
    spines: boolean;
}

interface ChartCustomizerProps {
    plotType: PlotType;
    figure: FigureConfig;
    font: FontConfig;
    title: TitleConfig;
    xLabel: LabelConfig;
    yLabel: LabelConfig;
    ticks: TickConfig;
    grid: GridConfig;
    legend: LegendConfig;
    spines: SpineConfig;
    style: StyleConfig;
    onFigureChange: (config: FigureConfig) => void;
    onFontChange: (config: FontConfig) => void;
    onTitleChange: (config: TitleConfig) => void;
    onXLabelChange: (config: LabelConfig) => void;
    onYLabelChange: (config: LabelConfig) => void;
    onTicksChange: (config: TickConfig) => void;
    onGridChange: (config: GridConfig) => void;
    onLegendChange: (config: LegendConfig) => void;
    onSpinesChange: (config: SpineConfig) => void;
    onStyleChange: (config: StyleConfig) => void;
    onClose: () => void;
}

export const ChartCustomizer: React.FC<ChartCustomizerProps> = ({
    plotType,
    figure,
    font,
    title,
    xLabel,
    yLabel,
    ticks,
    grid,
    legend,
    spines,
    style,
    onFigureChange,
    onFontChange,
    onTitleChange,
    onXLabelChange,
    onYLabelChange,
    onTicksChange,
    onGridChange,
    onLegendChange,
    onSpinesChange,
    onStyleChange,
    onClose,
}) => {
    const [sections, setSections] = useState<SectionState>({
        figure: true,
        title: true,
        grid: false,
        legend: false,
        style: true,
        spines: false,
    });

    const toggleSection = (key: keyof SectionState) => {
        setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const renderSectionHeader = (
        key: keyof SectionState,
        title: string,
        icon: string
    ) => (
        <div className="section-header" onClick={() => toggleSection(key)}>
            <span className="section-icon">{icon}</span>
            <span className="section-title">{title}</span>
            <span className={`section-arrow ${sections[key] ? "open" : ""}`}>▸</span>
        </div>
    );

    return (
        <div className="customizer-panel">
            {/* Header */}
            <div className="customizer-header">
                <h3>⚙️ Chart Settings</h3>
                <button className="close-btn" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="customizer-content">
                {/* Figure Settings */}
                <div className="customizer-section">
                    {renderSectionHeader("figure", "Figure", "📐")}
                    {sections.figure && (
                        <div className="section-content">
                            <div className="input-row">
                                <label>Size</label>
                                <div className="size-inputs">
                                    <input
                                        type="number"
                                        value={figure.width || 800}
                                        onChange={(e) =>
                                            onFigureChange({ ...figure, width: Number(e.target.value) })
                                        }
                                        min={200}
                                        max={2000}
                                    />
                                    <span>×</span>
                                    <input
                                        type="number"
                                        value={figure.height || 500}
                                        onChange={(e) =>
                                            onFigureChange({ ...figure, height: Number(e.target.value) })
                                        }
                                        min={200}
                                        max={1500}
                                    />
                                    <span>px</span>
                                </div>
                            </div>

                            <div className="input-row">
                                <label>DPI</label>
                                <select
                                    value={figure.dpi || 150}
                                    onChange={(e) =>
                                        onFigureChange({ ...figure, dpi: Number(e.target.value) })
                                    }
                                >
                                    <option value={100}>100 (Fast)</option>
                                    <option value={150}>150 (Standard)</option>
                                    <option value={200}>200 (High)</option>
                                    <option value={300}>300 (Print)</option>
                                </select>
                            </div>

                            <div className="input-row">
                                <label>Background</label>
                                <div className="color-input-row">
                                    <input
                                        type="color"
                                        value={figure.background || "#ffffff"}
                                        onChange={(e) =>
                                            onFigureChange({ ...figure, background: e.target.value })
                                        }
                                    />
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={figure.transparent || false}
                                            onChange={(e) =>
                                                onFigureChange({ ...figure, transparent: e.target.checked })
                                            }
                                        />
                                        Transparent
                                    </label>
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Font</label>
                                <select
                                    value={font.family || "sans-serif"}
                                    onChange={(e) =>
                                        onFontChange({ ...font, family: e.target.value as FontFamily })
                                    }
                                >
                                    <option value="sans-serif">Sans-serif</option>
                                    <option value="serif">Serif</option>
                                    <option value="monospace">Monospace</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Title & Labels */}
                <div className="customizer-section">
                    {renderSectionHeader("title", "Title & Labels", "🏷️")}
                    {sections.title && (
                        <div className="section-content">
                            <div className="input-row">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={title.text || ""}
                                    onChange={(e) =>
                                        onTitleChange({ ...title, text: e.target.value })
                                    }
                                    placeholder="Chart Title"
                                />
                            </div>

                            <div className="input-row compact">
                                <div className="mini-input">
                                    <label>Size</label>
                                    <input
                                        type="number"
                                        value={title.font_size || 14}
                                        onChange={(e) =>
                                            onTitleChange({ ...title, font_size: Number(e.target.value) })
                                        }
                                        min={8}
                                        max={32}
                                    />
                                </div>
                                <div className="mini-input">
                                    <label>Weight</label>
                                    <select
                                        value={title.font_weight || "bold"}
                                        onChange={(e) =>
                                            onTitleChange({
                                                ...title,
                                                font_weight: e.target.value as FontWeight,
                                            })
                                        }
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="bold">Bold</option>
                                    </select>
                                </div>
                                <div className="mini-input">
                                    <label>Color</label>
                                    <input
                                        type="color"
                                        value={title.color || "#000000"}
                                        onChange={(e) =>
                                            onTitleChange({ ...title, color: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>X Label</label>
                                <div className="label-row">
                                    <input
                                        type="text"
                                        value={xLabel.text || ""}
                                        onChange={(e) =>
                                            onXLabelChange({ ...xLabel, text: e.target.value })
                                        }
                                        placeholder="X Axis"
                                    />
                                    <input
                                        type="number"
                                        value={xLabel.font_size || 11}
                                        onChange={(e) =>
                                            onXLabelChange({ ...xLabel, font_size: Number(e.target.value) })
                                        }
                                        min={8}
                                        max={24}
                                        className="small"
                                    />
                                </div>
                            </div>

                            <div className="input-row">
                                <label>Y Label</label>
                                <div className="label-row">
                                    <input
                                        type="text"
                                        value={yLabel.text || ""}
                                        onChange={(e) =>
                                            onYLabelChange({ ...yLabel, text: e.target.value })
                                        }
                                        placeholder="Y Axis"
                                    />
                                    <input
                                        type="number"
                                        value={yLabel.font_size || 11}
                                        onChange={(e) =>
                                            onYLabelChange({ ...yLabel, font_size: Number(e.target.value) })
                                        }
                                        min={8}
                                        max={24}
                                        className="small"
                                    />
                                </div>
                            </div>

                            <div className="input-row compact">
                                <div className="mini-input">
                                    <label>Tick Size</label>
                                    <input
                                        type="number"
                                        value={ticks.font_size || 10}
                                        onChange={(e) =>
                                            onTicksChange({ ...ticks, font_size: Number(e.target.value) })
                                        }
                                        min={6}
                                        max={20}
                                    />
                                </div>
                                <div className="mini-input">
                                    <label>Rotation</label>
                                    <input
                                        type="number"
                                        value={ticks.rotation || 0}
                                        onChange={(e) =>
                                            onTicksChange({ ...ticks, rotation: Number(e.target.value) })
                                        }
                                        min={-90}
                                        max={90}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grid Settings */}
                <div className="customizer-section">
                    {renderSectionHeader("grid", "Grid", "⊞")}
                    {sections.grid && (
                        <div className="section-content">
                            <div className="input-row">
                                <label className="checkbox-label full">
                                    <input
                                        type="checkbox"
                                        checked={grid.show || false}
                                        onChange={(e) =>
                                            onGridChange({ ...grid, show: e.target.checked })
                                        }
                                    />
                                    Show Grid
                                </label>
                            </div>

                            {grid.show && (
                                <>
                                    <div className="input-row compact">
                                        <div className="mini-input">
                                            <label>Style</label>
                                            <select
                                                value={grid.style || "dashed"}
                                                onChange={(e) =>
                                                    onGridChange({ ...grid, style: e.target.value as LineStyle })
                                                }
                                            >
                                                <option value="solid">Solid</option>
                                                <option value="dashed">Dashed</option>
                                                <option value="dotted">Dotted</option>
                                            </select>
                                        </div>
                                        <div className="mini-input">
                                            <label>Color</label>
                                            <input
                                                type="color"
                                                value={grid.color || "#cccccc"}
                                                onChange={(e) =>
                                                    onGridChange({ ...grid, color: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="input-row compact">
                                        <div className="mini-input">
                                            <label>Opacity</label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                value={(grid.alpha || 0.7) * 100}
                                                onChange={(e) =>
                                                    onGridChange({ ...grid, alpha: Number(e.target.value) / 100 })
                                                }
                                            />
                                        </div>
                                        <div className="mini-input">
                                            <label>Axis</label>
                                            <select
                                                value={grid.axis || "both"}
                                                onChange={(e) =>
                                                    onGridChange({ ...grid, axis: e.target.value as GridAxis })
                                                }
                                            >
                                                <option value="both">Both</option>
                                                <option value="x">X Only</option>
                                                <option value="y">Y Only</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Legend Settings */}
                <div className="customizer-section">
                    {renderSectionHeader("legend", "Legend", "☰")}
                    {sections.legend && (
                        <div className="section-content">
                            <div className="input-row">
                                <label className="checkbox-label full">
                                    <input
                                        type="checkbox"
                                        checked={legend.show !== false}
                                        onChange={(e) =>
                                            onLegendChange({ ...legend, show: e.target.checked })
                                        }
                                    />
                                    Show Legend
                                </label>
                            </div>

                            {legend.show !== false && (
                                <>
                                    <div className="input-row">
                                        <label>Position</label>
                                        <select
                                            value={legend.position || "best"}
                                            onChange={(e) =>
                                                onLegendChange({
                                                    ...legend,
                                                    position: e.target.value as LegendPosition,
                                                })
                                            }
                                        >
                                            <option value="best">Auto (Best)</option>
                                            <option value="upper right">Upper Right</option>
                                            <option value="upper left">Upper Left</option>
                                            <option value="lower right">Lower Right</option>
                                            <option value="lower left">Lower Left</option>
                                            <option value="center">Center</option>
                                        </select>
                                    </div>

                                    <div className="input-row compact">
                                        <div className="mini-input">
                                            <label>Font Size</label>
                                            <input
                                                type="number"
                                                value={legend.font_size || 10}
                                                onChange={(e) =>
                                                    onLegendChange({
                                                        ...legend,
                                                        font_size: Number(e.target.value),
                                                    })
                                                }
                                                min={6}
                                                max={20}
                                            />
                                        </div>
                                        <div className="mini-input">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={legend.frame !== false}
                                                    onChange={(e) =>
                                                        onLegendChange({ ...legend, frame: e.target.checked })
                                                    }
                                                />
                                                Frame
                                            </label>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Colors & Style */}
                <div className="customizer-section">
                    {renderSectionHeader("style", "Colors & Style", "🎨")}
                    {sections.style && (
                        <div className="section-content">
                            <div className="input-row">
                                <label>Palette</label>
                                <select
                                    value={style.palette || "viridis"}
                                    onChange={(e) =>
                                        onStyleChange({ ...style, palette: e.target.value })
                                    }
                                >
                                    {COLOR_PALETTES.map((p) => (
                                        <option key={p.value} value={p.value}>
                                            {p.label} - {p.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-row">
                                <label>Primary Color</label>
                                <input
                                    type="color"
                                    value={style.color || "#416afd"}
                                    onChange={(e) =>
                                        onStyleChange({ ...style, color: e.target.value })
                                    }
                                />
                            </div>

                            <div className="input-row">
                                <label>Opacity</label>
                                <div className="slider-row">
                                    <input
                                        type="range"
                                        min={10}
                                        max={100}
                                        value={(style.alpha || 1) * 100}
                                        onChange={(e) =>
                                            onStyleChange({ ...style, alpha: Number(e.target.value) / 100 })
                                        }
                                    />
                                    <span>{Math.round((style.alpha || 1) * 100)}%</span>
                                </div>
                            </div>

                            {/* Plot-specific options */}
                            {(plotType === "line" || plotType === "scatter") && (
                                <div className="input-row">
                                    <label>Line Width</label>
                                    <input
                                        type="number"
                                        value={style.linewidth || 2}
                                        onChange={(e) =>
                                            onStyleChange({ ...style, linewidth: Number(e.target.value) })
                                        }
                                        min={0.5}
                                        max={10}
                                        step={0.5}
                                    />
                                </div>
                            )}

                            {plotType === "scatter" && (
                                <div className="input-row">
                                    <label>Marker Size</label>
                                    <input
                                        type="number"
                                        value={style.marker_size || 50}
                                        onChange={(e) =>
                                            onStyleChange({ ...style, marker_size: Number(e.target.value) })
                                        }
                                        min={10}
                                        max={500}
                                    />
                                </div>
                            )}

                            {plotType === "bar" && (
                                <div className="input-row">
                                    <label>Bar Width</label>
                                    <div className="slider-row">
                                        <input
                                            type="range"
                                            min={30}
                                            max={100}
                                            value={(style.bar_width || 0.8) * 100}
                                            onChange={(e) =>
                                                onStyleChange({
                                                    ...style,
                                                    bar_width: Number(e.target.value) / 100,
                                                })
                                            }
                                        />
                                        <span>{Math.round((style.bar_width || 0.8) * 100)}%</span>
                                    </div>
                                </div>
                            )}

                            <div className="input-row">
                                <label>Edge Color</label>
                                <input
                                    type="color"
                                    value={style.edgecolor || "#000000"}
                                    onChange={(e) =>
                                        onStyleChange({ ...style, edgecolor: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Axis Spines */}
                <div className="customizer-section">
                    {renderSectionHeader("spines", "Axis Borders", "▢")}
                    {sections.spines && (
                        <div className="section-content">
                            <div className="spine-grid">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={spines.top !== false}
                                        onChange={(e) =>
                                            onSpinesChange({ ...spines, top: e.target.checked })
                                        }
                                    />
                                    Top
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={spines.right !== false}
                                        onChange={(e) =>
                                            onSpinesChange({ ...spines, right: e.target.checked })
                                        }
                                    />
                                    Right
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={spines.bottom !== false}
                                        onChange={(e) =>
                                            onSpinesChange({ ...spines, bottom: e.target.checked })
                                        }
                                    />
                                    Bottom
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={spines.left !== false}
                                        onChange={(e) =>
                                            onSpinesChange({ ...spines, left: e.target.checked })
                                        }
                                    />
                                    Left
                                </label>
                            </div>

                            <div className="input-row">
                                <label>Color</label>
                                <input
                                    type="color"
                                    value={spines.color || "#000000"}
                                    onChange={(e) =>
                                        onSpinesChange({ ...spines, color: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartCustomizer;
