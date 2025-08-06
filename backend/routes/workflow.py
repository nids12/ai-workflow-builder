from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]

class Edge(BaseModel):
    id: str = None
    source: str
    target: str
    type: str = None
    data: Dict[str, Any] = None

class WorkflowRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]


from utils.llm_utils import get_gemini_response
import os
from routes.knowledge_base import UPLOAD_DIR
from utils.pdf_utils import extract_text_from_pdf

@router.post("/run-workflow")
async def run_workflow(workflow: WorkflowRequest):
    # 1. Find User Query node
    user_query_node = next((n for n in workflow.nodes if n.data.get("label") == "User Query"), None)
    query = user_query_node.data.get("prompt") if user_query_node else None
    if not query:
        return JSONResponse({"status": "error", "message": "User Query node missing prompt.", "result": ""})

    # 2. Find KnowledgeBase node and get filename
    kb_node = next((n for n in workflow.nodes if n.data.get("label") == "KnowledgeBase"), None)
    filename = kb_node.data.get("filename") if kb_node and kb_node.data.get("filename") else None
    # Fallback: use most recent PDF in uploads if filename missing
    if not filename:
        try:
            files = [f for f in os.listdir(UPLOAD_DIR) if f.lower().endswith('.pdf')]
            if files:
                # Sort by modified time, newest first
                files.sort(key=lambda f: os.path.getmtime(os.path.join(UPLOAD_DIR, f)), reverse=True)
                filename = files[0]
        except Exception as e:
            return JSONResponse({"status": "error", "message": f"Could not find PDF: {e}", "result": ""})
    if not filename:
        return JSONResponse({"status": "error", "message": "KnowledgeBase node missing filename and no PDF found.", "result": ""})

    # 3. Get PDF text
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        return JSONResponse({"status": "error", "message": f"PDF file not found: {filename}", "result": ""})
    try:
        pdf_text = extract_text_from_pdf(file_path)
    except Exception as e:
        return JSONResponse({"status": "error", "message": f"Failed to extract PDF text: {e}", "result": ""})

    # 4. Call Gemini
    try:
        response = get_gemini_response(query, pdf_text)
    except Exception as e:
        return JSONResponse({"status": "error", "message": f"Gemini API error: {e}", "result": ""})

    # 5. Return result
    return JSONResponse({
        "status": "success",
        "message": "Workflow executed.",
        "workflow": workflow.dict(),
        "result": response
    })
