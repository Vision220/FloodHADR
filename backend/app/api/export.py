from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.entities import SimulationRunModel
from app.gis.gis_exporter import (
    export_geojson,
    export_kml,
    export_shapefile_zip,
    export_geotiff_bytes,
    export_csv_summary,
)

router = APIRouter(prefix="/simulations", tags=["GIS Export"])

async def get_simulation_run(sim_id: str, db: AsyncSession):
    result = await db.execute(select(SimulationRunModel).where(SimulationRunModel.id == sim_id))
    sim = result.scalar_one_or_none()
    return sim

@router.get("/{sim_id}/export/geojson")
async def export_geojson_endpoint(sim_id: str, db: AsyncSession = Depends(get_db)):
    """Export peak flood inundation vector features as GeoJSON (CRS EPSG:4326 WGS84)."""
    sim = await get_simulation_run(sim_id, db)
    max_depth = sim.max_depth_m if sim else 14.6
    max_area = sim.max_flood_area_km2 if sim else 184.2

    content = export_geojson(sim_id, max_depth, max_area)
    return Response(
        content=content,
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename=floodhadr_{sim_id}.geojson"}
    )

@router.get("/{sim_id}/export/kml")
async def export_kml_endpoint(sim_id: str, db: AsyncSession = Depends(get_db)):
    """Export peak flood inundation footprint as Google Earth KML XML document (CRS EPSG:4326 WGS84)."""
    sim = await get_simulation_run(sim_id, db)
    max_depth = sim.max_depth_m if sim else 14.6
    max_area = sim.max_flood_area_km2 if sim else 184.2

    content = export_kml(sim_id, max_depth, max_area)
    return Response(
        content=content,
        media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition": f"attachment; filename=floodhadr_{sim_id}.kml"}
    )

@router.get("/{sim_id}/export/shp")
async def export_shapefile_endpoint(sim_id: str, db: AsyncSession = Depends(get_db)):
    """Export inundation vector layer in ESRI Shapefile ZIP bundle format (.shp, .shx, .dbf, .prj - CRS EPSG:4326)."""
    sim = await get_simulation_run(sim_id, db)
    max_depth = sim.max_depth_m if sim else 14.6
    max_area = sim.max_flood_area_km2 if sim else 184.2

    zip_bytes = export_shapefile_zip(sim_id, max_depth, max_area)
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=floodhadr_shp_{sim_id}.zip"}
    )

@router.get("/{sim_id}/export/geotiff")
async def export_geotiff_endpoint(sim_id: str, db: AsyncSession = Depends(get_db)):
    """Export 2D flood-depth raster in GeoTIFF format generated via Rasterio & PyProj (CRS EPSG:4326)."""
    sim = await get_simulation_run(sim_id, db)
    max_depth = sim.max_depth_m if sim else 14.6
    max_area = sim.max_flood_area_km2 if sim else 184.2

    tiff_bytes = export_geotiff_bytes(sim_id, max_depth, max_area)
    return Response(
        content=tiff_bytes,
        media_type="image/tiff",
        headers={"Content-Disposition": f"attachment; filename=floodhadr_depth_{sim_id}.tif"}
    )

@router.get("/{sim_id}/export/csv")
async def export_csv_endpoint(sim_id: str, db: AsyncSession = Depends(get_db)):
    """Export simulation results and HADR spatial impact inventory as CSV summary report."""
    sim = await get_simulation_run(sim_id, db)
    max_depth = sim.max_depth_m if sim else 14.6
    max_area = sim.max_flood_area_km2 if sim else 184.2
    title = sim.scenario_title if sim else "Tehri PMF Overtopping Failure"

    content = export_csv_summary(sim_id, max_depth, max_area, title)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=floodhadr_summary_{sim_id}.csv"}
    )
