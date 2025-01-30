import requests
import geopandas as gpd
from utils.geometry import create_geometry, filter_properties

def generate_query(poly_string, key_value_pairs):
    query = f"[out:json][timeout:25];\n(\n"
    for key, value in key_value_pairs:
        query += f'  nwr["{key}"="{value}"](poly:"{poly_string}");\n'
    query += ");\nout geom;\n>;\nout skel qt;\n"
    return query

def fetch_and_normalize_data(query):
    """
    Fetch data from the Overpass API and normalize it into a GeoDataFrame.

    Parameters:
    query (str): The Overpass QL query.

    Returns:
    gpd.GeoDataFrame: A GeoDataFrame containing the normalized data.
    """
    overpass_url = "http://overpass-api.de/api/interpreter"
    payload = {"data": query}
    response = requests.post(overpass_url, data=payload)
    response.raise_for_status()
    data = response.json()

    elements = data['elements']
    nodes = {element['id']: element for element in elements if element['type'] == 'node'}

    geometry = []
    properties = []

    for element in elements:
        geom = create_geometry(element, nodes)
        filtered_props = filter_properties(element)
        if geom and filtered_props:
            geometry.append(geom)
            filtered_props["id"] = element["id"]
            properties.append(filtered_props)
    
    # Ensure the GeoDataFrame has a CRS defined
    gdf = gpd.GeoDataFrame(properties, geometry=geometry)
    if gdf.crs is None:
        gdf.set_crs("EPSG:4326", inplace=True)

    return gdf
