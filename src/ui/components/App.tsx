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
import { ParserPanel } from "./ParserPanel";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const App = ({
  addOnUISdk,
  sandboxProxy,
}: {
  addOnUISdk: AddOnSDKAPI;
  sandboxProxy: DocumentSandboxApi;
}) => {
  const [mathInputLatex, setMathInputLatex] = React.useState("E = mc^{2}");

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
            Create math equations, code blocks, and data visualizations as
            native vector graphics
          </p>
        </div>

        {/* Math Engine - Wrapped in error boundary */}
        <div>
          <ParserPanel
            addOnUISdk={addOnUISdk}
            onShowInMathEngine={setMathInputLatex}
          />
        </div>

        <div>
          <MathInput
            addOnUISdk={addOnUISdk}
            latex={mathInputLatex}
            onLatexChange={setMathInputLatex}
          />
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
