from flask import Flask, request, jsonify
from rag_pipeline.generation import smart_search,generate_summary,product_qa
# product_qa
# import dspy

app = Flask(__name__)

@app.route('/search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        query = data.get('query', '')
        result = smart_search(query)
        return jsonify(result)
    except Exception as e:
        print("[ERROR] /search error:", e)
        return jsonify({"error": str(e)}), 500


# Route 1: AI Product Summary Generation
@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Generate AI product summary using OpenAI (via DSPy).
    Expected body: { "query": "Summarize this product: ..." }
    """
    try:
        data = request.get_json(force=True)
        query = data.get("query", "").strip()

        if not query:
            return jsonify({"error": "Missing query"}), 400

        result = generate_summary(query)
        return jsonify(result), 200

    except Exception as e:
        print("[ERROR] /recommend error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/qa", methods=["POST"])
def qa():
    try:
        data = request.get_json(force=True)
        question = data.get("question", "").strip()
        product = data.get("product", "").strip()
        if not question:
            return jsonify({"error": "Missing question"}), 400

        result = product_qa(question, product)
        return jsonify(result), 200
    except Exception as e:
        print("[ERROR] /qa error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/summarize-reviews", methods=["POST"])
def summarize_reviews():
    """
    Summarize product reviews using AI.
    Expected body: { "productName": "Product Name", "reviews": [{rating, comment}, ...] }
    """
    try:
        data = request.get_json(force=True)
        product_name = data.get("productName", "").strip()
        reviews = data.get("reviews", [])

        if not product_name or not reviews:
            return jsonify({"error": "Missing productName or reviews"}), 400

        # Create a summary prompt from the reviews
        review_texts = []
        for review in reviews[:10]:  # Limit to first 10 reviews for token efficiency
            rating = review.get('rating', 0)
            comment = review.get('comment', '')
            review_texts.append(f"{rating}/5 stars: {comment}")

        reviews_str = "\n".join(review_texts)
        prompt = f"Summarize these customer reviews for {product_name} in 2-3 sentences, highlighting key pros and cons:\n\n{reviews_str}"

        # Use the existing generate_summary function
        result = generate_summary(prompt)

        return jsonify({
            "summary": result.get("results", "Unable to generate summary"),
            "reviewCount": len(reviews)
        }), 200

    except Exception as e:
        print("[ERROR] /summarize-reviews error:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/')
def health_check():
    return jsonify({"status": "DSPy AI service running"}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
