const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Mock OCR endpoint
app.post("/parse", (req, res) => {
  const { imageBase64, mimeType, multipleEquations } = req.body;

  // Check authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Missing or invalid API key" });
  }

  const apiKey = authHeader.replace("Bearer ", "");
  if (apiKey !== "mock-api-key-for-development") {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }

  // Validate request
  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: "Missing imageBase64 or mimeType" });
  }

  // Create a hash of the image to ensure consistent results
  const imageHash = imageBase64.substring(0, 100);
  const hashCode = imageHash.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  console.log(
    `[Mock OCR] Received image: ${mimeType}, hash: ${Math.abs(
      hashCode
    )}, multipleEquations: ${multipleEquations}`
  );

  // Return consistent mock equations based on image hash
  const mockEquations = [
    { latex: "E = mc^2", confidence: 0.95 },
    { latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", confidence: 0.92 },
    { latex: "a^2 + b^2 = c^2", confidence: 0.98 },
  ];

  // Use hash to determine number of equations (consistent for same image)
  const numEquations = multipleEquations ? (Math.abs(hashCode) % 3) + 1 : 1;
  const selectedEquations = mockEquations.slice(0, numEquations);

  res.json({ equations: selectedEquations });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Mock OCR server is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock OCR server running at http://localhost:${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/parse`);
  console.log(`   API Key: mock-api-key-for-development`);
});
