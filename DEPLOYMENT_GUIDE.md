# FloodHADR Production Deployment Guide

> **Decision Support System for Dam-Break Inundation Modelling**  
> **Smart India Hackathon 2026** | NTRO Problem Statement 26161

---

## 1. Overview & Deployment Options

FloodHADR supports flexible deployment architectures ranging from quick local demonstration environments to fully containerized Docker deployments and high-availability cloud platforms.

---

## 2. Option A: Docker & Container Orchestration (Recommended)

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+

### Steps
1. Clone repository and navigate to root directory:
   ```bash
   git clone https://github.com/ntro-hadr/FloodHADR.git
   cd FloodHADR
   ```
2. Build and start the containerized service:
   ```bash
   docker compose up --build -d
   ```
3. Access the platform:
   - Platform UI & REST API: `http://localhost:8000`
   - Health Check: `http://localhost:8000/api/health`
4. Stop container:
   ```bash
   docker compose down
   ```

---

## 3. Option B: Cloud Deployment (Decoupled Microservices)

### Frontend (Vercel / Netlify)
1. Set build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Configure Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`

### Backend (Render / Railway / AWS EC2)
1. Build settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. Environment Variables:
   - `PORT`: `8000`
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app`

---

## 4. Option C: Local Development Deployment

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in any modern web browser (Chrome, Edge, Firefox, Safari).

---

## 5. Security & Production Checklist

- [x] **CORS Configuration**: Allow explicit origins in production (`backend/app/main.py`).
- [x] **Static Asset Caching**: Cache control headers for GeoTIFFs and map tiles.
- [x] **SQLite Async Concurrency**: Persistent database locking handled safely via `aiosqlite`.
- [x] **Docker Volume Mount**: Persistent upload directory (`/app/backend/uploads`).
