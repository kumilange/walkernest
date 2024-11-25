import json
import geopandas as gpd
from shapely.geometry import Point, shape

def create_gdf_with_centroid(geom_centroid_rows):
    try:
        # Parse rows with list comprehensions for better performance
        parsed_data = [
            (
                shape(json.loads(row[0])),
                Point(json.loads(row[1])['coordinates']),
                row[2]
            )
            for row in geom_centroid_rows
            if row[0] and row[1]  # Skip rows with None or empty strings
        ]
        
        # Separate parsed data into respective columns
        geometries, centroids, properties_list = zip(*parsed_data)

        # Create GeoDataFrame in a single step
        gdf = gpd.GeoDataFrame(
            list(properties_list),
            geometry=list(geometries),
            crs="EPSG:4326"
        )
        gdf['centroid'] = list(centroids)

        return gdf

    except Exception as e:
        raise ValueError(f"Error creating GeoDataFrame: {e}")


def set_centroid(gdf):
    """
    Replace the geometry of each feature in the GeoDataFrame with its centroid.
    """
    # Re-project to a projected CRS (e.g., UTM)
    projected_gdf = gdf.to_crs(epsg=3395)  # World Mercator projection

    # Calculate centroids in the projected CRS
    projected_gdf['geometry'] = projected_gdf.geometry.centroid

    # Re-project back to the original CRS
    gdf['geometry'] = projected_gdf.to_crs(gdf.crs).geometry

    # Check if the 'centroid' column exists before dropping it
    if 'centroid' in gdf.columns:
        gdf = gdf.drop(columns=['centroid'])

    return gdf

