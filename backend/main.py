
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from utils.llm_utils import get_gemini_response
from routes.workflow import router as workflow_router

app = FastAPI()

app.include_router(workflow_router)

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can replace * with your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body format
class LLMRequest(BaseModel):
    prompt: str
    context: str = None

# Test route
@app.get("/")
def root():
    return {"message": "Backend running..."}

# Actual Gemini API route
@app.post("/ask-gemini")
def ask_gemini(request: LLMRequest):
    try:
        response = get_gemini_response(request.prompt, request.context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
