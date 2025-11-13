# SmartShop AI (React + Node + PostgreSQL + DSPy RAG)

This is a runnable scaffold implementing:
- React frontend (Vite + Tailwind) with **Login/Register** screens.
- Node.js + Express backend with **JWT auth** and **native `pg`** PostgreSQL.
- DSPy-style Python microservice (Flask) for RAG endpoints.
- A/B metrics endpoint & simple admin dashboard chart.
- Email flows intentionally **skipped** as requested.

## Quick Start

### 1) PostgreSQL
```bash
createdb smartshop_ai
psql -U postgres -d smartshop_ai -f database/schema.sql
psql -U postgres -d smartshop_ai -f database/seed.sql
```

### 2) Backend
```bash
cd backend
cp .env.example .env
# edit DB_USER/DB_PASS/etc.
npm install
npm run dev
```

### 3) DSPy microservice
```bash
cd ../dspy_service
pip install -r requirements.txt
python app.py
```

### 4) Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open http://localhost:5173

## What’s covered
- ✅ Auth (register/login) + JWT + `/api/auth/me`
- ✅ Products from Postgres (`/api/products`, `/api/products/:id`)
- ✅ RAG microservice (`/recommend`, `/search`, `/qa`) + Node proxy `/api/rag/*`
- ✅ A/B metrics endpoint `/api/abtest/metrics` + admin chart in UI
- ✅ Modern Tailwind UI scaffolding
- 🚫 Email verification/reset skipped

## Environment
`backend/.env`:
```
PORT=4000
JWT_SECRET=devsecret
RAG_URL=http://localhost:8000

DB_USER=postgres
DB_PASS=yourpassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartshop_ai
```
