// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useState, useEffect, useRef, useCallback } from "react";
import katex from "katex";
import "./GraphApp.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import {
  renderPlotPng,
  checkHealth,
  SAMPLE_DATA,
  SAMPLE_CSV,
  PlotType,
  PlotRequest,
  DataConfig,
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
} from "../../services/plotService";
import {
  parseFile,
  parseCSVText,
  ParseResult,
  ColumnInfo,
  formatFileSize,
  getPreviewRows,
} from "../../services/dataParser";
import {
  renderEquationPng,
  DEFAULT_EXAMPLES,
  isPlottableEquation,
  EquationPlotRequest,
} from "../../services/equationPlotService";
import ChartCustomizer from "./ChartCustomizer";

interface AppProps {
  addOnUISdk: AddOnSDKAPI;
  prefillEquation?: string;
  initialMode?: "data" | "equation";
  onEquationUsed?: () => void;
}

type StatusType = "idle" | "loading" | "success" | "error";

interface StatusState {
  type: StatusType;
  message: string;
}

type TabType = "quick" | "custom" | "equation";
type InputMode = "paste" | "upload";

const PLOT_TYPES: { type: PlotType; label: string; icon: string }[] = [
  { type: "line", label: "Line Chart", icon: "📈" },
  { type: "scatter", label: "Scatter Plot", icon: "⚬" },
  { type: "bar", label: "Bar Chart", icon: "📊" },
  { type: "histogram", label: "Histogram", icon: "📶" },
  { type: "boxplot", label: "Box Plot", icon: "📦" },
  { type: "heatmap", label: "Heatmap", icon: "🔥" },
];

