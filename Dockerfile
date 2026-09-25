# ==========================================
# FloodHADR Multi-Stage Production Dockerfile
# ==========================================

# Stage 1: Build Frontend App
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python FastAPI Backend & Serve Static Frontend
FROM python:3.11-slim

WORKDIR /app

# Install system spatial dependencies (GDAL, GEOS, PROJ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirement manifest
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy compiled static frontend distribution from Stage 1 into backend static mount
COPY --from=frontend-builder /app/frontend/dist ./backend/static

EXPOSE 8000

WORKDIR /app/backend

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
