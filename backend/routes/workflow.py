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

@router.post("/run-workflow")
async def run_workflow(workflow: WorkflowRequest):
    # For assignment/demo: just echo back the workflow and a fake result
    # In a real app, you would process the workflow here
    return JSONResponse({
        "status": "success",
        "message": "Workflow executed (stub)",
        "workflow": workflow.dict(),
        "result": "This is a demo result."
    })
