/**
 * Plot Service
 *
 * Client-side service for communicating with the Python plotting server.
 * Sends plot specifications and receives PNG output.
 */

// Server URL - update this for production
const PLOT_SERVER_URL = "http://localhost:8000";

// Type definitions
export type PlotType =
  | "line"
  | "scatter"
  | "bar"
  | "histogram"
  | "boxplot"
  | "heatmap";
export type PlotLibrary = "matplotlib" | "seaborn";

export interface PlotConfig {
  type: PlotType;
  library: PlotLibrary;
}

export interface DataConfig {
  columns: string[];
  rows: (string | number)[][];
}

export interface MappingConfig {
  x: string;
  y?: string;
  hue?: string;
  size?: string;
}

export interface StyleConfig {
  color?: string;
  palette?: string;
  alpha?: number;
  linewidth?: number;
}

export interface AxesConfig {
  title?: string;
  x_label?: string;
  y_label?: string;
  x_scale?: "linear" | "log";
  y_scale?: "linear" | "log";
  grid?: boolean;
}

export interface PlotRequest {
  plot: PlotConfig;
  data: DataConfig;
  mapping: MappingConfig;
  style?: StyleConfig;
  axes?: AxesConfig;
}

export interface PlotResponse {
  svg: string; // Actually base64 PNG now
  width: number;
  height: number;
}

export interface HealthResponse {
  status: string;
  version: string;
  backend: string;
}

/**
 * Check if the plot server is healthy
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${PLOT_SERVER_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get list of supported plot types
 */
export async function getPlotTypes(): Promise<string[]> {
  const response = await fetch(`${PLOT_SERVER_URL}/plot-types`);
  if (!response.ok) {
    throw new Error(`Failed to get plot types: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Render a plot and return base64 PNG
 */
export async function renderPlot(request: PlotRequest): Promise<PlotResponse> {
  const response = await fetch(`${PLOT_SERVER_URL}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to render plot: ${error.detail || error.message}`);
  }

  return response.json();
}

/**
 * Render a plot and get raw PNG blob
 */
export async function renderPlotPng(request: PlotRequest): Promise<Blob> {
  const response = await fetch(`${PLOT_SERVER_URL}/render-png`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to render plot: ${error.detail || error.message}`);
  }

  return response.blob();
}

/**
 * Convert base64 string to Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Simple CSV Parser
 * Parses CSV string into DataConfig structure { columns, rows }
 */
export function parseCSV(csvText: string): DataConfig {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row.");
  }

  // Helper to split by comma while respecting quotes (simple implementation)
  // For a robust implementation, a library like PapaParse is recommended
  const splitLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map((val) => val.replace(/^"|"$/g, "")); // Remove surrounding quotes
  };

  const columns = splitLine(lines[0]);
  const rows: (string | number)[][] = [];

  // Heuristic to detect if a column is numeric
  // We check the first 5 rows (or fewer) to guess data types
  const numericColumns = new Set<number>();
  const checkLimit = Math.min(lines.length - 1, 5);

  // Initialize numeric assumption
  for (let c = 0; c < columns.length; c++) {
    numericColumns.add(c);
  }

  // Check first few rows
  for (let i = 1; i <= checkLimit; i++) {
    const row = splitLine(lines[i]);
    if (row.length !== columns.length) continue;

    for (let c = 0; c < columns.length; c++) {
      if (!numericColumns.has(c)) continue;
      const val = row[c];
      if (val === "" || isNaN(Number(val))) {
        numericColumns.delete(c);
      }
    }
  }

  // Parse all rows using the heuristic
  for (let i = 1; i < lines.length; i++) {
    const rowStr = splitLine(lines[i]);
    if (rowStr.length !== columns.length) {
      // Skip malformed rows or handle error
      continue;
    }

    const parsedRow: (string | number)[] = rowStr.map((val, index) => {
      if (numericColumns.has(index) && val !== "") {
        return Number(val);
      }
      return val;
    });

    rows.push(parsedRow);
  }

  return { columns, rows };
}

// ============================================================================
// Sample Data Generators - for testing convenience
// ============================================================================

