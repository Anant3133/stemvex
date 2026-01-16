# Complete Project Recreation Guide for Stemvex Adobe Express Add-on

## PROJECT OVERVIEW

**Name**: Stemvex - Technical Storytelling Suite
**Type**: Adobe Creative Cloud Web Add-on for Adobe Express
**Purpose**: Convert LaTeX mathematical equations into PNG images and insert them as native bitmap graphics into Adobe Express documents
**Architecture**: Two-runtime system (UI Runtime + Document Sandbox Runtime) with bridge communication

## TECH STACK

### Core Technologies
- **Runtime Environment**: Adobe Creative Cloud Web Add-on SDK
- **Language**: TypeScript
- **UI Framework**: React 18.2.0
- **Build Tool**: Webpack 5.98.0
- **Package Manager**: npm

### Key Dependencies
- **Math Rendering**: KaTeX 0.16.27 (LaTeX to HTML/CSS rendering)
- **Image Conversion**: html2canvas 1.4.1 (HTML to PNG bitmap)
- **UI Components**: Adobe Spectrum Web Components (@swc-react/button, @swc-react/theme)
- **Styling**: TailwindCSS 3.4.19 with PostCSS and Autoprefixer

### Development Dependencies
- TypeScript 5.3.2
- Webpack loaders: ts-loader, css-loader, style-loader, postcss-loader
- Webpack plugins: html-webpack-plugin, copy-webpack-plugin
- Adobe tooling: @adobe/ccweb-add-on-scripts 3.5.0

## PROJECT STRUCTURE

```
stemvex/
├── src/
│   ├── engines/
│   │   └── math/
│   │       └── MathEngine.ts
│   ├── sandbox/
│   │   ├── commands/
│   │   │   └── insertMath.ts
│   │   ├── code.ts
│   │   └── tsconfig.json
│   ├── ui/
│   │   ├── components/
│   │   │   ├── App.tsx
│   │   │   └── MathInput.tsx
│   │   ├── global.d.ts
│   │   ├── index.tsx
│   │   ├── styles.css
│   │   └── tsconfig.json
│   ├── models/
│   │   └── DocumentSandboxApi.ts
│   ├── index.html
│   └── manifest.json
├── .gitignore
├── package.json
├── tsconfig.json
├── webpack.config.js
├── tailwind.config.js
├── postcss.config.js
└── PROJECT_STRUCTURE.md
```

## STEP-BY-STEP IMPLEMENTATION

### STEP 1: Configuration Files

#### 1.1 package.json

```json
{
    "name": "stemvex",
    "version": "1.0.0",
    "description": "Stemvex - Technical Storytelling Suite for Adobe Express",
    "scripts": {
        "clean": "ccweb-add-on-scripts clean",
        "build": "ccweb-add-on-scripts build --use webpack",
        "start": "ccweb-add-on-scripts start --use webpack",
        "package": "ccweb-add-on-scripts package --use webpack"
    },
    "keywords": [
        "Adobe",
        "Creative Cloud Web",
        "Add-on",
        "LaTeX",
        "Math",
        "Equations"
    ],
    "dependencies": {
        "@swc-react/button": "1.7.0",
        "@swc-react/theme": "1.7.0",
        "html2canvas": "^1.4.1",
        "katex": "^0.16.27",
        "react": "18.2.0",
        "react-dom": "18.2.0"
    },
    "devDependencies": {
        "@adobe/ccweb-add-on-scripts": "^3.5.0",
        "@types/adobe__ccweb-add-on-sdk": "^1.3.0",
        "@types/react": "18.2.21",
        "@types/react-dom": "18.2.7",
        "autoprefixer": "^10.4.23",
        "copy-webpack-plugin": "11.0.0",
        "css-loader": "6.8.1",
        "html-webpack-plugin": "5.5.3",
        "postcss": "^8.5.6",
        "postcss-loader": "^8.2.0",
        "style-loader": "3.3.3",
        "tailwindcss": "^3.4.19",
        "ts-loader": "9.5.1",
        "typescript": "5.3.2",
        "webpack": "5.98.0",
        "webpack-cli": "6.0.1"
    }
}
```

