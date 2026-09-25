# FloodHADR FastAPI Backend Subsystem

> **Smart India Hackathon 2026 | NTRO Problem Statement 26161**  
> **Integrated Dam-Break Hydrodynamic Simulation & HADR Decision Support Platform**

---

## 🛠️ Architecture & Tech Stack

- **Framework**: Python 3.13, FastAPI 0.110+
- **ASGI Server**: Uvicorn
- **ORM & Database**: SQLAlchemy 2.0 Async + SQLite (aiosqlite driver, PostGIS Migration Ready)
- **Validation**: Pydantic v2
- **Documentation**: Swagger UI (`/docs`) & ReDoc (`/redoc`)

---

## 🚀 Running the Backend Server

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

---

## 📌 Complete API Endpoint Reference

| Method | Endpoint Path | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/study-areas` | List all river basin study areas |
| `POST` | `/api/study-areas` | Register a new study area region |
| `GET` | `/api/dams` | List dam specifications |
| `POST` | `/api/dams` | Create/update dam engineering parameters |
| `GET` | `/api/rivers` | List river reach channels |
| `POST` | `/api/scenarios` | Create & compute dam break breach scenario |
| `GET` | `/api/scenarios` | List saved breach scenarios |
| `GET` | `/api/scenarios/{id}` | Get specific scenario details by ID |
| `POST` | `/api/simulations` | Trigger 2D flood wave simulation job |
| `GET` | `/api/simulations/{id}` | Get simulation metadata |
| `GET` | `/api/simulations/{id}/status` | Query simulation progress status (% complete) |
| `GET` | `/api/simulations/{id}/results` | Fetch hydrograph points & GeoJSON depth layers |
| `GET` | `/api/simulations/{id}/impact` | Fetch HADR impact analysis & evacuation routes |
| `GET` | `/api/simulations/{id}/export/kml` | Export flood footprint as Google Earth KML |
| `GET` | `/api/simulations/{id}/export/shp` | Export ESRI Shapefile bundle |