export const SAMPLE_CSV = `month,sales,region,profit
Jan,100,North,50
Feb,120,North,60
Mar,140,North,70
Jan,80,South,40
Feb,90,South,45
Mar,110,South,55`;

export const SAMPLE_DATA = {
  line: {
    plot: { type: "line" as PlotType, library: "matplotlib" as PlotLibrary },
    data: {
      columns: ["month", "sales"],
      rows: [
        ["Jan", 120],
        ["Feb", 150],
        ["Mar", 180],
        ["Apr", 170],
        ["May", 200],
        ["Jun", 230],
      ],
    },
    mapping: { x: "month", y: "sales" },
    axes: { title: "Monthly Sales", x_label: "Month", y_label: "Sales ($)" },
  },

  scatter: {
    plot: { type: "scatter" as PlotType, library: "seaborn" as PlotLibrary },
    data: {
      columns: ["x", "y", "category"],
      rows: [
        [1, 2.5, "A"],
        [2, 3.8, "A"],
        [3, 4.2, "A"],
        [4, 5.1, "A"],
        [1.5, 3.0, "B"],
        [2.5, 4.2, "B"],
        [3.5, 5.5, "B"],
        [4.5, 6.2, "B"],
      ],
    },
    mapping: { x: "x", y: "y", hue: "category" },
    style: { palette: "Set2" },
    axes: {
      title: "Scatter Plot with Categories",
      x_label: "X Value",
      y_label: "Y Value",
    },
  },

  bar: {
    plot: { type: "bar" as PlotType, library: "seaborn" as PlotLibrary },
    data: {
      columns: ["product", "sales", "region"],
      rows: [
        ["Widget A", 100, "North"],
        ["Widget A", 120, "South"],
        ["Widget B", 80, "North"],
        ["Widget B", 90, "South"],
        ["Widget C", 150, "North"],
        ["Widget C", 140, "South"],
      ],
    },
    mapping: { x: "product", y: "sales", hue: "region" },
    style: { palette: "viridis" },
    axes: {
      title: "Product Sales by Region",
      x_label: "Product",
      y_label: "Sales",
    },
  },

  histogram: {
    plot: { type: "histogram" as PlotType, library: "seaborn" as PlotLibrary },
    data: {
      columns: ["values"],
      rows: Array.from({ length: 100 }, () => [Math.random() * 100]),
    },
    mapping: { x: "values" },
    style: { palette: "muted" },
    axes: {
      title: "Value Distribution",
      x_label: "Value",
      y_label: "Frequency",
    },
  },

  boxplot: {
    plot: { type: "boxplot" as PlotType, library: "seaborn" as PlotLibrary },
    data: {
      columns: ["group", "value"],
      rows: [
        ...Array.from({ length: 20 }, () => [
          "Group A",
          50 + Math.random() * 30,
        ]),
        ...Array.from({ length: 20 }, () => [
          "Group B",
          40 + Math.random() * 40,
        ]),
        ...Array.from({ length: 20 }, () => [
          "Group C",
          60 + Math.random() * 25,
        ]),
      ],
    },
    mapping: { x: "group", y: "value" },
    style: { palette: "pastel" },
    axes: {
      title: "Value Distribution by Group",
      x_label: "Group",
      y_label: "Value",
    },
  },

  heatmap: {
    plot: { type: "heatmap" as PlotType, library: "seaborn" as PlotLibrary },
    data: {
      columns: ["row", "col", "value"],
      rows: [
        ["Mon", "Morning", 5],
        ["Mon", "Afternoon", 8],
        ["Mon", "Evening", 3],
        ["Tue", "Morning", 7],
        ["Tue", "Afternoon", 9],
        ["Tue", "Evening", 4],
        ["Wed", "Morning", 6],
        ["Wed", "Afternoon", 7],
        ["Wed", "Evening", 5],
        ["Thu", "Morning", 8],
        ["Thu", "Afternoon", 6],
        ["Thu", "Evening", 6],
        ["Fri", "Morning", 9],
        ["Fri", "Afternoon", 5],
        ["Fri", "Evening", 8],
      ],
    },
    mapping: { x: "col", y: "row", hue: "value" },
    style: { palette: "YlOrRd" },
    axes: { title: "Activity Heatmap", x_label: "Time of Day", y_label: "Day" },
  },
};