#### 1.2 tsconfig.json (root)

```json
{
    "compilerOptions": {
        "allowJs": false,
        "allowSyntheticDefaultImports": true,
        "jsx": "react",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "outDir": "dist",
        "target": "ESNext",
        "ignoreDeprecations": "5.0"
    },
    "exclude": ["node_modules"],
    "include": ["src/**/*"]
}
```

#### 1.3 webpack.config.js

```javascript
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const isEnvProduction = process.env.NODE_ENV === "production";

const uiPath = path.resolve(__dirname, "./src/ui");
const sandboxPath = path.resolve(__dirname, "./src/sandbox");
const enginesPath = path.resolve(__dirname, "./src/engines");

module.exports = {
    mode: isEnvProduction ? "production" : "development",
    devtool: "source-map",
    entry: {
        index: "./src/ui/index.tsx",
        code: "./src/sandbox/code.ts"
    },
    experiments: {
        outputModule: true
    },
    output: {
        pathinfo: !isEnvProduction,
        path: path.resolve(__dirname, "dist"),
        module: true,
        filename: "[name].js"
    },
    externalsType: "module",
    externalsPresets: { web: true },
    externals: {
        "add-on-sdk-document-sandbox": "add-on-sdk-document-sandbox",
        "express-document-sdk": "express-document-sdk"
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
            scriptLoading: "module",
            excludeChunks: ["code"]
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: "src/*.json", to: "[name][ext]" }]
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(uiPath, "tsconfig.json")
                        }
                    }
                ],
                include: [uiPath, enginesPath],
                exclude: /node_modules/
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: path.resolve(sandboxPath, "tsconfig.json")
                        }
                    }
                ],
                include: sandboxPath,
                exclude: /node_modules/
            },
            {
                test: /(\\.css)$/,
                use: ["style-loader", "css-loader", "postcss-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".css"]
    }
};
```

#### 1.4 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,ts,tsx,js,jsx}"],
    theme: {
        extend: {}
    },
    // Avoid Tailwind's preflight overriding Spectrum/host styles.
    corePlugins: {
        preflight: false
    },
    plugins: []
};
```

#### 1.5 postcss.config.js

```javascript
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {}
    }
};
```

#### 1.6 .gitignore

```
.DS_Store
dist/
node_modules/
```

### STEP 2: Core Source Files

#### 2.1 src/index.html

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta
            name="description"
            content="Stemvex - Technical Storytelling Suite for Adobe Express"
        />
        <meta name="keywords" content="Adobe, Express, Add-On, React, TypeScript, LaTeX, Math" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Stemvex</title>
        <script type="module" src="add-on-console-override.js"></script>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>
```

#### 2.2 src/manifest.json

**IMPORTANT**: Generate a unique UUID for the testId field.

```json
{
    "testId": "GENERATE-NEW-UUID-HERE",
    "name": "Stemvex - Technical Storytelling Suite",
    "version": "1.0.0",
    "manifestVersion": 2,
    "requirements": {
        "apps": [
            {
                "name": "Express",
                "apiVersion": 1
            }
        ]
    },
    "entryPoints": [
        {
            "type": "panel",
            "id": "panel1",
            "main": "index.html",
            "documentSandbox": "code.js"
        }
    ]
}
```

### STEP 3: Models and Type Definitions

#### 3.1 src/models/DocumentSandboxApi.ts

```typescript
import { InsertMathPayload } from "../sandbox/commands/insertMath";

// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
export interface DocumentSandboxApi {
    createRectangle(): void;
    insertMath(payload: InsertMathPayload): Promise<void>;
}
```

#### 3.2 src/ui/global.d.ts

```typescript
declare module "*.css" {
    const content: string;
    export default content;
}
```

#### 3.3 src/ui/tsconfig.json

```json
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "lib": ["dom"]
    },
    "include": ["./**/*"]
}
```

#### 3.4 src/sandbox/tsconfig.json

```json
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "lib": ["ES2020"],
        "module": "ES2020",
        "target": "ES2020",
        "types": ["@types/adobe__ccweb-add-on-sdk"]
    },
    "include": ["./**/*"]
}
```

