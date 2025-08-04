# pdf_utils.py
from PyPDF2 import PdfReader

def process_pdf(file_bytes):
    reader = PdfReader(file_bytes)
    texts = [page.extract_text() for page in reader.pages if page.extract_text()]
    return texts
