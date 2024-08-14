import json
import geopandas as gpd
from shapely.geometry import shape

def create_gdf_with_centroid(geom_centroid_rows):
    """Create a GeoDataFrame with geometries and centroids from parsed data from DB."""
    # Parse rows with list comprehensions for better performance
    parsed_data = [
        (
            shape(json.loads(row[0])),
            shape(json.loads(row[1])),
            row[2]
        )
        for row in geom_centroid_rows
        if row[0] and row[1]  # Skip rows with None or empty strings
    ]
    
    # Separate parsed data into respective columns
    geometries, centroids, properties_list = zip(*parsed_data)

    gdf = gpd.GeoDataFrame(
        list(properties_list),
        geometry=list(geometries),
        crs="EPSG:4326"
    )
    gdf['centroid'] = list(centroids)

    return gdf
