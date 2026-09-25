import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.models.entities import StudyAreaModel, DamModel, RiverModel, DamBreakScenarioModel, SimulationRunModel
from app.api import study_area, data, scenario, simulation, analysis, export, dem, satellite, delft3d, demo, basin, dam, rainfall, compound_flood, climate, landslide, hydrodynamics, multi_model, sensors, predictive, gee_routes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed initial demo data
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        # Seed default Study Area if empty
        result = await session.get(StudyAreaModel, "sa-tehri")
        if not result:
            tehri_sa = StudyAreaModel(
                id="sa-tehri",
                name="Tehri River Basin & Downstream Valley",
                state="Uttarakhand",
                river="Bhagirathi / Ganga River",
                dam_name="Tehri Dam",
                lat=30.3781,
                lng=78.4802,
                dem_resolution="12m ALOS PALSAR",
                area_km2=1240.0,
                elevation_min=280.0,
                elevation_max=2600.0,
                is_default=True,
            )
            session.add(tehri_sa)

            tehri_dam = DamModel(
                id="dam-tehri",
                name="Tehri Earth and Rockfill Dam",
                river="Bhagirathi River",
                study_area_id="sa-tehri",
                height_m=260.5,
                crest_length_m=575.0,
                reservoir_volume_mm3=3540.0,
                full_reservoir_level_m=830.0,
                current_water_level_m=822.4,
                dam_type="Rockfill",
                construction_year=2006,
                spillway_capacity_m3s=15540.0,
            )
            session.add(tehri_dam)

            bhagirathi_river = RiverModel(
                id="riv-bhagirathi",
                name="Bhagirathi / Ganga River Reach",
                study_area_id="sa-tehri",
                length_km=65.4,
                average_slope="0.008 m/m",
            )
            session.add(bhagirathi_river)

            default_scen = DamBreakScenarioModel(
                id="scen-tehri-overtop",
                title="Tehri PMF Overtopping Failure (100% Storage)",
                dam_id="dam-tehri",
                failure_mode="Overtopping",
                breach_width_m=180.0,
                breach_height_m=120.0,
                formation_time_hr=1.5,
                peak_discharge_m3s=64200.0,
                reservoir_water_level_percent=100.0,
                mannings_n=0.035,
            )
            session.add(default_scen)

            default_sim = SimulationRunModel(
                id="sim-2026-001",
                scenario_id="scen-tehri-overtop",
                scenario_title="Tehri PMF Overtopping Failure (100% Storage)",
                dam_name="Tehri Dam",
                study_area_name="Tehri River Basin & Downstream Valley",
                status="Completed",
                progress_percent=100,
                execution_time_sec=42.8,
                max_flood_area_km2=184.2,
                max_depth_m=14.6,
                max_velocity_ms=8.4,
                affected_population=142500,
                time_steps_total=72,
                current_time_step_sec=21600,
                peak_flow_time_hr=2.2,
            )
            session.add(default_sim)

            await session.commit()
            
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Integrated Dam-Break, Flash-Flood Simulation & HADR Decision Support Platform (NTRO PS ID 26161)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint required by user prompt
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "SQLite Async (PostGIS Compatible)",
        "engine": "2D Hydrodynamic Diffusive Wave Core",
    }

# Register API routers under /api
app.include_router(study_area.router, prefix=settings.API_V1_STR)
app.include_router(data.router, prefix=settings.API_V1_STR)
app.include_router(dem.router, prefix=f"{settings.API_V1_STR}/data/dem")
app.include_router(scenario.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(export.router, prefix=settings.API_V1_STR)
app.include_router(satellite.router)
app.include_router(delft3d.router)
app.include_router(demo.router, prefix=settings.API_V1_STR)
app.include_router(basin.router, prefix=settings.API_V1_STR)
app.include_router(dam.router, prefix=settings.API_V1_STR)
app.include_router(rainfall.router, prefix=settings.API_V1_STR)
app.include_router(compound_flood.router, prefix=settings.API_V1_STR)
app.include_router(climate.router, prefix=settings.API_V1_STR)
app.include_router(landslide.router, prefix=settings.API_V1_STR)
app.include_router(hydrodynamics.router, prefix=settings.API_V1_STR)
app.include_router(multi_model.router, prefix=settings.API_V1_STR)
app.include_router(sensors.router, prefix=settings.API_V1_STR)
app.include_router(predictive.router, prefix=settings.API_V1_STR)
app.include_router(gee_routes.router, prefix=settings.API_V1_STR)

# Serve compiled static frontend when packaged in Docker or production
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")






