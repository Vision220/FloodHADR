import os
import numpy as np
import rasterio
from rasterio.transform import from_bounds

def generate_synthetic_dem(output_path: str = "uploads/dem/synthetic_tehri_dem.tif") -> str:
    """
    Generates a realistic synthetic DEM GeoTIFF raster around Tehri Reservoir.
    Dimensions: 100 x 100 cells
    CRS: EPSG:4326 (WGS 84)
    Bounds: [78.43, 30.33, 78.53, 30.43]
    Elevation: 280.0m to 1250.0m
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    width = 100
    height = 100
    
    # Create coordinate grid
    x = np.linspace(-2, 2, width)
    y = np.linspace(-2, 2, height)
    xx, yy = np.meshgrid(x, y)
    
    # Synthetic terrain formula: mountain slopes + river valley channel
    river_channel = 350 + 150 * (xx**2 + 0.5 * yy**2) - 80 * np.sin(3 * xx)
    peaks = 400 * np.exp(-((xx - 1)**2 + (yy - 1)**2)) + 300 * np.exp(-((xx + 1)**2 + (yy + 1)**2))
    elevation = river_channel + peaks + 280.0
    
    # Ensure float32 array
    elevation = elevation.astype(np.float32)
    
    # Define bounding box (Tehri Dam area: ~30.378°N, 78.480°E)
    west, south, east, north = 78.43, 30.33, 78.53, 30.43
    transform = from_bounds(west, south, east, north, width, height)
    
    # Write GeoTIFF using Rasterio
    with rasterio.open(
        output_path,
        'w',
        driver='GTiff',
        height=height,
        width=width,
        count=1,
        dtype=elevation.dtype,
        crs='EPSG:4326',
        transform=transform,
        nodata=-9999.0
    ) as dst:
        dst.write(elevation, 1)
        
    return output_path

if __name__ == "__main__":
    path = generate_synthetic_dem()
    print(f"Generated synthetic DEM at: {path}")
