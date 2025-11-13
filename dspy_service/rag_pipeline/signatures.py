import dspy

# ---- Summaries / Descriptions ----
class ProductSummarySignature(dspy.Signature):
    """
    Summarize the key highlights of a product in 2–3 sentences.
    Mention what it is, main features, and ideal users in an engaging tone.
    """
    product_info: str = dspy.InputField(desc="Product name + description/specs.")
    summary: str = dspy.OutputField(desc="Concise e-commerce summary.")

# ---- Search (semantic / hybrid) ----
class SmartSearchSignature(dspy.Signature):
    """
    Return a short natural-language list of relevant products for a query.
    """
    query: str = dspy.InputField(desc="User search text")
    results: str = dspy.OutputField(desc="Human-readable relevant items")

# ---- Product Q&A ----
class ProductQASignature(dspy.Signature):
    """
    Answer a user question using the given product details.
    Prefer grounded, concise answers (1–3 sentences).
    """
    question: str = dspy.InputField(desc="User question")
    product_info: str = dspy.InputField(desc="Product name + content/specs")
    answer: str = dspy.OutputField(desc="Concise factual answer")

# ---- Recommendations ----
class RecommendationSignature(dspy.Signature):
    """
    Recommend 3–5 products for the user with reasons.
    Format as bullet points: Name — short reason.
    """
    user_context: str = dspy.InputField(desc="Preferences, price range, recent views, categories")
    candidates: str = dspy.InputField(desc="Top retrieved items to consider")
    recommendations: str = dspy.OutputField(desc="Ranked list with reasoning")

# ---- Comparison ----
class ComparisonSignature(dspy.Signature):
    """
    Produce a concise comparison between two products:
    pros/cons, who should buy which, and a final verdict.
    """
    product_a: str = dspy.InputField()
    product_b: str = dspy.InputField()
    comparison: str = dspy.OutputField()

# ---- Shopping Guide ----
class ShoppingGuideSignature(dspy.Signature):
    """
    Create a short shopping guide tailored to user interests and budget.
    Include what to look for and 3–5 suggested picks (by category).
    """
    user_context: str = dspy.InputField()
    guide: str = dspy.OutputField()
