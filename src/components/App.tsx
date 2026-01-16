// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";
// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useState, useEffect } from "react";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import {
  renderPlotPng,
  checkHealth,
  SAMPLE_DATA,
  SAMPLE_CSV,
  parseCSV,
  PlotType,
  PlotRequest,
  DataConfig,
} from "../services/plotService";

interface AppProps {
  addOnUISdk: AddOnSDKAPI;
}

type StatusType = "idle" | "loading" | "success" | "error";

interface StatusState {
  type: StatusType;
  message: string;
}

type TabType = "quick" | "custom";

const PLOT_TYPES: { type: PlotType; label: string; icon: string }[] = [
  { type: "line", label: "Line Chart", icon: "📈" },
  { type: "scatter", label: "Scatter Plot", icon: "⚬" },
  { type: "bar", label: "Bar Chart", icon: "📊" },
  { type: "histogram", label: "Histogram", icon: "📶" },
  { type: "boxplot", label: "Box Plot", icon: "📦" },
  { type: "heatmap", label: "Heatmap", icon: "🔥" },
];

const App: React.FC<AppProps> = ({ addOnUISdk }) => {
  const [status, setStatus] = useState<StatusState>({
    type: "idle",
    message: "",
  });
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("quick");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Custom Data State
  const [customCsv, setCustomCsv] = useState<string>("");
  const [parsedData, setParsedData] = useState<DataConfig | null>(null);
  const [selectedPlotType, setSelectedPlotType] = useState<PlotType>("bar");
  const [title, setTitle] = useState<string>("My Custom Chart");

  // Mappings
  const [mapX, setMapX] = useState<string>("");
  const [mapY, setMapY] = useState<string>("");
  const [mapHue, setMapHue] = useState<string>("");

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

  // Effect to auto-parse CSV when it changes (debounced could be better but this is fine for small data)
  useEffect(() => {
    if (!customCsv) {
      setParsedData(null);
      return;
    }

    try {
      const data = parseCSV(customCsv);
      setParsedData(data);

      // Auto-select first few columns for convenience
      if (data.columns.length > 0) {
        if (!mapX || !data.columns.includes(mapX)) setMapX(data.columns[0]);
        if (data.columns.length > 1) {
          if (!mapY || !data.columns.includes(mapY)) setMapY(data.columns[1]);
        }
        // Don't auto-set hue, leave it optional
      }
    } catch (e) {
      // Invalid CSV, ignore until fixed
      console.log("CSV parsing error:", e);
    }
  }, [customCsv]);

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
      // Get sample data for this plot type
      const sampleData = SAMPLE_DATA[plotType];
      console.log("Rendering plot:", plotType);

      // Get PNG blob directly from server
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
    if (!parsedData) {
      setStatus({
        type: "error",
        message: "Please enter valid CSV data first",
      });
      return;
    }

    if (!mapX) {
      setStatus({ type: "error", message: "Please select an X column" });
      return;
    }

    // Y is required for most plots, but let's be strict for now
    if (!mapY && selectedPlotType !== "histogram") {
      setStatus({ type: "error", message: "Please select a Y column" });
      return;
    }

    setStatus({ type: "loading", message: "Generating custom chart..." });
    setDebugInfo("");

    const request: PlotRequest = {
      plot: {
        type: selectedPlotType,
        library: "seaborn", // default to seaborn for better aesthetics
      },
      data: parsedData,
      mapping: {
        x: mapX,
        y: mapY || undefined,
        hue: mapHue || undefined,
      },
      axes: {
        title: title || "Custom Chart",
        x_label: mapX,
        y_label: mapY,
      },
      style: {
        palette: "viridis",
      },
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

  const loadSampleData = () => {
    setCustomCsv(SAMPLE_CSV);
  };

  return (
    <Theme system="express" scale="medium" color="light">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h2 className="title">📊 Graph Generator</h2>
          <div
            className={`server-status ${
              serverOnline === true
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

            <div className="form-group">
              <div className="label-row">
                <label className="field-label">CSV Data (Paste here)</label>
                <Button variant="primary" onClick={loadSampleData}>
                  Load Sample
                </Button>
              </div>
              <textarea
                className="csv-input"
                rows={6}
                value={customCsv}
                onChange={(e) => setCustomCsv(e.target.value)}
                placeholder="col1,col2,col3&#10;val1,val2,val3"
              />
              {parsedData && (
                <div className="csv-stats">
                  {parsedData.columns.length} columns, {parsedData.rows.length}{" "}
                  rows detected
                </div>
              )}
            </div>

            {parsedData && parsedData.columns.length > 0 && (
              <div className="mapping-section">
                <h4 className="subsection-title">Map Columns</h4>

                <div className="mapping-grid">
                  <div className="map-item">
                    <label>X Axis</label>
                    <select
                      className="native-select small"
                      value={mapX}
                      onChange={(e) => setMapX(e.target.value)}
                    >
                      {parsedData.columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPlotType !== "histogram" && (
                    <div className="map-item">
                      <label>Y Axis</label>
                      <select
                        className="native-select small"
                        value={mapY}
                        onChange={(e) => setMapY(e.target.value)}
                      >
                        <option value="">(None)</option>
                        {parsedData.columns.map((c) => (
                          <option key={c} value={c}>
                            {c}
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
                      {parsedData.columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
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
                  if (status.type === "loading" || !parsedData) return;
                  handleGenerateCustom();
                }}
              >
                Generate Custom Chart
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
      </div>
    </Theme>
  );
};

export default App;
