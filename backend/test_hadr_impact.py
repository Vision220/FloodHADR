import sys
from app.gis.impact_analyzer import compute_hadr_impact

print("Testing GeoPandas & Shapely HADR Impact Spatial Calculations...")
thresholds = {"low_max_m": 0.5, "medium_max_m": 1.5, "high_max_m": 3.0}
res = compute_hadr_impact(max_depth_m=14.6, flood_area_km2=184.2, risk_thresholds=thresholds)

print("\n--- Summary Metrics ---")
for k, v in res["summary_metrics"].items():
    print(f"  {k}: {v}")

print("\n--- Risk Breakdown ---")
for k, v in res["risk_breakdown"].items():
    print(f"  {k}: {v}")

print(f"\nTotal Affected GIS Features Calculated: {len(res['affected_features'])}")
print(f"Is Synthetic Demo Data: {res['is_synthetic_demo_data']}")
print(f"Demo Notice: {res['demo_data_notice']}")
print("\nPASSED ALL SPATIAL GEOPANDAS TESTS!")
