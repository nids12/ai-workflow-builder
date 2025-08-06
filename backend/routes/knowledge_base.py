
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.embedding_utils import get_embedding_from_text
from utils.pdf_utils import extract_text_from_pdf
from chroma_vector import store_in_chroma
from database import SessionLocal
from models import Document

# Define router at the top so it's available for all route decorators
router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Endpoint to get PDF text by filename
@router.get("/document-text/{filename}")
def get_document_text(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    try:
        text = extract_text_from_pdf(file_path)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Move route definitions after router and get_db are defined
@router.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).all()
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "upload_time": doc.upload_time.isoformat() if doc.upload_time else None,
            "description": doc.description
        }
        for doc in docs
    ]

from fastapi import HTTPException

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save failed: {e}")

    try:
        extracted_text = extract_text_from_pdf(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF text extraction failed: {e}")

    try:
        embedding = get_embedding_from_text(extracted_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")

    # Store embedding in ChromaDB
    if embedding:
        try:
            store_in_chroma([extracted_text])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ChromaDB storage failed: {e}")

    # Save document metadata in PostgreSQL
    try:
        doc = Document(filename=file.filename)
        db.add(doc)
        db.commit()
        db.refresh(doc)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB save failed: {e}")

    return {
        "message": "PDF uploaded, text extracted, and embedding generated.",
        "embedding_preview": embedding[:5] if embedding else "Failed",
        "document_id": doc.id
    }
