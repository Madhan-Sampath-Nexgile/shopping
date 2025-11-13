import os
import json
import numpy as np
import faiss
from litellm import embedding
import dspy
from dotenv import load_dotenv
import re
load_dotenv()

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "products.json")
INDEX_PATH = os.path.join(os.path.dirname(__file__), "data", "faiss.index")
MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# === Load product data and FAISS index ===
with open(DATA_PATH, "r", encoding="utf-8") as f:
    PRODUCTS = json.load(f)
INDEX = faiss.read_index(INDEX_PATH)


def retrieve_context(query, top_k=3):
    """Retrieve top-K product descriptions using FAISS"""
    response = embedding(model=MODEL, input=query)
    query_vec = np.array(response["data"][0]["embedding"], dtype=np.float32)
    D, I = INDEX.search(np.array([query_vec]), top_k)
    results = [PRODUCTS[i] for i in I[0]]
    return results


# DSPy 3.x syntax for signature
smart_search_signature = dspy.Signature("query -> answer")


class SmartSearchRAG(dspy.Predict):
    def __init__(self):
        super().__init__(signature=smart_search_signature)

    def forward(self, query: str) -> str:
        context_items = retrieve_context(query)
        context_text = "\n".join(
            [f"{p['name']} ({p['category']}): {p.get('content', '')}" for p in context_items]
        )

        prompt = (
            f"You are a helpful AI shopping assistant.\n"
            f"Based on these products:\n\n{context_text}\n\n"
            f"User query: {query}\n\n"
            f"Answer clearly and concisely using only the above information."
        )

        # Pass to LLM through DSPy
        response = dspy.Predict("prompt -> answer")(prompt=prompt)
        return response


rag_pipeline = SmartSearchRAG()

def smart_search(query):
    response = rag_pipeline(query=query)
    text_result = getattr(response, "answer", str(response))

    # Normalize line endings
    text_result = text_result.replace("\r\n", "\n").strip()

    results = []

    # Pattern handles lines like:
    # 1. Product Name (Category): Description
    pattern = re.compile(r"\d+\.\s*\*\*(.*?)\s*\((.*?)\)\s*:\s*(.*)", re.IGNORECASE)
    alt_pattern = re.compile(r"\d+\.\s*(.*?)\s*\((.*?)\)\s*:\s*(.*)", re.IGNORECASE)

    for line in text_result.split("\n"):
        match = pattern.search(line) or alt_pattern.search(line)
        if match:
            name, category, desc = match.groups()
            results.append({
                "name": name.strip(),
                "category": category.strip(),
                "summary": desc.strip()
            })

    # Fallback if regex didn't match — keep raw text
    if not results:
        results = [{"name": "General Result", "category": "-", "summary": text_result}]

    return {
        "query": query,
        "results": results
    }


class ProductSummarySignature(dspy.Signature):
    """
    Generate a short, engaging summary for an e-commerce product.
    Include its highlights, main features, and ideal users in 2–3 sentences.
    """
    product_info: str = dspy.InputField(desc="Product name, description, and features.")
    summary: str = dspy.OutputField(desc="A natural, concise e-commerce summary.")


product_summarizer = dspy.Predict(ProductSummarySignature)


def generate_summary(query: str):
    """Generate an AI summary for a given product."""
    try:
        print(f"🧠 Generating summary for: {query[:60]}...")
        result = product_summarizer(product_info=query)

        if hasattr(result, "summary") and result.summary:
            return {"results": result.summary.strip()}
        elif hasattr(result, "output_text") and result.output_text:
            return {"results": result.output_text.strip()}
        else:
            return {"results": "AI summary not available yet."}
    except Exception as e:
        print("[ERROR] generate_summary error:", e)
        return {"results": f"AI generation failed: {str(e)}"}


class ProductQASignature(dspy.Signature):
    question: str = dspy.InputField(desc="User question about product")
    product_info: str = dspy.InputField(desc="Product details, description, and specs")
    answer: str = dspy.OutputField(desc="Concise helpful answer")

qa_model = dspy.Predict(ProductQASignature)

def product_qa(question: str, product_name: str):
    try:
        data_path = os.path.join(os.path.dirname(__file__), "./data/products.json")
        with open(data_path, "r", encoding="utf-8") as f:
            products = json.load(f)

        product = next((p for p in products if product_name.lower() in p["name"].lower()), None)
        if not product:
            return {"answer": "Product not found in database."}

        result = qa_model(question=question, product_info=product["content"])
        return {"answer": result.answer or "No answer found."}
    except Exception as e:
        print("[ERROR] product_qa error:", e)
        return {"answer": f"Q&A failed: {str(e)}"}