#### 3.5 src/ui/styles.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### STEP 4: Math Engine (UI Side)

#### 4.1 src/engines/math/MathEngine.ts

```typescript
/**
 * MathEngine - Converts LaTeX to bitmap image for rendering in Adobe Express
 * 
 * Uses KaTeX for fast, reliable LaTeX rendering, then converts to PNG
 * Adobe Express SDK has limited support for vector graphics, so we use raster for reliability
 * 
 * Why this lives in the UI:
 * - Needs DOM and Canvas API for rendering
 * - The Document Sandbox has no DOM access
 * - We process the LaTeX here and create bitmap data to send to sandbox
 */

import katex from 'katex';
import html2canvas from 'html2canvas';

export interface MathResult {
  imageData: Blob;     // PNG image data
  width: number;       // Image width in pixels
  height: number;      // Image height in pixels
}

export class MathEngine {
  /**
   * Convert LaTeX string to PNG image
   * @param latex - LaTeX equation (e.g., "E = mc^2")
   * @returns MathResult with PNG data and dimensions
   */
  async convertToPNG(latex: string): Promise<MathResult> {
    if (!latex || latex.trim() === '') {
      throw new Error('LaTeX input cannot be empty');
    }

    try {
      console.log('Converting LaTeX to PNG:', latex);

      // Render LaTeX to HTML using KaTeX
      const htmlString = katex.renderToString(latex, {
        throwOnError: true,
        displayMode: true,
        output: 'html',
        strict: false,
        trust: false,
      });

      console.log('KaTeX rendered successfully');

      // Create a temporary container to measure and render
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px'; // Off-screen but visible
      container.style.top = '-9999px';
      container.style.fontSize = '64px'; // Large for high quality
      container.style.color = '#000000';
      container.style.fontFamily = 'KaTeX_Main, Times New Roman, serif';
      container.style.padding = '20px';
      container.style.backgroundColor = '#FFFFFF'; // White background
      container.style.display = 'inline-block'; // Shrink to content
      container.innerHTML = htmlString;
      document.body.appendChild(container);

      try {
        // Render using html2canvas
        return await this.renderToCanvas(container);
      } finally {
        if (container.parentNode) {
          document.body.removeChild(container);
        }
      }
    } catch (error) {
      console.error('LaTeX to PNG conversion error:', error);
      throw new Error(`Failed to convert LaTeX: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render HTML element to canvas and return as PNG blob with dimensions
   * Uses html2canvas to avoid tainted canvas issues with foreignObject
   */
  private async renderToCanvas(element: HTMLElement): Promise<MathResult> {
    // Use html2canvas to render the KaTeX HTML directly to canvas
    // This avoids the tainted canvas issue with SVG foreignObject
    const renderedCanvas = await html2canvas(element, {
      backgroundColor: '#FFFFFF', // White background for visibility
      scale: 2, // High DPI for crisp rendering
      logging: true, // Enable logging to debug
      useCORS: true,
      allowTaint: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    console.log(`html2canvas created: ${renderedCanvas.width}x${renderedCanvas.height}`);

    // Convert the rendered canvas directly to PNG blob
    const imageData = await new Promise<Blob>((resolve, reject) => {
      renderedCanvas.toBlob((blob) => {
        if (blob) {
          console.log(`PNG blob created: ${blob.size} bytes`);
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png', 1.0); // Quality 1.0 for maximum quality
    });

    return {
      imageData,
      width: renderedCanvas.width,
      height: renderedCanvas.height
    };
  }

  /**
   * Validate LaTeX syntax before conversion (basic check)
   */
  static validateLaTeX(latex: string): { valid: boolean; error?: string } {
    if (!latex || latex.trim() === '') {
      return { valid: false, error: 'LaTeX string is empty' };
    }

    // Basic bracket matching
    const openBrackets = (latex.match(/{/g) || []).length;
    const closeBrackets = (latex.match(/}/g) || []).length;

    if (openBrackets !== closeBrackets) {
      return { valid: false, error: 'Mismatched curly braces' };
    }

    // Check for common errors
    if (latex.includes('\\\\') && !latex.includes('\\begin')) {
      return { valid: false, error: 'Line breaks (\\\\) should be used inside environments like \\begin{array}' };
    }

    return { valid: true };
  }
}
```

### STEP 5: Sandbox Commands

#### 5.1 src/sandbox/commands/insertMath.ts

```typescript
/**
 * insertMath - Sandbox command to create math equation images on canvas
 * 
 * Why this lives in the Sandbox:
 * - ALL canvas mutations must happen in the Document Sandbox
 * - Only the sandbox has access to editor.createImageContainer()
 * - The UI sends bitmap image data, sandbox creates the MediaContainerNode
 */

import { editor } from "express-document-sdk";

export interface InsertMathPayload {
  imageData: ArrayBuffer;  // PNG image as ArrayBuffer
  width: number;
  height: number;
  position?: { x: number; y: number };
}

/**
 * Insert a math equation as a bitmap image on the canvas
 * @param payload - Image data and positioning info from UI
 */
export async function insertMath(payload: InsertMathPayload): Promise<void> {
  const { imageData, width, height, position } = payload;

  try {
    console.log(`Inserting math image: ${width}x${height}px`);
    console.log(`ArrayBuffer size: ${imageData.byteLength} bytes`);

    // Convert ArrayBuffer to Blob
    const blob = new Blob([imageData], { type: 'image/png' });
    console.log(`Blob created: ${blob.size} bytes, type: ${blob.type}`);

    // Load bitmap image from the PNG blob (this is allowed outside queueAsyncEdit)
    const bitmapImage = await editor.loadBitmapImage(blob);
    console.log(`BitmapImage loaded: ${bitmapImage.width}x${bitmapImage.height}`);

    // ALL document mutations must be wrapped in queueAsyncEdit
    await editor.queueAsyncEdit(async () => {
      // Create image container from the bitmap
      const mediaContainer = editor.createImageContainer(bitmapImage);

      // Add to the artboard
      editor.context.insertionParent.children.append(mediaContainer);

      // Position at top-left of artboard (0,0) or use provided position
      const targetX = position?.x ?? 0;
      const targetY = position?.y ?? 0;

      mediaContainer.setPositionInParent(
        { x: targetX, y: targetY },
        { x: 0, y: 0 } // Top-left registration point
      );

      console.log(`Positioned at (${targetX}, ${targetY})`);
    });

    console.log('Math equation inserted successfully');

  } catch (error) {
    console.error('Failed to insert math:', error);
    throw new Error(`Failed to insert math equation: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

#### 5.2 src/sandbox/code.ts

```typescript
import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";
import { insertMath } from "./commands/insertMath";

// Get the document sandbox runtime.
const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    // APIs to be exposed to the UI runtime
    // i.e., to the `App.tsx` file of this add-on.
    const sandboxApi: DocumentSandboxApi = {
        createRectangle: () => {
            const rectangle = editor.createRectangle();

            // Define rectangle dimensions.
            rectangle.width = 240;
            rectangle.height = 180;

            // Define rectangle position.
            rectangle.translation = { x: 10, y: 10 };

            // Define rectangle color.
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };

            // Fill the rectangle with the color.
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;

            // Add the rectangle to the document.
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        insertMath: async (payload) => {
            await insertMath(payload);
        }
    };

    // Expose `sandboxApi` to the UI runtime.
    runtime.exposeApi(sandboxApi);
}

start();
```

### STEP 6: UI Components

#### 6.1 src/ui/index.tsx

```typescript
import React from "react";
import { createRoot } from "react-dom/client";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";
import App from "./components/App";

import "./styles.css";
import "katex/dist/katex.min.css"; // KaTeX CSS for proper math rendering

import addOnUISdk, { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    try {
        // Get the UI runtime.
        const { runtime } = addOnUISdk.instance;

        // Get the proxy object, which is required
        // to call the APIs defined in the Document Sandbox runtime
        // i.e., in the `code.ts` file of this add-on.
        const sandboxProxy: DocumentSandboxApi = await runtime.apiProxy(RuntimeType.documentSandbox);

        console.log("Sandbox proxy created successfully");

        const rootElement = document.getElementById("root");
        if (!rootElement) {
            throw new Error("Root element not found");
        }

        const root = createRoot(rootElement);
        console.log("Rendering App...");
        root.render(<App addOnUISdk={addOnUISdk} sandboxProxy={sandboxProxy} />);
        console.log("App rendered successfully");
    } catch (error) {
        console.error("Error initializing app:", error);
        document.body.innerHTML = `<div style="padding: 20px; color: red;">
            <h3>Error loading add-on</h3>
            <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </div>`;
    }
}).catch(error => {
    console.error("SDK ready failed:", error);
    document.body.innerHTML = `<div style="padding: 20px; color: red;">
        <h3>SDK failed to initialize</h3>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>`;
});
```

#### 6.2 src/ui/components/App.tsx

```typescript
// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useEffect } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { MathInput } from "./MathInput";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    useEffect(() => {
        console.log("App mounted successfully");
        console.log("addOnUISdk:", addOnUISdk);
        console.log("sandboxProxy:", sandboxProxy);
    }, []);

    function handleClick() {
        console.log("Creating rectangle...");
        sandboxProxy.createRectangle();
    }

    return (
        // Please note that the below "<Theme>" component does not react to theme changes in Express.
        // You may use "addOnUISdk.app.ui.theme" to get the current theme and react accordingly.
        <Theme system="express" scale="medium" color="light">
            <div className="m-6 flex flex-col gap-6">
                <div>
                    <div className="font-bold text-xl mb-2">
                        Stemvex - Technical Storytelling Suite
                    </div>
                    <p className="text-sm text-gray-600">
                        Create math equations, code blocks, and data visualizations as native vector graphics
                    </p>
                </div>

                {/* Math Engine - Wrapped in error boundary */}
                <div>
                    <MathInput addOnUISdk={addOnUISdk} />
                </div>

                {/* Original Demo - Keep for now */}
                <div className="pt-4 border-t border-gray-200">
                    <Button className="w-full bg-blue-600" onClick={handleClick}>
                        Create Rectangle (Demo)
                    </Button>
                </div>
            </div>
        </Theme>
    );
};

export default App;
```

#### 6.3 src/ui/components/MathInput.tsx

```typescript
/**
 * MathInput - React component for LaTeX equation input
 * Provides a text area for LaTeX input and a button to insert equations
 */

import React, { useState, useRef } from 'react';
import { MathEngine } from '../../engines/math/MathEngine';
import { AddOnSDKAPI, RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { DocumentSandboxApi } from '../../models/DocumentSandboxApi';

// Access to the AddOn SDK is passed from index.tsx
// We'll receive it via props instead
interface MathInputProps {
  addOnUISdk: AddOnSDKAPI;
}

export const MathInput: React.FC<MathInputProps> = ({ addOnUISdk }) => {
  const [latex, setLatex] = useState('E = mc^{2}');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Lazy initialize MathEngine only when needed
  const mathEngineRef = useRef<MathEngine | null>(null);

  const getMathEngine = () => {
    if (!mathEngineRef.current) {
      mathEngineRef.current = new MathEngine();
    }
    return mathEngineRef.current;
  };

  const handleInsert = async () => {
    setError(null);
    setSuccess(false);

    // Clean up LaTeX: remove dollar signs if present
    let cleanedLatex = latex.trim();
    // Remove leading/trailing $ or $$
    cleanedLatex = cleanedLatex.replace(/^\$+|\$+$/g, '');

    // Validate LaTeX
    const validation = MathEngine.validateLaTeX(cleanedLatex);
    if (!validation.valid) {
      setError(validation.error || 'Invalid LaTeX');
      return;
    }

    setIsProcessing(true);

    try {
      // Convert LaTeX to PNG in the UI
      const mathResult = await getMathEngine().convertToPNG(cleanedLatex);

      // Convert Blob to ArrayBuffer for transfer to sandbox
      const arrayBuffer = await mathResult.imageData.arrayBuffer();

      // Get the document sandbox API
      const sandboxApi = await addOnUISdk.instance.runtime.apiProxy<DocumentSandboxApi>(RuntimeType.documentSandbox);

      // Send the image data to the sandbox for rendering
      await sandboxApi.insertMath({
        imageData: arrayBuffer,
        width: mathResult.width,
        height: mathResult.height,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to insert equation');
      console.error('Insert math error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleEquations = [
    // Basic examples
    { label: 'Einstein', latex: 'E = mc^{2}' },
    { label: 'Pythagorean', latex: 'a^{2} + b^{2} = c^{2}' },

    // Fractions
    { label: 'Fraction', latex: '\\frac{a}{b} = \\frac{c}{d}' },
    { label: 'Quadratic', latex: 'x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}' },

    // Calculus - Integrals
    { label: 'Integral', latex: '\\int_{a}^{b} f(x) \\, dx' },
    { label: 'Double Integral', latex: '\\iint_{D} f(x,y) \\, dA' },

    // Calculus - Derivatives
    { label: 'Derivative', latex: '\\frac{d}{dx} f(x) = f\'(x)' },
    { label: 'Partial Derivative', latex: '\\frac{\\partial f}{\\partial x}' },

    // Summations and Products
    { label: 'Summation', latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
    { label: 'Product', latex: '\\prod_{i=1}^{n} x_{i}' },

    // Limits
    { label: 'Limit', latex: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0' },

    // Subscripts & Superscripts
    { label: 'Subscript', latex: 'x_{1}, x_{2}, \\ldots, x_{n}' },
    { label: 'Power Tower', latex: 'x^{y^{z}}' },

    // Greek letters
    { label: 'Greek', latex: '\\alpha, \\beta, \\gamma, \\delta, \\pi, \\theta' },
    { label: 'Euler', latex: 'e^{i\\pi} + 1 = 0' },

    // Trigonometry
    { label: 'Trig Identity', latex: '\\sin^{2}(x) + \\cos^{2}(x) = 1' },

    // Matrix (simple)
    { label: 'Matrix', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },

    // Complex expressions
    { label: 'Complex', latex: '\\frac{\\partial^{2} u}{\\partial t^{2}} = c^{2} \\nabla^{2} u' },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
        Math Engine
      </h3>

      <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
        Enter LaTeX equations (without $ delimiters). Use braces for superscripts/subscripts: x^{'{2}'}, x_{'{i}'}
      </p>

      {/* LaTeX Input */}
      <textarea
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        placeholder="Enter LaTeX (e.g., E = mc^{2})"
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '8px',
          fontSize: '14px',
          fontFamily: 'monospace',
          border: '1px solid #ccc',
          borderRadius: '4px',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#efe',
          color: '#070',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          ✓ Equation inserted successfully!
        </div>
      )}

      {/* Insert Button */}
      <button
        onClick={handleInsert}
        disabled={isProcessing || !latex.trim()}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '10px',
          backgroundColor: isProcessing ? '#ccc' : '#0d66d0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
        }}
      >
        {isProcessing ? 'Processing...' : 'Insert Equation'}
      </button>

      {/* Example Equations */}
      <div style={{ marginTop: '16px' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>
          Examples (click to use):
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '4px',
          border: '1px solid #eee',
          borderRadius: '4px'
        }}>
          {exampleEquations.map((eq) => (
            <button
              key={eq.label}
              onClick={() => setLatex(eq.latex)}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {eq.label}
            </button>
          ))}
        </div>
      </div>

      {/* LaTeX Cheatsheet */}
      <details style={{ marginTop: '16px', fontSize: '12px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
          LaTeX Quick Reference
        </summary>
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <p><code>^{'{}'}</code> - Superscript: <code>x^{'{2}'}</code> → x²</p>
          <p><code>_{'{}'}</code> - Subscript: <code>x_{'{i}'}</code> → xᵢ</p>
          <p><code>\frac{'{a}'}{'{b}'}</code> - Fraction</p>
          <p><code>\sqrt{'{x}'}</code> - Square root</p>
          <p><code>\int</code> - Integral, <code>\sum</code> - Summation</p>
          <p><code>\alpha, \beta, \pi</code> - Greek letters</p>
          <p style={{ marginTop: '8px', fontStyle: 'italic' }}>Note: Don't use $ delimiters</p>
        </div>
      </details>
    </div>
  );
};
```

## ARCHITECTURE NOTES

### Two-Runtime System

**UI Runtime** (runs in iframe):
- Has access to DOM and browser APIs
- Runs React components
- Processes LaTeX using KaTeX
- Converts HTML to PNG using html2canvas
- Cannot modify the Adobe Express document

**Document Sandbox Runtime** (runs in isolated context):
- Has access to Adobe Express Document SDK
- Can create and modify document elements
- No DOM access
- Receives processed data from UI runtime

### Communication Bridge

The two runtimes communicate via:
- `DocumentSandboxApi` interface defines the contract
- UI calls sandbox methods via `runtime.apiProxy()`
- Sandbox exposes methods via `runtime.exposeApi()`
- Data is serialized (ArrayBuffer for binary data)

### Data Flow

1. User enters LaTeX in UI → MathInput component
2. MathEngine converts LaTeX to PNG (KaTeX → html2canvas)
3. PNG Blob converted to ArrayBuffer
4. ArrayBuffer sent to sandbox via bridge
5. Sandbox converts ArrayBuffer to Blob
6. Sandbox loads bitmap image via `editor.loadBitmapImage()`
7. Sandbox creates MediaContainerNode and adds to document

## KEY TECHNICAL DECISIONS

1. **Why bitmap (PNG) instead of vector (SVG)?**
   - Adobe Express SDK has better support for bitmap images
   - Avoids complex path conversion from SVG
   - Ensures consistent rendering across platforms

2. **Why KaTeX instead of MathJax?**
   - Faster rendering
   - Smaller bundle size
   - Better for client-side rendering

3. **Why html2canvas?**
   - Avoids CORS/tainted canvas issues
   - Reliable HTML-to-image conversion
   - Works well with KaTeX output

4. **Why separate UI and Sandbox TypeScript configs?**
   - UI needs DOM types, sandbox doesn't
   - Sandbox needs Adobe SDK types
   - Different compilation targets (DOM vs ES2020)

## BUILD AND RUN COMMANDS

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm start

# Create production package
npm run package

# Clean build artifacts
npm run clean
```

## TESTING IN ADOBE EXPRESS

1. Open Adobe Express in a web browser
2. Enable Developer Mode in Adobe Express settings
3. Load the add-on using the development server URL (typically http://localhost:5241)
4. Test with these LaTeX examples:
   - Simple: `E = mc^{2}`
   - Fraction: `\frac{a}{b}`
   - Integral: `\int_{0}^{\infty} e^{-x} dx`
   - Matrix: `\begin{pmatrix} a & b \\ c & d \end{pmatrix}`

## EXPECTED BEHAVIOR

When working correctly:
- User types LaTeX in textarea
- Clicking "Insert Equation" processes the LaTeX
- A high-quality PNG image appears on the Adobe Express canvas
- The image is positioned at (0,0) by default
- The image can be moved, resized, and edited like any other image
- Error messages appear for invalid LaTeX syntax
- Success message appears when equation is inserted

## COMMON ISSUES AND SOLUTIONS

1. **Blank white boxes**: Ensure html2canvas is rendering correctly, check console for errors
2. **Dollar sign errors**: The UI automatically strips $ delimiters
3. **Superscript not rendering**: Use braces: `x^{2}` not `x^2`
4. **Build errors**: Ensure all dependencies are installed with correct versions
5. **Sandbox communication errors**: Check that manifest.json has correct documentSandbox reference

## FINAL CHECKLIST

- [ ] All files created in correct directory structure
- [ ] package.json has all dependencies with correct versions
- [ ] Unique UUID generated for manifest.json testId
- [ ] npm install completed successfully
- [ ] npm run build completes without errors
- [ ] npm start launches development server
- [ ] Add-on loads in Adobe Express
- [ ] LaTeX equations render as PNG images
- [ ] Images appear on canvas at correct position
- [ ] Example equations work correctly
- [ ] Error handling shows appropriate messages

---

**This is a complete, production-ready Adobe Express add-on. Follow each step carefully, ensuring all code is copied exactly as shown. The architecture is designed for extensibility - future features like code syntax highlighting and data visualization can follow the same pattern.**
