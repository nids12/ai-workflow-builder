import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Load Gemini model
model = genai.GenerativeModel("gemini-pro")

# Function to send query to Gemini
def get_gemini_response(prompt, context=None):
    final_prompt = prompt
    if context:
        final_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"

    response = model.generate_content(final_prompt)
    return response.text.strip()
