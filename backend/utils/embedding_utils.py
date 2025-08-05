
from sentence_transformers import SentenceTransformer

# Load the sentence-transformer model once (you can change the model name if needed)
_st_model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding_from_text(text):
    try:
        embedding = _st_model.encode(text)
        return embedding.tolist() if hasattr(embedding, 'tolist') else embedding
    except Exception as e:
        print("Embedding generation failed:", e)
        return None
