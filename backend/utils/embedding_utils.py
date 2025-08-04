import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)

def get_embedding_from_text(text):
    model = genai.GenerativeModel("embedding-001")  # Use correct embedding model
    try:
        response = model.embed_content(
            content=text,
            task_type="retrieval_document"
        )
        return response["embedding"]
    except Exception as e:
        print("Embedding generation failed:", e)
        return None
