import React from "react";
import { createRoot } from "react-dom/client";
import { DocumentSandboxApi } from "../models/DocumentSandboxApi";
import App from "./components/App";

import "./styles.css";
import "katex/dist/katex.min.css"; // KaTeX CSS for proper math rendering

import addOnUISdk, { RuntimeType } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready
  .then(async () => {
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
  })
  .catch(error => {
    console.error("SDK ready failed:", error);
    document.body.innerHTML = `<div style="padding: 20px; color: red;">
        <h3>SDK failed to initialize</h3>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>`;
  });
