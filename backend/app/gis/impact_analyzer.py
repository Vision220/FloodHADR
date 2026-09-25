from typing import Dict, Any, List, Optional
import math
import geopandas as gpd
from shapely.geometry import Point, Polygon, LineString, box

DEMO_NOTICE = (
    "DEMO NOTICE: GIS layers shown are synthetic demonstration layers "
    "generated for decision support modeling. They do not represent real-world ground survey observations."
)

def create_synthetic_gis_layers() -> Dict[str, gpd.GeoDataFrame]:
    """
    Generates synthetic GIS demo layers for:
    1. Buildings (Points / Polygons)
    2. Roads (LineStrings)
    3. Bridges (Points)
    4. Schools (Points)
    5. Hospitals (Points)
    6. Administrative Boundaries (Polygons)
    7. Agricultural Areas (Polygons)
    
    All layers are clearly tagged with is_synthetic_demo = True.
    """
    # 1. Buildings (Synthetic Residential/Commercial Cluster Polygons)
    buildings_data = [
        {"name": "Tehri Downstream Settlement Alpha", "type": "Building", "units": 45, "geometry": Polygon([[78.475, 30.365], [78.482, 30.365], [78.482, 30.360], [78.475, 30.360]])},
        {"name": "Koteshwar Hydro Worker Colony", "type": "Building", "units": 28, "geometry": Polygon([[78.490, 30.285], [78.498, 30.285], [78.498, 30.280], [78.490, 30.280]])},
        {"name": "Devprayag Confluence Bazaar", "type": "Building", "units": 110, "geometry": Polygon([[78.592, 30.148], [78.602, 30.148], [78.602, 30.142], [78.592, 30.142]])},
        {"name": "Byasi Riverfront Settlement", "type": "Building", "units": 35, "geometry": Polygon([[78.415, 30.135], [78.425, 30.135], [78.425, 30.130], [78.415, 30.130]])},
        {"name": "Shivpuri Adventure Tourism Hub", "type": "Building", "units": 52, "geometry": Polygon([[78.380, 30.140], [78.390, 30.140], [78.390, 30.134], [78.380, 30.134]])},
        {"name": "Rishikesh Lowland Colony Sector-4", "type": "Building", "units": 240, "geometry": Polygon([[78.260, 30.082], [78.272, 30.082], [78.272, 30.075], [78.260, 30.075]])},
        {"name": "Tehri High-Ground Colony (Safe Zone)", "type": "Building", "units": 85, "geometry": Polygon([[78.420, 30.410], [78.435, 30.410], [78.435, 30.400], [78.420, 30.400]])},
    ]

    # 2. Roads (Synthetic LineStrings)
    roads_data = [
        {"name": "NH-58 Devprayag - Rishikesh National Highway", "type": "Road", "class": "Arterial Highway", "geometry": LineString([[78.5986, 30.1458], [78.4200, 30.1380], [78.2950, 30.1050]])},
        {"name": "Tehri - Koteshwar Dam Access Corridor", "type": "Road", "class": "Dam Access Road", "geometry": LineString([[78.4802, 30.3781], [78.4900, 30.3400], [78.4980, 30.2780]])},
        {"name": "Bhagirathi Riverbank Arterial Link", "type": "Road", "class": "District Road", "geometry": LineString([[78.4980, 30.2780], [78.5200, 30.2000], [78.5986, 30.1458]])},
        {"name": "Shivpuri - Rishikesh Coastal Bypass", "type": "Road", "class": "State Highway", "geometry": LineString([[78.3880, 30.1380], [78.3200, 30.1150], [78.2676, 30.0869]])},
        {"name": "Tehri Chamba High Elevation Bypass (Safe)", "type": "Road", "class": "High Ground Bypass", "geometry": LineString([[78.4802, 30.3781], [78.4000, 30.3400], [78.3500, 30.2800], [78.2950, 30.1050]])},
    ]

    # 3. Bridges (Synthetic Bridge Points)
    bridges_data = [
        {"name": "Koteshwar Dam Spillway Bridge", "type": "Bridge", "capacity": "Double Lane", "geometry": Point(78.4980, 30.2780)},
        {"name": "Devprayag Sangam Suspension Bridge", "type": "Bridge", "capacity": "Pedestrian/Light Vehicle", "geometry": Point(78.5986, 30.1458)},
        {"name": "Byasi Hydro Aqueduct Bridge", "type": "Bridge", "capacity": "Heavy Transport", "geometry": Point(78.4200, 30.1380)},
        {"name": "Shivpuri Rafting Bridge", "type": "Bridge", "capacity": "Footbridge", "geometry": Point(78.3880, 30.1380)},
        {"name": "Rishikesh Lakshman Jhula Suspension Bridge", "type": "Bridge", "capacity": "Heritage Footbridge", "geometry": Point(78.3250, 30.1220)},
        {"name": "Rishikesh Ram Jhula Suspension Bridge", "type": "Bridge", "capacity": "Heritage Footbridge", "geometry": Point(78.3120, 30.1160)},
    ]

    # 4. Schools (Synthetic School Points)
    schools_data = [
        {"name": "Tehri Valley Primary Govt School", "type": "School", "students": 240, "geometry": Point(78.4780, 30.3620)},
        {"name": "Koteshwar Model Secondary Academy", "type": "School", "students": 380, "geometry": Point(78.4930, 30.2820)},
        {"name": "Devprayag Higher Secondary Institute", "type": "School", "students": 620, "geometry": Point(78.5960, 30.1440)},
        {"name": "Shivpuri Public Community School", "type": "School", "students": 190, "geometry": Point(78.3840, 30.1360)},
        {"name": "Rishikesh Central Inter College", "type": "School", "students": 1100, "geometry": Point(78.2680, 30.0840)},
        {"name": "Tehri Heights Residential School (Safe)", "type": "School", "students": 450, "geometry": Point(78.4280, 30.4050)},
    ]

    # 5. Hospitals (Synthetic Hospital Points)
    hospitals_data = [
        {"name": "Rishikesh District Government Hospital", "type": "Hospital", "beds": 350, "geometry": Point(78.2676, 30.0869)},
        {"name": "Devprayag Base Trauma Center", "type": "Hospital", "beds": 120, "geometry": Point(78.5986, 30.1458)},
        {"name": "Tehri Hydro Worker Medical Unit", "type": "Hospital", "beds": 45, "geometry": Point(78.4760, 30.3680)},
        {"name": "Byasi Emergency Health Dispensary", "type": "Hospital", "beds": 20, "geometry": Point(78.4180, 30.1360)},
        {"name": "Tehri Hill Apex Hospital (Safe)", "type": "Hospital", "beds": 200, "geometry": Point(78.4220, 30.4080)},
    ]

    # 6. Administrative Boundaries (Synthetic District/Subdivision Polygons)
    admin_data = [
        {"name": "Tehri Dam Site Zone Sub-Division", "type": "Admin Boundary", "code": "ADM-01", "population": 14200, "geometry": Polygon([[78.45, 30.40], [78.52, 30.40], [78.52, 30.30], [78.45, 30.30]])},
        {"name": "Koteshwar - Devprayag Valley Circle", "type": "Admin Boundary", "code": "ADM-02", "population": 28400, "geometry": Polygon([[78.48, 30.30], [78.62, 30.30], [78.62, 30.12], [78.48, 30.12]])},
        {"name": "Shivpuri - Muni Ki Reti Block", "type": "Admin Boundary", "code": "ADM-03", "population": 36100, "geometry": Polygon([[78.30, 30.15], [78.48, 30.15], [78.48, 30.05], [78.30, 30.05]])},
        {"name": "Rishikesh Municipal Jurisdiction", "type": "Admin Boundary", "code": "ADM-04", "population": 125000, "geometry": Polygon([[78.20, 30.12], [78.30, 30.12], [78.30, 30.02], [78.20, 30.02]])},
    ]

    # 7. Agricultural Areas (Synthetic Cropland Polygons)
    agri_data = [
        {"name": "Bhagirathi Terraced Paddy Fields Alpha", "type": "Agricultural Area", "crop": "Rice / Paddy", "geometry": Polygon([[78.470, 30.355], [78.488, 30.355], [78.488, 30.345], [78.470, 30.345]])},
        {"name": "Koteshwar Riverside Wheat Fields", "type": "Agricultural Area", "crop": "Wheat / Grains", "geometry": Polygon([[78.495, 30.275], [78.515, 30.275], [78.515, 30.260], [78.495, 30.260]])},
        {"name": "Devprayag Organic Fruit Orchards", "type": "Agricultural Area", "crop": "Citrus / Apples", "geometry": Polygon([[78.580, 30.155], [78.610, 30.155], [78.610, 30.138], [78.580, 30.138]])},
        {"name": "Shivpuri River Bank Vegetable Plots", "type": "Agricultural Area", "crop": "Vegetables", "geometry": Polygon([[78.375, 30.142], [78.395, 30.142], [78.395, 30.130], [78.375, 30.130]])},
        {"name": "Rishikesh Peripheral Agricultural Belt", "type": "Agricultural Area", "crop": "Sugarcane / Maize", "geometry": Polygon([[78.240, 30.070], [78.265, 30.070], [78.265, 30.050], [78.240, 30.050]])},
    ]

    crs = "EPSG:4326"
    return {
        "buildings": gpd.GeoDataFrame(buildings_data, crs=crs),
        "roads": gpd.GeoDataFrame(roads_data, crs=crs),
        "bridges": gpd.GeoDataFrame(bridges_data, crs=crs),
        "schools": gpd.GeoDataFrame(schools_data, crs=crs),
        "hospitals": gpd.GeoDataFrame(hospitals_data, crs=crs),
        "admin_boundaries": gpd.GeoDataFrame(admin_data, crs=crs),
        "agricultural_areas": gpd.GeoDataFrame(agri_data, crs=crs),
    }

