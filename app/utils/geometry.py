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