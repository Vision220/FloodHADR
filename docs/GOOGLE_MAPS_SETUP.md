# FloodHADR — Google Maps Platform Setup & Satellite Map Configuration

This document provides step-by-step instructions for configuring the **Official Google Maps Platform Map Tiles API** for high-resolution satellite imagery, terrain, roadmap, and Photorealistic 3D Tiles integration in FloodHADR.

---

## 1. Prerequisites
* A Google Cloud Platform (GCP) account.
* Active billing account associated with your GCP project.

---

## 2. Step-by-Step Configuration

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** at the top bar and select **New Project**.
3. Name your project (e.g. `FloodHADR-Geospatial-Twin`) and click **Create**.

### Step 2: Enable Google Maps APIs
1. In the GCP Console, navigate to **APIs & Services > Library**.
2. Search for and enable the following APIs:
   * **Map Tiles API** (for 2D satellite, roadmap, terrain, and photorealistic 3D tiles).
   * **Maps JavaScript API** (for Leaflet and web map canvas integration).

### Step 3: Create an API Key
1. Go to **APIs & Services > Credentials**.
2. Click **+ Create Credentials > API Key**.
3. Copy the generated API key.

### Step 4: Restrict the API Key (Security Best Practice)
1. In **Credentials**, click on your newly created API key.
2. Under **Application restrictions**, choose **Website restrictions** (HTTP referrers) and add:
   * `http://localhost:5173/*`
   * `http://127.0.0.1:5173/*`
3. Under **API restrictions**, choose **Restrict key** and select:
   * **Map Tiles API**
   * **Maps JavaScript API**
4. Click **Save**.

### Step 5: Add Environment Variable in FloodHADR
1. Open or create `.env` in the `frontend` folder:
   ```bash
   cp .env.example .env
   ```
2. Paste your Google Maps API key:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy...YourActualApiKeyHere
   ```
3. Save `.env`.

### Step 6: Start Application & Verify Satellite Mode
1. Restart the dev server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:5173` and open **3D Digital Twin** or **GIS Map**.
3. Select **SATELLITE** or **HYBRID** style.
4. Verify satellite tiles load with status notice: `GOOGLE MAPS PLATFORM SATELLITE EO FEED`.

---

## 3. Fallback & Offline Behavior

If `VITE_GOOGLE_MAPS_API_KEY` is not provided or missing:
* FloodHADR will **not crash**.
* A status notice banner is displayed: `"Google Satellite Map — API key required"`.
* The map automatically falls back to high-resolution ESRI World Imagery and OpenStreetMap tile layers, keeping 100% of simulation, flood layers, and 3D digital twin functionality active!