def create_synthetic_flood_zones(max_depth_m: float = 14.6) -> gpd.GeoDataFrame:
    """
    Creates synthetic flood inundation GeoDataFrame with depth attributes.
    """
    zones = [
        # Zone 1: Severe Inundation Depth
        {"zone": "Zone 1 - Dam Breach Direct Impact", "depth_m": max_depth_m, "geometry": Polygon([[78.460, 30.380], [78.510, 30.380], [78.520, 30.250], [78.450, 30.250]])},
        # Zone 2: High Risk Valley Depth
        {"zone": "Zone 2 - Devprayag Valley High Water", "depth_m": round(max_depth_m * 0.45, 1), "geometry": Polygon([[78.500, 30.260], [78.620, 30.260], [78.620, 30.130], [78.500, 30.130]])},
        # Zone 3: Moderate Flood Surge Depth
        {"zone": "Zone 3 - Shivpuri Surge Reach", "depth_m": round(max_depth_m * 0.22, 1), "geometry": Polygon([[78.360, 30.150], [78.580, 30.150], [78.580, 30.080], [78.360, 30.080]])},
        # Zone 4: Low Risk Inundation Fringe
        {"zone": "Zone 4 - Rishikesh Outskirts Fringe", "depth_m": round(max_depth_m * 0.08, 1), "geometry": Polygon([[78.240, 30.090], [78.370, 30.090], [78.370, 30.040], [78.240, 30.040]])},
    ]
    return gpd.GeoDataFrame(zones, crs="EPSG:4326")

