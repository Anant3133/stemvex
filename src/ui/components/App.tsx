// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Theme } from "@swc-react/theme";
import React, { useEffect, useState, useCallback } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { MathInput } from "./MathInput";
import { MathDigitizer } from "./MathDigitizer";
import GraphApp from "./GraphApp";
import { Token } from "../../engines/parser/LatexParser";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

type TabType = "builder" | "digitizer" | "graphs";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
  const [activeTab, setActiveTab] = useState<TabType>("builder");

  // Cross-engine navigation state
  const [graphEquation, setGraphEquation] = useState<string>("");
  const [graphMode, setGraphMode] = useState<"data" | "equation">("data");

  // Persisted state for MathDigitizer
  const [digitizerInputText, setDigitizerInputText] = useState("");
  const [digitizerTokens, setDigitizerTokens] = useState<Token[]>([]);
  const [digitizerImage, setDigitizerImage] = useState<string | null>(null);

  useEffect(() => {
    console.log("App mounted successfully");
    console.log("addOnUISdk:", addOnUISdk);
    console.log("sandboxProxy:", sandboxProxy);
  }, []);

  // Handler for navigating to graph engine with an equation
  const handleNavigateToGraph = useCallback((latex: string) => {
    console.log("Navigating to Graph with equation:", latex);
    setGraphEquation(latex);
    setGraphMode("equation");
    setActiveTab("graphs");
  }, []);

  // Clear prefilled equation when manually switching tabs
  const handleTabChange = useCallback((tab: TabType) => {
    if (tab !== "graphs") {
      // Don't clear equation when switching away - user might come back
    }
    setActiveTab(tab);
  }, []);

  return (
    // Please note that the below "<Theme>" component does not react to theme changes in Express.
    // You may use "addOnUISdk.app.ui.theme" to get the current theme and react accordingly.
    <Theme system="express" scale="medium" color="light">
      <div className="m-6 flex flex-col gap-4">
        <div>
          <div className="font-bold text-xl mb-2">Stemvex</div>
          <p className="text-sm text-gray-600 mb-0">Technical Storytelling Suite</p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            marginBottom: "8px"
          }}
        >
          <button
            onClick={() => handleTabChange("builder")}
            style={{
              flex: 1,
              padding: "8px",
              background: activeTab === "builder" ? "#f1f5f9" : "transparent",
              border: "none",
              borderBottom: activeTab === "builder" ? "2px solid #416afd" : "none",
              fontWeight: 600,
              color: activeTab === "builder" ? "#416afd" : "#64748b",
              cursor: "pointer"
            }}
          >
            Equation
          </button>
          <button
            onClick={() => handleTabChange("digitizer")}
            style={{
              flex: 1,
              padding: "8px",
              background: activeTab === "digitizer" ? "#f1f5f9" : "transparent",
              border: "none",
              borderBottom: activeTab === "digitizer" ? "2px solid #416afd" : "none",
              fontWeight: 600,
              color: activeTab === "digitizer" ? "#416afd" : "#64748b",
              cursor: "pointer"
            }}
          >
            Digitizer
          </button>
          <button
            onClick={() => handleTabChange("graphs")}
            style={{
              flex: 1,
              padding: "8px",
              background: activeTab === "graphs" ? "#f1f5f9" : "transparent",
              border: "none",
              borderBottom: activeTab === "graphs" ? "2px solid #416afd" : "none",
              fontWeight: 600,
              color: activeTab === "graphs" ? "#416afd" : "#64748b",
              cursor: "pointer"
            }}
          >
            Graphs
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === "builder" ? (
            <MathInput addOnUISdk={addOnUISdk} onNavigateToGraph={handleNavigateToGraph} />
          ) : activeTab === "digitizer" ? (
            <MathDigitizer
              addOnUISdk={addOnUISdk}
              savedInputText={digitizerInputText}
              setSavedInputText={setDigitizerInputText}
              savedTokens={digitizerTokens}
              setSavedTokens={setDigitizerTokens}
              savedImage={digitizerImage}
              setSavedImage={setDigitizerImage}
            />
          ) : (
            <GraphApp
              addOnUISdk={addOnUISdk}
              prefillEquation={graphEquation}
              initialMode={graphMode}
              onEquationUsed={() => {
                // Clear prefill after it's been used
                setGraphEquation("");
                setGraphMode("data");
              }}
            />
          )}
        </div>
      </div>
    </Theme>
  );
};

export default App;
