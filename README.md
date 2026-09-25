# FloodHADR - Integrated Dam-Break, Flash-Flood Simulation & HADR Decision Support Platform

> **Smart India Hackathon (SIH) 2026 Prototype**  
> **Problem Statement ID:** 26161  
> **Organization:** National Technical Research Organisation (NTRO)  
> **Category:** Software | **Theme:** Disaster Management  

---

## 📌 Executive Summary

**FloodHADR** is an end-to-end web platform designed for rapid dam-break inundation modeling, flash-flood propagation simulation, and Humanitarian Assistance and Disaster Relief (HADR) decision support. Built to address NTRO Problem Statement 26161, FloodHADR empowers disaster management authorities, emergency responders, and hydrologists to:
1. Model dam breach parameters and estimate breach outflow hydrographs using standard empirical equations (Froehlich, MacDonald-Langridge-Monopolis, Ritter).
2. Simulate dynamic 2D flood wave propagation over terrain elevation data (DEM).
3. Visualize flood inundation depth, flow velocity, and flood wave arrival time on interactive GIS maps.
4. Perform spatial HADR impact analysis to identify threatened population centers, critical infrastructure (hospitals, power stations, bridges), and suggest optimal evacuation routes and emergency shelter locations.
5. Export industry-standard GIS data products (GeoJSON, GeoTIFF rasters, CSV hydrographs) and executive PDF disaster management briefs.
6. Provide a modular plug-and-play architecture with standardized adapter contracts for downstream integration with high-fidelity hydrodynamic engines (Delft3D-FLOW, DualSPHysics SPH, HEC-RAS 2D) and satellite imagery feeds (Copernicus Sentinel-1 SAR, Google Earth Engine).

---

## 🏗️ Architecture Overview

FloodHADR uses a decoupled, modern web architecture:

```
                  +-------------------------------------------------------+
                  |                  React 18 + Vite + TS                 |
                  |     (Tailwind CSS, React-Leaflet, Recharts, Zustand)  |
                  +---------------------------+---------------------------+
                                              | REST APIs (JSON / GeoJSON)
                                              v
                  +-------------------------------------------------------+
                  |                    FastAPI (Python)                   |
                  |   (Async Routes, Pydantic v2, Hydro Engine Pipeline)  |
                  +-------------+---------------------------+-------------+
                                |                           |
                 +--------------+              +------------+--------------+
                 | Storage / ORM               | Hydrodynamic Engine       |
                 v                             v                           v
     +-----------------------+     +-----------------------+   +-----------------------+
     |  SQLite + GeoJSON DAO |     |  Prototype Hydro      |   |  External Engine      |
     |  (PostgreSQL/PostGIS  |     |  Solver (Cellular     |   |  Adapters (Delft3D,   |
     |   Ready via SQLAlchemy|     |  Automata / Diffusive |   |  SPH, HEC-RAS)        |
     |   2.0 async)          |     |  Wave Approximation)  |   +-----------------------+
     +-----------------------+     +-----------------------+
                                               |
                                               v
                                   +-----------------------+
                                   | Geospatial Stack      |
                                   | (Rasterio, GeoPandas, |
                                   |  Shapely, PyProj)     |
                                   +-----------------------+
```

---

## 🚀 Key Features & Modules

1. **Dashboard**: System overview, active simulation tasks, risk meters, recent runs, quick scenario triggers.
2. **Study Area Management**: Region ROI definition, bounding box / polygon selection, preloaded river basins (Tehri, Hirakud, Idukki, Mullaperiyar).
3. **Dam & River Data**: Reservoir storage curves, crest parameters, water surface elevation, downstream channel profile.
4. **DEM & Terrain Data**: SRTM / Synthetic DEM processing, hillshade rendering, slope computation, Manning's roughness coefficient matrix generator.
5. **Dam Break Scenario Builder**: Failure mode modeling (Overtopping vs. Piping vs. Instantaneous Breach), Froehlich/Ritter hydrograph generation, parameter sensitivity toggles.
6. **Flood Simulation Engine**: Fast 2D diffusive-wave/cellular automata propagation solver calculating water depth matrices and wave front timing across discrete time steps.
7. **Flood Inundation Analysis**: Depth zoning (Low <0.5m, Medium 0.5-1.5m, High 1.5-3m, Severe >3m), maximum inundation footprint, arrival time maps.
8. **HADR Impact Analysis**: Spatial overlay on critical assets (hospitals, schools, power stations, bridges), affected population index, safe shelter allocation, evacuation path routing.
9. **GIS Map Visualization**: Interactive Leaflet canvas map with multi-layer toggles, depth heatmaps, vector velocity overlay, dynamic temporal playback slider.
10. **Scenario Comparison**: Side-by-side comparative analysis of different dam breach scenarios (e.g., 50% vs 100% capacity failure).
11. **Export Center**: Downloadable GeoJSON layers, GeoTIFF inundation maps, CSV hydrograph data, automated HADR PDF briefs.
12. **Future Engine Integration Adapter**: Clean Python interface contracts (`HydroEngineAdapter`) with mock implementations for Delft3D (NetCDF) and SPH (VTK/Particle CSV).
13. **Satellite / GEE Integration Mock**: SAR Sentinel-1 flood extent comparison & satellite imagery backdrop feeds.

---

## 🛠️ Tech Stack & Dependencies

### Frontend
- **Framework**: React 18 (Vite, TypeScript)
- **Styling**: Tailwind CSS, Lucide React Icons
- **GIS Mapping**: Leaflet, React-Leaflet, Leaflet-Velocity / Canvas Overlay
- **Data Visualization**: Recharts (Hydrographs, Elevation-Volume profiles)
- **State Management**: Zustand / React Context

### Backend
- **Framework**: Python 3.11+, FastAPI, Uvicorn
- **Geospatial Processing**: Rasterio, GeoPandas, Shapely, PyProj
- **Numerical Computation**: NumPy, SciPy
- **Data Persistence**: SQLite (via SQLAlchemy 2.0 Async ORM with Pydantic v2 schemas)
- **Report Generation**: ReportLab / Jinja2 PDF generator

---

## 📖 System Requirements & Installation

*(Detailed installation instructions will be added during the execution phase)*

```bash
# Clone the repository
git clone https://github.com/your-org/FloodHADR.git
cd FloodHADR

# Backend Setup
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend Setup (in a separate terminal)
cd ../frontend
npm install
npm run dev
```

---

## 📜 Disclaimer & Scope

> **Note on Hackathon Scope**: This platform is a **student prototype** designed for Smart India Hackathon 2026. The built-in simulation engine uses an optimized 2D hydrodynamic wave propagation approximation suitable for web-based real-time interactivity. It is designed to cleanly hand off mesh/grid specifications to research-grade hydrodynamic engines (such as Delft3D, DualSPHysics SPH, or HEC-RAS 2D) for full physical validation.

---

## 📄 Documentation

- [ARCHITECTURE.md](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/ARCHITECTURE.md) - Comprehensive Technical Architecture & Component Specs
- [DEVELOPMENT_PLAN.md](file:///c:/Users/Kariy/OneDrive/Documents/FloodHADR/DEVELOPMENT_PLAN.md) - Step-by-Step Hackathon Sprint Roadmap