def compute_hadr_impact(
    max_depth_m: float = 14.6,
    flood_area_km2: float = 184.2,
    risk_thresholds: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Computes spatial HADR threat metrics using GeoPandas & Shapely spatial intersections.
    Classifies risk based on transparent configurable depth thresholds.
    """
    if not risk_thresholds:
        risk_thresholds = {"low_max_m": 0.5, "medium_max_m": 1.5, "high_max_m": 3.0}

    low_max = risk_thresholds.get("low_max_m", 0.5)
    med_max = risk_thresholds.get("medium_max_m", 1.5)
    high_max = risk_thresholds.get("high_max_m", 3.0)

    def classify_risk(depth: float) -> str:
        if depth < low_max:
            return "LOW"
        elif depth < med_max:
            return "MEDIUM"
        elif depth < high_max:
            return "HIGH"
        else:
            return "CRITICAL"

    layers = create_synthetic_gis_layers()
    flood_gdf = create_synthetic_flood_zones(max_depth_m)

    affected_features = []
    risk_breakdown = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

    total_affected_buildings = 0
    total_affected_roads_km = 0.0
    total_affected_bridges = 0
    total_affected_schools = 0
    total_affected_hospitals = 0
    total_affected_admin_boundaries = 0
    total_affected_agricultural_ha = 0.0

    # Perform Shapely & GeoPandas spatial intersection for each GIS layer
    for layer_key, layer_gdf in layers.items():
        for _, feature in layer_gdf.iterrows():
            feat_geom = feature.geometry
            # Check intersection against flood zones
            intersected_zones = flood_gdf[flood_gdf.intersects(feat_geom)]
            
            if not intersected_zones.empty:
                # Find maximum depth among intersected flood zones
                max_feat_depth = float(intersected_zones["depth_m"].max())
                risk_lvl = classify_risk(max_feat_depth)
                risk_breakdown[risk_lvl] += 1

                # Calculate layer specific metrics using Shapely geometric operations
                feat_type = feature["type"]
                subtext = ""

                if feat_type == "Building":
                    units = feature.get("units", 1)
                    total_affected_buildings += units
                    subtext = f"{units} housing/commercial units"
                
                elif feat_type == "Road":
                    # Estimate length of intersection in degrees -> km (~111 km/deg)
                    intersect_geom = feat_geom.intersection(intersected_zones.unary_union)
                    length_km = round(intersect_geom.length * 111.0, 1)
                    total_affected_roads_km += length_km
                    subtext = f"{length_km} km flooded segment ({feature.get('class', 'Road')})"

                elif feat_type == "Bridge":
                    total_affected_bridges += 1
                    subtext = f"Spillway/River Crossing ({feature.get('capacity', 'Bridge')})"

                elif feat_type == "School":
                    students = feature.get("students", 0)
                    total_affected_schools += 1
                    subtext = f"{students} Enrolled Students Impacted"

                elif feat_type == "Hospital":
                    beds = feature.get("beds", 0)
                    total_affected_hospitals += 1
                    subtext = f"{beds} Total Patient Beds"

                elif feat_type == "Admin Boundary":
                    total_affected_admin_boundaries += 1
                    subtext = f"Sector Population: {feature.get('population', 0):,}"

                elif feat_type == "Agricultural Area":
                    # Estimate area of intersection in degrees² -> hectares (~12,321 km²/deg² -> * 100 ha/km²)
                    intersect_geom = feat_geom.intersection(intersected_zones.unary_union)
                    area_ha = round(intersect_geom.area * 111.0 * 111.0 * 100.0, 1)
                    total_affected_agricultural_ha += area_ha
                    subtext = f"{area_ha} Hectares of {feature.get('crop', 'Crop')}"

                # Extract centroid coordinates for Leaflet display
                centroid = feat_geom.centroid
                affected_features.append({
                    "id": f"feat-{layer_key}-{len(affected_features)+1}",
                    "name": feature["name"],
                    "layer": layer_key,
                    "type": feat_type,
                    "flood_depth_m": max_feat_depth,
                    "risk_level": risk_lvl,
                    "subtext": subtext,
                    "lat": round(centroid.y, 4),
                    "lng": round(centroid.x, 4),
                    "is_synthetic_demo": True,
                })

    # Prepare evacuation routes and critical assets
    critical_assets = [
        {"name": "Rishikesh District Government Hospital", "type": "Hospital", "flood_depth_m": round(max_depth_m * 0.25, 1), "status": "Inundated", "distance_km": 42.5, "risk_level": classify_risk(round(max_depth_m * 0.25, 1))},
        {"name": "Devprayag Base Trauma Center", "type": "Hospital", "flood_depth_m": round(max_depth_m * 0.48, 1), "status": "Critical Submerged", "distance_km": 24.1, "risk_level": classify_risk(round(max_depth_m * 0.48, 1))},
        {"name": "Tehri Hydro 1000MW Power Substation", "type": "Power Grid", "flood_depth_m": round(max_depth_m * 0.58, 1), "status": "Critical Submerged", "distance_km": 3.2, "risk_level": classify_risk(round(max_depth_m * 0.58, 1))},
    ]

    evac_routes = [
        {
            "route_name": "Route Alpha: Devprayag Valley -> Tehri Heights Relief Camp",
            "origin_zone": "Devprayag Floodplain (Sector 1)",
            "destination_shelter": "Tehri Heights High-Ground Camp",
            "distance_km": 18.5,
            "travel_time_min": 32,
            "status": "Clear & Open",
            "assigned_evacuees": 12500,
        },
        {
            "route_name": "Route Bravo: Shivpuri Lowland -> Rishikesh Safe Ridge",
            "origin_zone": "Shivpuri River Bank (Sector 2)",
            "destination_shelter": "Rishikesh Stadium Relief Hub",
            "distance_km": 14.2,
            "travel_time_min": 45,
            "status": "Caution - Moderate Water",
            "assigned_evacuees": 8400,
        },
    ]

    affected_pop = int(flood_area_km2 * 750)

    summary_metrics = {
        "affected_buildings": total_affected_buildings,
        "affected_roads_km": round(total_affected_roads_km, 1),
        "affected_bridges": total_affected_bridges,
        "affected_schools": total_affected_schools,
        "affected_hospitals": total_affected_hospitals,
        "affected_admin_boundaries": total_affected_admin_boundaries,
        "affected_agricultural_area_ha": round(total_affected_agricultural_ha, 1),
    }

    return {
        "simulation_id": "sim-tehri-001",
        "submerged_hospitals_count": total_affected_hospitals,
        "submerged_power_grids_count": 1,
        "affected_population": affected_pop,
        "critical_assets": critical_assets,
        "evacuation_routes": evac_routes,
        "summary_metrics": summary_metrics,
        "risk_thresholds": risk_thresholds,
        "risk_breakdown": risk_breakdown,
        "is_synthetic_demo_data": True,
        "demo_data_notice": DEMO_NOTICE,
        "affected_features": affected_features,
    }
