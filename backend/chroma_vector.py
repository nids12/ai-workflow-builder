# chroma_vector.py
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

client = chromadb.Client()
embedding_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

def store_in_chroma(texts):
    collection = client.get_or_create_collection(name="kb", embedding_function=embedding_fn)
    for idx, chunk in enumerate(texts):
        collection.add(documents=[chunk], ids=[f"doc_{idx}"])