const GraphApp: React.FC<AppProps> = ({
  addOnUISdk,
  prefillEquation,
  initialMode,
  onEquationUsed
}) => {
  const [status, setStatus] = useState<StatusState>({
    type: "idle",
    message: "",
  });
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(
    initialMode === "equation" ? "equation" : "quick"
  );
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Input Mode for custom data
  const [inputMode, setInputMode] = useState<InputMode>("paste");

  // Custom Data State
  const [customCsv, setCustomCsv] = useState<string>("");
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null);
  const [selectedPlotType, setSelectedPlotType] = useState<PlotType>("bar");
  const [title, setTitle] = useState<string>("My Custom Chart");

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mappings
  const [mapX, setMapX] = useState<string>("");
  const [mapY, setMapY] = useState<string>("");
  const [mapHue, setMapHue] = useState<string>("");

  // Preview state
  const [showAllPreview, setShowAllPreview] = useState<boolean>(false);

  // Equation plotting state
  const [equationLatex, setEquationLatex] = useState<string>(prefillEquation || "x^2");
  const [equationPreview, setEquationPreview] = useState<string>("");
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [equationColor, setEquationColor] = useState<string>("#416afd");
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Customization panel state
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [figureConfig, setFigureConfig] = useState<FigureConfig>(DEFAULT_CUSTOMIZATION.figure);
  const [fontConfig, setFontConfig] = useState<FontConfig>(DEFAULT_CUSTOMIZATION.font);
  const [titleConfig, setTitleConfig] = useState<TitleConfig>(DEFAULT_CUSTOMIZATION.title);
  const [xLabelConfig, setXLabelConfig] = useState<LabelConfig>({ font_size: 11 });
  const [yLabelConfig, setYLabelConfig] = useState<LabelConfig>({ font_size: 11 });
  const [tickConfig, setTickConfig] = useState<TickConfig>({ font_size: 10, rotation: 0 });
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_CUSTOMIZATION.grid);
  const [legendConfig, setLegendConfig] = useState<LegendConfig>(DEFAULT_CUSTOMIZATION.legend);
  const [spineConfig, setSpineConfig] = useState<SpineConfig>(DEFAULT_CUSTOMIZATION.spines);
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(DEFAULT_CUSTOMIZATION.style);

  // Handle prefilled equation
  useEffect(() => {
    if (prefillEquation && prefillEquation.trim()) {
      setEquationLatex(prefillEquation);
      setActiveTab("equation");
      // Notify that we've used the prefill
      if (onEquationUsed) {
        onEquationUsed();
      }
    }
  }, [prefillEquation, onEquationUsed]);

  // Update equation preview
  useEffect(() => {
    try {
      const html = katex.renderToString(equationLatex, {
        throwOnError: false,
        displayMode: false,
      });
      setEquationPreview(html);
    } catch {
      setEquationPreview('<span style="color: #999;">Invalid equation</span>');
    }
  }, [equationLatex]);

  // Check server health on mount
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        await checkHealth();
        setServerOnline(true);
      } catch (e) {
        setServerOnline(false);
        console.error("Health check failed:", e);
      }
    };
    checkServerHealth();

    // Check every 10 seconds
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-parse CSV text when it changes
  useEffect(() => {
    if (inputMode !== "paste" || !customCsv.trim()) {
      if (inputMode === "paste") {
        setParsedResult(null);
      }
      return;
    }

    try {
      const result = parseCSVText(customCsv);
      setParsedResult(result);
      autoSelectColumns(result);
    } catch (e) {
      console.log("CSV parsing error:", e);
      setParsedResult(null);
    }
  }, [customCsv, inputMode]);

  // Auto-select columns when data is parsed
  const autoSelectColumns = useCallback((result: ParseResult) => {
    if (result.data.columns.length > 0) {
      setMapX(result.data.columns[0]);
      if (result.data.columns.length > 1) {
        setMapY(result.data.columns[1]);
      }
      setMapHue("");
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setStatus({ type: "loading", message: "Parsing file..." });

    try {
      const result = await parseFile(file);
      setParsedResult(result);
      autoSelectColumns(result);
      setStatus({ type: "success", message: `Loaded ${result.rowCount} rows` });
      setTimeout(() => setStatus({ type: "idle", message: "" }), 2000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus({ type: "error", message: msg });
      setUploadedFile(null);
      setParsedResult(null);
    }
  };

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Clear all data
  const handleClearData = () => {
    setCustomCsv("");
    setUploadedFile(null);
    setParsedResult(null);
    setMapX("");
    setMapY("");
    setMapHue("");
    setShowAllPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addToCanvas = async (blob: Blob, title: string) => {
    const { document } = addOnUISdk.app;
    setDebugInfo((prev) => prev + " | Adding to canvas...");
    await document.addImage(blob, { title: title });
    console.log("addImage succeeded!");
  };

  /**
   * Generate a plot and add it to the Express canvas
   */
  const handleAddPlot = async (plotType: PlotType) => {
    setStatus({ type: "loading", message: `Generating ${plotType} chart...` });
    setDebugInfo("");

    try {
      const sampleData = SAMPLE_DATA[plotType];
      console.log("Rendering plot:", plotType);

      setDebugInfo("Fetching PNG from server...");
      const pngBlob = await renderPlotPng(sampleData);
      console.log("Got PNG blob:", pngBlob.size, "bytes, type:", pngBlob.type);
      setDebugInfo(`PNG received: ${pngBlob.size} bytes`);

      await addToCanvas(pngBlob, `${plotType} chart`);

      setStatus({ type: "success", message: `${plotType} chart added!` });
      setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
    } catch (error) {
      console.error("Failed to add plot:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setStatus({ type: "error", message: errorMessage });
      setDebugInfo(`Error: ${errorMessage}`);
    }
  };

  /**
   * Handle Custom CSV Plot Generation
   */
  const handleGenerateCustom = async () => {
    if (!parsedResult) {
      setStatus({
        type: "error",
        message: "Please enter valid data first",
      });
      return;
    }

    if (!mapX) {
      setStatus({ type: "error", message: "Please select an X column" });
      return;
    }

    if (!mapY && selectedPlotType !== "histogram") {
      setStatus({ type: "error", message: "Please select a Y column" });
      return;
    }

    setStatus({ type: "loading", message: "Generating custom chart..." });
    setDebugInfo("");

    const request: PlotRequest = {
      plot: {
        type: selectedPlotType,
        library: "seaborn",
      },
      data: parsedResult.data,
      mapping: {
        x: mapX,
        y: mapY || undefined,
        hue: mapHue || undefined,
      },
      axes: {
        title_config: { ...titleConfig, text: title || "Custom Chart" },
        x_label_config: { ...xLabelConfig, text: mapX },
        y_label_config: { ...yLabelConfig, text: mapY },
        tick_config: tickConfig,
        grid: gridConfig,
        legend: legendConfig,
        spines: spineConfig,
      },
      style: styleConfig,
      figure: figureConfig,
      font: fontConfig,
    };

    try {
      setDebugInfo("Sending custom request...");
      const pngBlob = await renderPlotPng(request);
      console.log("Got PNG blob:", pngBlob.size, "bytes");

      await addToCanvas(pngBlob, title || "Custom Chart");

      setStatus({ type: "success", message: "Custom chart added!" });
      setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
    } catch (error) {
      console.error("Failed to render custom plot:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setStatus({ type: "error", message: errorMessage });
      setDebugInfo(`Error: ${errorMessage}`);
    }
  };

  /**
   * Handle Equation Graph Generation
   */
  const handleGenerateEquation = async () => {
    if (!equationLatex.trim()) {
      setStatus({ type: "error", message: "Please enter an equation" });
      return;
    }

    setStatus({ type: "loading", message: "Generating equation graph..." });
    setDebugInfo("");

    try {
      const request: EquationPlotRequest = {
        latex: equationLatex,
        x_min: xMin,
        x_max: xMax,
        color: equationColor,
        grid: showGrid,
      };

      setDebugInfo("Sending equation to server...");
      const pngBlob = await renderEquationPng(request);
      console.log("Got equation PNG:", pngBlob.size, "bytes");

      await addToCanvas(pngBlob, `Graph: ${equationLatex}`);

      setStatus({ type: "success", message: "Equation graph added!" });
      setTimeout(() => setStatus({ type: "idle", message: "" }), 3000);
    } catch (error) {
      console.error("Failed to render equation:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setStatus({ type: "error", message: errorMessage });
      setDebugInfo(`Error: ${errorMessage}`);
    }
  };

  const loadSampleData = () => {
    setInputMode("paste");
    setCustomCsv(SAMPLE_CSV);
    setUploadedFile(null);
  };

  // Get column type badge
  const getTypeBadge = (colName: string): string => {
    const col = parsedResult?.columnInfo.find((c) => c.name === colName);
    if (!col) return "";
    return col.type === "number" ? "123" : "abc";
  };

  // Preview data
  const previewRows = parsedResult
    ? getPreviewRows(parsedResult.data, showAllPreview ? 20 : 5)
    : [];

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h2 className="title">📊 Graph Generator</h2>
          <div
            className={`server-status ${serverOnline === true
              ? "online"
              : serverOnline === false
                ? "offline"
                : "checking"
              }`}
          >
            <span className="status-dot"></span>
            <span className="status-text">
              {serverOnline === null
                ? "..."
                : serverOnline
                  ? "Online"
                  : "Offline"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div
            className={`tab ${activeTab === "quick" ? "active" : ""}`}
            onClick={() => setActiveTab("quick")}
          >
            Quick Charts
          </div>
          <div
            className={`tab ${activeTab === "custom" ? "active" : ""}`}
            onClick={() => setActiveTab("custom")}
          >
            Custom Data
          </div>
          <div
            className={`tab ${activeTab === "equation" ? "active" : ""}`}
            onClick={() => setActiveTab("equation")}
          >
            📐 Equation
          </div>
        </div>

        {/* Status Message */}
        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.type === "loading" && <span className="spinner">⏳</span>}
            {status.type === "success" && <span>✅</span>}
            {status.type === "error" && <span>❌</span>}
            <span>{status.message}</span>
          </div>
        )}

        {/* Quick Charts Tab */}
        {activeTab === "quick" && (
          <div className="section">
            <h3 className="section-title">One-Click Examples</h3>
            <div className="button-grid">
              {PLOT_TYPES.map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant="secondary"
                  onClick={() => {
                    if (status.type === "loading" || serverOnline === false)
                      return;
                    handleAddPlot(type);
                  }}
                >
                  <span className="button-content">
                    <span className="button-icon">{icon}</span>
                    <span className="button-label">{label}</span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Data Tab */}
        {activeTab === "custom" && (
          <div className="section custom-section">
            {/* Chart Type */}
            <div className="form-group">
              <label className="field-label">Chart Type</label>
              <div className="type-selector">
                <select
                  className="native-select"
                  value={selectedPlotType}
                  onChange={(e) =>
                    setSelectedPlotType(e.target.value as PlotType)
                  }
                >
                  {PLOT_TYPES.map((pt) => (
                    <option key={pt.type} value={pt.type}>
                      {pt.icon} {pt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chart Title */}
            <div className="form-group">
              <label className="field-label">Chart Title</label>
              <input
                className="native-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chart title"
              />
            </div>

            {/* Data Input Section */}
            <div className="form-group">
              <div className="label-row">
                <label className="field-label">Data Input</label>
                <div className="input-mode-toggle">
                  <button
                    className={`mode-btn ${inputMode === "paste" ? "active" : ""}`}
                    onClick={() => setInputMode("paste")}
                  >
                    📋 Paste
                  </button>
                  <button
                    className={`mode-btn ${inputMode === "upload" ? "active" : ""}`}
                    onClick={() => setInputMode("upload")}
                  >
                    📁 Upload
                  </button>
                </div>
              </div>

              {/* Paste Mode */}
              {inputMode === "paste" && (
                <div className="paste-section">
                  <div className="paste-header">
                    <Button variant="primary" onClick={loadSampleData}>
                      Load Sample
                    </Button>
                    {customCsv && (
                      <button className="clear-btn" onClick={handleClearData}>
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    className="csv-input"
                    rows={6}
                    value={customCsv}
                    onChange={(e) => setCustomCsv(e.target.value)}
                    placeholder="col1,col2,col3&#10;val1,val2,val3"
                  />
                </div>
              )}

              {/* Upload Mode */}
              {inputMode === "upload" && (
                <div className="upload-section">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInputChange}
                    style={{ display: "none" }}
                  />

                  {/* Drop Zone */}
                  <div
                    className={`drop-zone ${isDragging ? "dragging" : ""} ${uploadedFile ? "has-file" : ""}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !uploadedFile && fileInputRef.current?.click()}
                  >
                    {!uploadedFile ? (
                      <>
                        <span className="drop-icon">📄</span>
                        <span className="drop-text">
                          Drop CSV or XLSX file here
                        </span>
                        <span className="drop-subtext">or click to browse</span>
                      </>
                    ) : (
                      <div className="file-info">
                        <span className="file-icon">📄</span>
                        <div className="file-details">
                          <span className="file-name">{uploadedFile.name}</span>
                          <span className="file-size">
                            {formatFileSize(uploadedFile.size)}
                          </span>
                        </div>
                        <button
                          className="clear-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearData();
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Data Preview */}
            {parsedResult && (
              <div className="data-preview">
                <div className="preview-header">
                  <span className="preview-title">
                    Data Preview ({parsedResult.rowCount} rows)
                  </span>
                  {parsedResult.rowCount > 5 && (
                    <button
                      className="show-more-btn"
                      onClick={() => setShowAllPreview(!showAllPreview)}
                    >
                      {showAllPreview ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>

                {/* Warnings */}
                {parsedResult.parseWarnings.length > 0 && (
                  <div className="parse-warnings">
                    {parsedResult.parseWarnings.map((w, i) => (
                      <div key={i} className="warning-item">
                        ⚠️ {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div className="preview-table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {parsedResult.data.columns.map((col, i) => (
                          <th key={i}>
                            <span className="col-name">{col}</span>
                            <span
                              className={`type-badge ${parsedResult.columnInfo[i]?.type || "string"}`}
                            >
                              {parsedResult.columnInfo[i]?.type === "number"
                                ? "123"
                                : "abc"}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j}>{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!showAllPreview && parsedResult.rowCount > 5 && (
                  <div className="preview-ellipsis">
                    ... and {parsedResult.rowCount - 5} more rows
                  </div>
                )}
              </div>
            )}

            {/* Column Mapping */}
            {parsedResult && parsedResult.data.columns.length > 0 && (
              <div className="mapping-section">
                <h4 className="subsection-title">Map Columns</h4>

                <div className="mapping-grid">
                  <div className="map-item">
                    <label>
                      X Axis <span className="required">*</span>
                    </label>
                    <select
                      className="native-select small"
                      value={mapX}
                      onChange={(e) => setMapX(e.target.value)}
                    >
                      <option value="">(Select)</option>
                      {parsedResult.data.columns.map((c) => (
                        <option key={c} value={c}>
                          {c} [{getTypeBadge(c)}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPlotType !== "histogram" && (
                    <div className="map-item">
                      <label>
                        Y Axis <span className="required">*</span>
                      </label>
                      <select
                        className="native-select small"
                        value={mapY}
                        onChange={(e) => setMapY(e.target.value)}
                      >
                        <option value="">(Select)</option>
                        {parsedResult.data.columns.map((c) => (
                          <option key={c} value={c}>
                            {c} [{getTypeBadge(c)}]
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="map-item">
                    <label>Hue (Color)</label>
                    <select
                      className="native-select small"
                      value={mapHue}
                      onChange={(e) => setMapHue(e.target.value)}
                    >
                      <option value="">(None)</option>
                      {parsedResult.data.columns.map((c) => (
                        <option key={c} value={c}>
                          {c} [{getTypeBadge(c)}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="action-row">
              <Button
                variant="cta"
                onClick={() => {
                  if (status.type === "loading" || !parsedResult) return;
                  handleGenerateCustom();
                }}
              >
                Generate Custom Chart
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCustomizer(true)}
              >
                ⚙️ Customize
              </Button>
            </div>
          </div>
        )}

        {/* Equation Tab */}
        {activeTab === "equation" && (
          <div className="section equation-section">
            <h3 className="section-title">Plot Mathematical Function</h3>
            <p className="section-description">
              Enter a LaTeX equation to visualize as a graph
            </p>

            {/* Equation Input */}
            <div className="form-group">
              <label className="field-label">LaTeX Equation</label>
              <textarea
                className="equation-input"
                value={equationLatex}
                onChange={(e) => setEquationLatex(e.target.value)}
                placeholder="e.g., x^2, \sin(x), e^{-x^2}"
                rows={2}
              />
              <div className="equation-preview">
                <span className="preview-label">Preview: </span>
                <span
                  dangerouslySetInnerHTML={{ __html: equationPreview }}
                  style={{ fontSize: "18px" }}
                />
              </div>
            </div>

            {/* Examples */}
            <div className="form-group">
              <label className="field-label">Quick Examples</label>
              <div className="equation-examples">
                {DEFAULT_EXAMPLES.slice(0, 8).map((ex, i) => (
                  <button
                    key={i}
                    className="example-btn"
                    onClick={() => setEquationLatex(ex.latex)}
                    title={ex.description}
                  >
                    {ex.description}
                  </button>
                ))}
              </div>
            </div>

            {/* X Range */}
            <div className="form-group">
              <label className="field-label">X Range</label>
              <div className="range-inputs">
                <div className="range-field">
                  <label>Min</label>
                  <input
                    type="number"
                    className="native-input small"
                    value={xMin}
                    onChange={(e) => setXMin(Number(e.target.value))}
                  />
                </div>
                <span className="range-separator">to</span>
                <div className="range-field">
                  <label>Max</label>
                  <input
                    type="number"
                    className="native-input small"
                    value={xMax}
                    onChange={(e) => setXMax(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="form-group">
              <div className="option-row">
                <label className="option-label">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  <span>Show Grid</span>
                </label>
                <div className="color-picker">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={equationColor}
                    onChange={(e) => setEquationColor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="action-row">
              <Button
                variant="cta"
                onClick={() => {
                  if (status.type === "loading") return;
                  handleGenerateEquation();
                }}
              >
                📈 Generate Equation Graph
              </Button>
            </div>
          </div>
        )}

        {/* Debug Info */}
        {debugInfo && (
          <div className="debug-info">
            <code>{debugInfo}</code>
          </div>
        )}

        {/* Chart Customizer Panel */}
        {showCustomizer && (
          <ChartCustomizer
            plotType={selectedPlotType}
            figure={figureConfig}
            font={fontConfig}
            title={titleConfig}
            xLabel={xLabelConfig}
            yLabel={yLabelConfig}
            ticks={tickConfig}
            grid={gridConfig}
            legend={legendConfig}
            spines={spineConfig}
            style={styleConfig}
            onFigureChange={setFigureConfig}
            onFontChange={setFontConfig}
            onTitleChange={setTitleConfig}
            onXLabelChange={setXLabelConfig}
            onYLabelChange={setYLabelConfig}
            onTicksChange={setTickConfig}
            onGridChange={setGridConfig}
            onLegendChange={setLegendConfig}
            onSpinesChange={setSpineConfig}
            onStyleChange={setStyleConfig}
            onClose={() => setShowCustomizer(false)}
          />
        )}
      </div>
    </Theme>
  );
};

export default GraphApp;
