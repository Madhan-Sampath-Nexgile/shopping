# AI Features Setup Guide

## Overview
SmartShop AI includes powerful AI features powered by OpenAI:
- 🤖 Product Q&A - Ask questions about any product
- 🔍 Smart Search - Semantic product search using RAG
- ✨ AI Product Summaries - Auto-generated product highlights
- 📊 Review Summarization - AI-powered review analysis
- 🎯 Personalized Recommendations - Smart product suggestions

## Prerequisites
- OpenAI API account with billing enabled
- Valid OpenAI API key

---

## Step 1: Get Your OpenAI API Key

### 1.1 Create OpenAI Account
1. Visit https://platform.openai.com
2. Sign up or log in
3. Complete account verification

### 1.2 Add Billing Information
1. Go to https://platform.openai.com/settings/organization/billing
2. Click "Add payment method"
3. Enter credit card details
4. **Set usage limits** to control costs:
   - Recommended for testing: **$5-10/month**
   - Go to "Usage limits" and set your monthly limit

### 1.3 Generate API Key
1. Visit https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it (e.g., "SmartShop AI")
4. **Copy the key immediately** - you won't see it again!
5. Format: Starts with `sk-proj-` or `sk-`

---

## Step 2: Configure the DSPy Service

### 2.1 Update Environment Variables
1. Open `dspy_service/.env` in a text editor
2. Find the line: `OPENAI_API_KEY=your_openai_api_key_here`
3. Replace `your_openai_api_key_here` with your actual API key

**Example:**
```bash
OPENAI_API_KEY=sk-proj-abc123def456...
```

### 2.2 Verify Configuration
Your `.env` file should look like this:
```bash
# LLM Configuration
OPENAI_API_KEY=sk-proj-your-actual-key-here
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini

# Embedding Model
EMBEDDING_MODEL=text-embedding-3-small

# Database
DB_NAME=postgres
DB_USER=postgres
DB_PASS=123456
DB_HOST=localhost
DB_PORT=5432

# Server
FLASK_ENV=development
PORT=8000
```

---

## Step 3: Start the Services

### 3.1 Install DSPy Dependencies
```bash
cd dspy_service
pip install -r requirements.txt
```

### 3.2 Start DSPy Service
```bash
cd dspy_service
python app.py
```

**Expected Output:**
```
✅ [DSPy Init] API key detected: sk-proj-...xyz
✅ [DSPy Init] Configured LLM provider=openai, model=gpt-4o-mini
 * Running on http://0.0.0.0:8000
```

**If you see errors:**
- ❌ `ERROR: OpenAI API key is not configured!` → Check Step 2
- ❌ `AuthenticationError` → Verify your API key is valid
- ❌ `RateLimitError` → Check your billing/usage limits

### 3.3 Start Other Services
Keep DSPy running, open new terminals:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## Step 4: Test AI Features

### 4.1 Product Q&A
1. Open browser to http://localhost:5173
2. Click on any product to view details
3. Go to "Q&A" tab
4. Type a question: "What are the key features?"
5. Click "Ask AI"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ AI-generated answer appears in green box
- ✅ Question clears after submission

**Error Handling:**
- ⚠️ Yellow box with error message if API key is invalid
- ⚠️ Network error if DSPy service is down

### 4.2 Smart Search
1. Go to http://localhost:5173
2. Find "Smart Search" section on homepage
3. Type a query: "laptop for gaming"
4. Results should appear below

**What to test:**
- ✅ Semantic search (finds related products)
- ✅ Handles typos gracefully
- ✅ Returns relevant results

### 4.3 AI Product Summaries
1. View any product details page
2. Look for purple "AI Product Summary" box
3. Should appear if product has description

**What to check:**
- ✅ Summary is concise (2-3 sentences)
- ✅ Highlights key features
- ✅ Sparkle icon displays

### 4.4 Review Summarization
1. Find a product with **3 or more reviews**
2. Go to "Reviews" tab
3. Look for purple "AI Review Summary" box above reviews

**What to check:**
- ✅ Summary appears automatically
- ✅ Shows "Based on X reviews"
- ✅ Highlights pros and cons
- ✅ Loading spinner while generating

### 4.5 AI Recommendations
1. Go to homepage
2. Scroll to "AI Recommendations" section
3. Should display personalized products

**What to test:**
- ✅ Recommendations appear
- ✅ Products are relevant
- ✅ Can click to view details

---

## Step 5: Troubleshooting

### Common Issues

#### ❌ "AI service is not configured"
**Solution:**
1. Check `dspy_service/.env` has valid API key
2. Restart DSPy service: `python app.py`
3. Check console for error messages

#### ❌ "Unable to connect to AI service"
**Solution:**
1. Verify DSPy service is running on port 8000
2. Check `backend/.env` has `RAG_URL=http://127.0.0.1:8000`
3. Test manually: `curl http://localhost:8000/`

#### ❌ "AuthenticationError: Invalid API key"
**Solution:**
1. Verify API key is correct (no extra spaces)
2. Check API key is active on OpenAI dashboard
3. Ensure billing is enabled

#### ❌ "RateLimitError"
**Solution:**
1. Check usage on https://platform.openai.com/usage
2. Increase usage limits if needed
3. Wait a few minutes and retry

#### ❌ "Network Error" or Timeouts
**Solution:**
1. Check internet connection
2. Verify OpenAI API is accessible
3. Try a different model (e.g., `gpt-3.5-turbo`)

---

## Step 6: Cost Optimization

### Understanding Costs
- **Q&A per query:** ~$0.001-0.01
- **Search (with embeddings):** ~$0.0001
- **Review summarization:** ~$0.002-0.01
- **AI summaries:** ~$0.005-0.02

### Tips to Reduce Costs
1. **Use `gpt-4o-mini`** instead of `gpt-4o` (10x cheaper)
2. **Cache responses** for common questions
3. **Set usage limits** on OpenAI dashboard
4. **Monitor usage** regularly
5. **Use cheaper embeddings** (`text-embedding-3-small`)

### Model Comparison
| Model | Cost (per 1M tokens) | Speed | Quality |
|-------|---------------------|-------|---------|
| gpt-4o | $2.50/$10 | Slow | Best |
| gpt-4o-mini | $0.15/$0.60 | Fast | Good |
| gpt-3.5-turbo | $0.50/$1.50 | Fastest | Adequate |

**Recommendation:** Use `gpt-4o-mini` for most features

---

## Step 7: Production Deployment

### Security Best Practices
1. **Never commit `.env` file to Git**
2. **Use environment variables** in production
3. **Rotate API keys** regularly
4. **Set strict rate limits**
5. **Monitor API usage** for anomalies

### Environment Variables (Production)
Set these on your hosting platform:
```bash
OPENAI_API_KEY=sk-proj-...
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
```

### Docker Deployment
```bash
# Build and start all services
docker-compose up --build

# DSPy service will automatically load .env file
```

---

## Additional Resources

- **OpenAI Documentation:** https://platform.openai.com/docs
- **DSPy Documentation:** https://dspy-docs.vercel.app
- **API Usage Dashboard:** https://platform.openai.com/usage
- **Billing Settings:** https://platform.openai.com/settings/organization/billing

---

## Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify all services are running
3. Test API key with a simple curl request:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

Happy AI-powered shopping! 🚀
