"""
AI Router

Handles requests to generates chart configurations from natural language prompts
using Google's Gemini API.
"""

import os
import json
import typing
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/ai", tags=["AI"])

# Configure Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    print("WARNING: No GOOGLE_API_KEY found. AI features will fail.")

class GenerateChartRequest(BaseModel):
    prompt: str = Field(..., description="Natural language description of the chart")
    context: typing.Optional[str] = Field(None, description="Optional context or data snippet")

class GenerateChartResponse(BaseModel):
    success: bool
    config: typing.Optional[typing.Dict[str, typing.Any]] = None
    error: typing.Optional[str] = None
    thought_process: typing.Optional[str] = None

SYSTEM_PROMPT = """You are a Data Science Assistant for Adobe Express. 
Your goal is to convert natural language descriptions of charts into a specific JSON format used by our plotting engine.

### OUTPUT FORMAT
You must return only valid JSON that complies with this structure:

```json
{
  "plot": {
    "type": "bar" | "line" | "scatter" | "histogram" | "boxplot" | "heatmap",
    "library": "seaborn"
  },
  "data": {
    "columns": ["col1", "col2", ...],
    "rows": [
      ["val1", "val2", ...],
      ["val1", "val2", ...]
    ]
  },
  "mapping": {
    "x": "col1",
    "y": "col2",
    "hue": "optional_col",
    "size": "optional_col"
  },
  "axes": {
    "title": "Chart Title",
    "x_label": "X Label",
    "y_label": "Y Label"
  }
}
```

### RULES
1. **Hallucinate Data**: If the user asks for a chart (e.g., "sales in 2024") but provides no data, you MUST generate realistic mock data (at least 5-10 rows).
2. **Infer Plot Type**: If not specified, choose the best visualization (Time -> Line, Categories -> Bar, Correlation -> Scatter).
3. **Valid JSON**: Output ONLY JSON. No markdown fencing, no explanation text outside the JSON.
4. **Context**: Use provided context if available to inform the data structure.
5. **Mapping**: Ensure the 'mapping' fields (x, y) match exactly one of the 'columns'.

### EXAMPLE
User: "Show me a pie chart of developer languages"
Response: 
{
  "plot": { "type": "bar", "library": "seaborn" }, 
  "data": { 
    "columns": ["Language", "Users"], 
    "rows": [["Python", 50], ["JavaScript", 45], ["Java", 30], ["C++", 20], ["Go", 15]] 
  },
  "mapping": { "x": "Language", "y": "Users" },
  "axes": { "title": "Top Developer Languages 2024" }
}
(Note: we mapped pie to bar because our engine favors bars)
"""

@router.post("/generate-chart", response_model=GenerateChartResponse)
async def generate_chart(request: GenerateChartRequest):
    """
    Generate a chart configuration from a text prompt.
    """
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Server missing API Key")

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        user_content = f"Request: {request.prompt}\n"
        if request.context:
            user_content += f"Context Data: {request.context}"

        # Combine system prompt + user prompt
        # Note: Gemini python lib often treats system instructions as start of chat or specific config
        # For simplicity here, we prepend it.
        full_prompt = f"{SYSTEM_PROMPT}\n\nUSER INPUT:\n{user_content}"
        
        response = model.generate_content(full_prompt)
        text_response = response.text
        
        # Clean up code fences if Gemini adds them
        clean_text = text_response.replace("```json", "").replace("```", "").strip()
        
        # Parse JSON
        try:
            config = json.loads(clean_text)
            
            # Basic validation
            if "data" not in config or "columns" not in config["data"]:
                raise ValueError("Missing data/columns")
                
            return GenerateChartResponse(success=True, config=config)
            
        except json.JSONDecodeError:
            print(f"Failed to parse AI response: {clean_text}")
            return GenerateChartResponse(
                success=False, 
                error="AI returned invalid JSON. Please try again.",
                thought_process=clean_text
            )

    except Exception as e:
        print(f"AI Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
