def save_to_geojson(gdf, city, data_type=None):
    """
    Save a GeoDataFrame to a GeoJSON file.

    Parameters:
    gdf (gpd.GeoDataFrame): The GeoDataFrame to save.
    city (str): The name of the city.
    data_type (str, optional): The type of data (e.g., apartment, supermarket, park). Defaults to None.
    """
    city = city.lower()
    if data_type:
        file_path = f"geojson/{city}_{data_type}.geojson"
    else:
        file_path = f"geojson/{city}.geojson"
    
    gdf.to_file(file_path, driver='GeoJSON')