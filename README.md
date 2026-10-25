# Food Verse AI – Multimodal Food Intelligence Agent

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Google_GenAI-Gemini_2.5_Flash-4285F4?style=flat&logo=google)](https://ai.google.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Database](https://img.shields.io/badge/MongoDB-In--Memory_Fallback-47A248?style=flat&logo=mongodb)](https://www.mongodb.com)

Food Verse AI is an autonomous, multimodal full-stack food intelligence system built for personal nutrition tracking, visual produce freshness estimation, commercial kitchen hygiene auditing, conversational culinary assistance with guided interactive timers, and personalized weekly meal planning.

---

## 1. Overview & Core Highlights

- **Zero-Friction Startup (Demo Mode & In-Memory DB)**: Runs out of the box with zero external dependencies. If MongoDB is unreachable at startup, the backend automatically transitions to an in-memory database (`mongomock-motor`) and displays a visible *"Temporary in-memory database"* badge in the UI. If a Gemini API key is not configured, it executes with realistic sample data marked `source: "demo_sample"`.
- **Multimodal Visual Analysis**: Image upload (drag & drop, file picker, and camera capture) with automated Pillow verification, EXIF stripping, and downscaling.
- **Strict Structured AI Schemas**: Built on the official `google-genai` Python SDK utilizing typed Pydantic models for validated JSON responses across all features with 1-retry fallback.
- **Transparent Safety & Honest Disclaimers**: Compliant with food safety guidelines—never claims food is sterile or free of micro-contamination. Permanent disclaimers appear on all visual analyses.

---

## 2. Features

### 🥗 2.1 Food Recognition & Nutrition Analysis
- Upload meal images or capture directly via device camera.
- Identifies items with confidence scores, serving sizes, calories, and macronutrient breakdowns (Protein, Carbs, Fats, Fiber, Sugar, Sodium).
- Visual macro donut chart and per-item calorie distribution bar chart.
- Nutritional insights and automatic history persistence.
- *Notice*: "Values are AI estimates and may differ from actual content."

### 🍎 2.2 Food Freshness Detection
- Analyzes visible surface indicators: bruising, discoloration, wilting, and mold-like patterns.
- Returns a visual indicator status pill: **Looks fresh**, **Some signs of aging**, **Multiple warning signs**, or **Unclear from image**.
- Actionable, cautious storage advice with the golden rule: *"When in doubt, throw it out."*
- *Permanent Disclaimer*: "Visual assessment only. It cannot detect bacteria, toxins, or contamination and cannot guarantee food safety."

### 🛡️ 2.3 Restaurant Hygiene Monitoring
- Commercial kitchen and food-prep inspection across categories: surfaces, food storage, cross-contamination risk, PPE & attire, waste handling, and equipment.
- Visual Risk Summary Score (0–100 index) with Low, Moderate, and High Risk ratings.
- Itemized findings with observable evidence and suggested corrective actions.
- Executive audit summary and one-click **Print / Download Report** functionality.
- *Notice*: "Based on visible conditions in the image. Not an official inspection or certification."

### 👨‍🍳 2.4 Smart Cooking Assistant
- Conversational chat with culinary intelligence and session history.
- Structured recipe generation: prep/cook times, servings, calories/macros, ingredients list, and smart substitutions.
- **Interactive Guided Cooking Mode**: Step-by-step modal with built-in countdown timers, audio-visual feedback, and step transitions.
- Quick prompt chips, image query attachments, and voice input via browser **Web Speech API** with graceful fallback.
- "Save Recipe" action to save directly into personal recipe book.

### 📅 2.5 Personalized Meal Planner
- Customization: Diet type (Balanced, Mediterranean, High-Protein, Keto, Vegan, etc.), declared allergies, budget, cuisine, ingredients on hand, and calorie/protein targets.
- Generates 1-day or 7-day schedules with breakfast, lunch, dinner, and snacks.
- **Server-Side Allergy Validator**: Post-validates ingredients against declared allergies and flags conflicts.
- **1-Click "Replace this meal"**: Re-rolls individual meals under identical constraints without altering the rest of the week.
- Categorized, interactive grocery checklist with checkable items.
- *Notice*: "General guidance, not medical advice. Consult a professional for medical conditions or severe allergies."

### 📊 2.6 Central Dashboard Aggregator
- Aggregated database numbers via a single `/api/v1/dashboard/summary` endpoint.
- 7-Day calories and macros trend chart (Recharts Line Chart).
- Weekly activity distribution bar chart.
- Today's consumed nutrition totals.
- Quick-launch feature cards and recent activity feed.

---

## 3. Architecture Diagram

```
+-------------------------------------------------------------------------+
|                        Frontend (React 18 + Vite)                       |
|  Tailwind CSS Design System · Framer Motion · Recharts · Lucide Icons   |
|     Axios API Interceptor (Bearer JWT + Auto 401 Logout)                |
+-------------------------------------------------------------------------+
                                    │ HTTP / REST (/api/v1)
                                    ▼
+-------------------------------------------------------------------------+
|                         Backend (FastAPI + Python)                      |
|  SlowAPI Rate Limiting · Pillow Image Sanitization · PyJWT · Bcrypt     |
+─────────────────────────────────────────────────────────────────────────+
    │                     │                               │
    ▼                     ▼                               ▼
[Auth & Routers]   [AI Service Layer]            [Database Engine]
 - /auth           - BaseAIProvider (Interface)   - Motor (Async MongoDB)
 - /food           - GeminiProvider (google-genai)- Automatic Fallback to
 - /freshness      - DemoProvider (Sample Data)     mongomock-motor (In-Memory)
 - /hygiene        - AllergyValidator Service     - Auto Seed: demo@aahaar.ai
 - /chat & /recipes                                 / Demo@12345
 - /mealplans
 - /dashboard
```

---

## 4. Design System & Palette

- **Primary**: `#1F4D3A` (Forest Green)
- **Deep Forest**: `#14352A` (Sidebar background)
- **Mint Accent**: `#A8E6CF` & `#E3F6EC` (Cards, badges, buttons)
- **Cream Background**: `#FAF6EC`
- **Amber Caution**: `#E9B44C` (Warning indicators)
- **Terracotta Risk**: `#C8553D` (High risk & allergy alerts)
- **Charcoal Text**: `#1E2A25`
- **Typography**: *Plus Jakarta Sans* / *Inter* (UI) and *Playfair Display* (Headings).

---

## 5. Local Setup on Windows (PowerShell)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) MongoDB Community Edition running locally on `mongodb://localhost:27017`

### 1. Clone & Setup Project Directory
```powershell
git clone <repository_url> aahaar-ai
cd aahaar-ai
```

### 2. Backend Setup
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
.\venv\Scripts\pip.exe install -r backend\requirements.txt

# Create .env from template
Copy-Item backend\.env.example backend\.env

# Run backend server (Port 8000)
cd backend
..\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup (New Terminal Window)
```powershell
cd aahaar-ai\frontend

# Install node dependencies
npm install

# Create .env from template
Copy-Item .env.example .env

# Run frontend dev server (Port 5173)
npm run dev
```

### 4. Access the Application
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Pre-seeded Demo Credentials**:
  - Email: `demo@aahaar.ai`
  - Password: `Demo@12345`

---

## 6. Demo Mode vs. Live Gemini AI

| Feature | Demo Mode (`DEMO_MODE=true` or no key) | Live AI Mode (`GEMINI_API_KEY` set) |
| :--- | :--- | :--- |
| **Setup Required** | None (instant out of the box) | Requires Google AI Studio API Key |
| **Response Source Tag** | `source: "demo_sample"` | `source: "live_ai"` |
| **UI Banner** | Persistent `"DEMO MODE – sample data"` badge | Green `"LIVE AI (gemini-2.5-flash)"` badge |
| **Data Output** | Rich pre-computed culinary samples | Real-time multimodal vision inference |
| **Video Analysis** | Disabled with notice | Enabled (up to 20 MB / 30 seconds) |

### Switching to Live Gemini Mode:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com).
2. Edit `backend/.env`:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   DEMO_MODE=false
   ```
3. Restart the backend server. The app will immediately run live Gemini vision inference.

---

## 7. MongoDB Setup (Local vs. Atlas)

### Local MongoDB
If local MongoDB is installed and running on `mongodb://localhost:27017`, Food Verse AI connects and creates persistent indexes on startup. If not installed, Food Verse AI automatically boots with the in-memory fallback.

### MongoDB Atlas (Cloud)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Obtain your connection string:
   ```env
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=aahaar_ai
   ```
3. Place this in `backend/.env`.

---

## 8. API Endpoints Overview

All endpoints are prefixed under `/api/v1` and documentable at `/docs`:

- **Authentication**:
  - `POST /api/v1/auth/register` – Register new user
  - `POST /api/v1/auth/login` – Login & receive JWT
  - `GET /api/v1/auth/me` – Current authenticated user
- **User Preferences**:
  - `GET /api/v1/users/preferences` – Retrieve dietary goals & allergies
  - `PUT /api/v1/users/preferences` – Update preferences
- **Food Analysis**:
  - `POST /api/v1/food/analyze` – Multipart image upload with nutrient extraction
- **Freshness Detection**:
  - `POST /api/v1/freshness/analyze` – Produce visual inspection
- **Hygiene Monitoring**:
  - `POST /api/v1/hygiene/analyze` – Kitchen inspection & risk scoring
- **Cooking Assistant**:
  - `POST /api/v1/chat/sessions` – Create chat session
  - `GET /api/v1/chat/sessions` – List sessions
  - `POST /api/v1/chat/sessions/{id}/messages` – Send message (text, image, audio)
- **Saved Recipes**:
  - `GET /api/v1/recipes` – List saved recipes
  - `POST /api/v1/recipes` – Save recipe
  - `DELETE /api/v1/recipes/{id}` – Remove recipe
- **Meal Planning**:
  - `POST /api/v1/mealplans/generate` – Synthesize 1 or 7 day meal schedule
  - `POST /api/v1/mealplans/{id}/replace-meal` – Re-roll single meal
  - `GET /api/v1/mealplans` – List meal plans
- **History & Dashboard**:
  - `GET /api/v1/history` – Filterable analysis records
  - `GET /api/v1/dashboard/summary` – Single aggregated metrics endpoint
  - `GET /api/v1/system/status` – Live mode and database connectivity

---

## 9. Automated Testing

### Backend Pytest Suite
Run the 14 automated backend tests covering authentication, upload validation, demo providers, allergy checks, and dashboard aggregation:
```powershell
cd aahaar-ai\backend
..\venv\Scripts\pytest.exe -v
```

### Frontend Production Build
Verify that the React frontend builds without errors:
```powershell
cd aahaar-ai\frontend
npm run build
```

---

## 10. Production Deployment Guide

### Backend on Render (Web Service)
1. Create a new **Web Service** on [Render](https://render.com).
2. Root Directory: `backend`
3. Environment: `Python`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Environment Variables:
   - `SECRET_KEY`: Random 64-character secret
   - `MONGODB_URL`: Your MongoDB Atlas URI
   - `DATABASE_NAME`: `aahaar_ai`
   - `GEMINI_API_KEY`: Your Gemini API Key
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `DEMO_MODE`: `false`
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app`

### Frontend on Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Framework Preset: `Vite`
3. Root Directory: `frontend`
4. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api/v1`
5. Deploy.

---

## 11. Troubleshooting

- **MongoDB Timeout at Startup**: If local MongoDB is not running, Food Verse AI automatically logs a warning and boots into in-memory `mongomock-motor`. This is normal and expected behavior.
- **Port Conflicts (8000 or 5173)**: If another process occupies port 8000, specify a different port in uvicorn and update `frontend/vite.config.js` proxy.
- **Browser Web Speech API**: Web Speech is natively supported in Google Chrome, Edge, and Safari. In other browsers, voice input gracefully displays an informative notice while text input remains fully functional.

---

## 12. Limitations & Ethical Notice

- **Nutritional Estimates**: All calorie, macro, and micro values are algorithmic estimates generated via AI and may differ from laboratory chemical analyses.
- **Microbiological Safety**: Visual assessment cannot detect microscopic bacterial contamination (*Salmonella*, *E. coli*, *Listeria*), viral loads, or chemical toxins. Always observe official food safety guidelines.
- **Dietary & Medical Advice**: Meal plans are informational guidance and do not constitute certified clinical dietary advice.
