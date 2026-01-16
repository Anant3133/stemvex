// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useEffect, useState } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { MathInput } from "./MathInput";
import { MathDigitizer } from "./MathDigitizer";
import GraphApp from "./GraphApp";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const App = ({
    addOnUISdk,
    sandboxProxy,
}: {
    addOnUISdk: AddOnSDKAPI;
    sandboxProxy: DocumentSandboxApi;
}) => {
    const [activeTab, setActiveTab] = useState<'builder' | 'digitizer' | 'graphs'>('builder');

    useEffect(() => {
        console.log("App mounted successfully");
        console.log("addOnUISdk:", addOnUISdk);
        console.log("sandboxProxy:", sandboxProxy);
    }, []);

    return (
        // Please note that the below "<Theme>" component does not react to theme changes in Express.
        // You may use "addOnUISdk.app.ui.theme" to get the current theme and react accordingly.
        <Theme system="express" scale="medium" color="light">
            <div className="m-6 flex flex-col gap-4">
                <div>
                    <div className="font-bold text-xl mb-2">
                        Stemvex
                    </div>
                    <p className="text-sm text-gray-600 mb-0">
                        Technical Storytelling Suite
                    </p>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
                    <button
                        onClick={() => setActiveTab('builder')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            background: activeTab === 'builder' ? '#f1f5f9' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'builder' ? '2px solid #416afd' : 'none',
                            fontWeight: 600,
                            color: activeTab === 'builder' ? '#416afd' : '#64748b',
                            cursor: 'pointer'
                        }}
                    >
                        Equation
                    </button>
                    <button
                        onClick={() => setActiveTab('digitizer')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            background: activeTab === 'digitizer' ? '#f1f5f9' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'digitizer' ? '2px solid #416afd' : 'none',
                            fontWeight: 600,
                            color: activeTab === 'digitizer' ? '#416afd' : '#64748b',
                            cursor: 'pointer'
                        }}
                    >
                        Digitizer
                    </button>
                    <button
                        onClick={() => setActiveTab('graphs')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            background: activeTab === 'graphs' ? '#f1f5f9' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'graphs' ? '2px solid #416afd' : 'none',
                            fontWeight: 600,
                            color: activeTab === 'graphs' ? '#416afd' : '#64748b',
                            cursor: 'pointer'
                        }}
                    >
                        Graphs
                    </button>
                </div>

                {/* Content */}
                <div>
                    {activeTab === 'builder' ? (
                        <MathInput addOnUISdk={addOnUISdk} />
                    ) : activeTab === 'digitizer' ? (
                        <MathDigitizer addOnUISdk={addOnUISdk} />
                    ) : (
                        <GraphApp addOnUISdk={addOnUISdk} />
                    )}
                </div>
            </div>
        </Theme>
    );
};

export default App;
