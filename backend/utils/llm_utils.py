

# --- Gemini (Google AI Studio) ---
import google.generativeai as genai
# --- OpenAI ---
import openai
import os
from dotenv import load_dotenv

load_dotenv()

def get_gemini_model(api_key=None):
    if api_key:
        genai.configure(api_key=api_key)
    else:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    models = genai.list_models()
    for m in models:
        if "generateContent" in m.supported_generation_methods:
            if m.name.endswith("gemini-1.5-pro-latest"):
                return genai.GenerativeModel(m.name)
    for m in models:
        if "generateContent" in m.supported_generation_methods:
            return genai.GenerativeModel(m.name)
    raise RuntimeError("No supported Gemini model found.")

def get_openai_response(prompt, context=None, api_key=None, model="gpt-4o"):
    openai.api_key = api_key or os.getenv("OPENAI_API_KEY")
    final_prompt = prompt
    if context:
        final_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"
    try:
        response = openai.ChatCompletion.create(
            model=model,
            messages=[{"role": "user", "content": final_prompt}],
            temperature=0.75
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"OpenAI API error: {e}"

def get_llm_response(prompt, context=None, llm_type="gemini", api_key=None, model=None):
    import concurrent.futures
    if llm_type == "openai":
        chosen_model = model or "gpt-4o"
        def call_openai():
            return get_openai_response(prompt, context, api_key, chosen_model)
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(call_openai)
                response = future.result(timeout=30)
            return response
        except concurrent.futures.TimeoutError:
            return "OpenAI API error: Timeout. The model did not respond in 30 seconds."
    else:
        gemini_model = get_gemini_model(api_key)
        final_prompt = prompt
        if context:
            final_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}"
        def call_gemini():
            return gemini_model.generate_content(final_prompt)
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(call_gemini)
                response = future.result(timeout=30)
            return response.text.strip()
        except concurrent.futures.TimeoutError:
            return "Gemini API error: Timeout. The model did not respond in 30 seconds."
        except Exception as e:
            return f"Gemini API error: {e}"
