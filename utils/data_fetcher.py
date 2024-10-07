import requests
import geopandas as gpd
from utils.geometry import create_geometry, filter_properties

def generate_query(bbox, key_value_pairs):
    """
    Generates an Overpass API query based on the bounding box and key-value pairs.
    
    :param bbox: The bounding box for the query.
    :param key_value_pairs: A list of tuples containing key-value pairs for the query.
    :return: A formatted Overpass API query string.
    """
    query = f"[out:json][timeout:25][bbox:{bbox}];\n(\n"
    for key, value in key_value_pairs:
        query += f'  nwr["{key}"="{value}"];\n'
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
    response = requests.get(overpass_url, params={'data': query})
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

    gdf = gpd.GeoDataFrame(properties, geometry=geometry)
    return gdf