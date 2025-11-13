import os
import sys
import dspy
from dotenv import load_dotenv

load_dotenv()

provider = os.getenv("LLM_PROVIDER", "openai")
model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
api_key = os.getenv("OPENAI_API_KEY")

# Validate API key configuration
if not api_key or api_key == "your_openai_api_key_here":
    error_msg = """
    ❌ ERROR: OpenAI API key is not configured!

    To fix this:
    1. Get your API key from: https://platform.openai.com/api-keys
    2. Open file: dspy_service/.env
    3. Replace 'your_openai_api_key_here' with your actual API key
    4. Restart the DSPy service

    Example: OPENAI_API_KEY=sk-proj-abc123...
    """
    print(error_msg, file=sys.stderr)
    # Allow service to start but log error clearly
    print("⚠️  WARNING: AI features will not work without a valid API key!")
else:
    # Mask API key in logs for security
    masked_key = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "***"
    print(f"✅ [DSPy Init] API key detected: {masked_key}")

# Configure DSPy with error handling
try:
    dspy.configure(
        lm=dspy.LM(
            provider=provider,
            model=model,
            api_key=api_key
        )
    )
    print(f"✅ [DSPy Init] Configured LLM provider={provider}, model={model}")
except Exception as e:
    print(f"❌ [DSPy Init] Configuration failed: {e}", file=sys.stderr)
    print("⚠️  Service will start but AI features may not work correctly")
    # Don't crash the service, allow it to start
