import requests
import geopandas as gpd
from utils.geometry import create_geometry, filter_properties

def generate_query(poly_string, key_value_pairs):
    """Generates an Overpass API query for the given poly_string and key-value pairs."""
    query = f"[out:json][timeout:25];\n(\n"
    for key, value in key_value_pairs:
        query += f'  nwr["{key}"="{value}"](poly:"{poly_string}");\n'
    query += ");\nout geom;\n>;\nout skel qt;\n"
    return query

def fetch_data_from_overpass(query):
    """Fetch data from the Overpass API."""
    overpass_url = "http://overpass-api.de/api/interpreter"
    payload = {"data": query}

    try:
        response = requests.post(overpass_url, data=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Overpass API: {e}")
        raise

def extract_elements_and_nodes(data):
    """Extract OSM elements and nodes from Overpass API response data."""
    elements = data['elements']
    nodes = {element['id']: element for element in elements if element['type'] == 'node'}
    return elements, nodes

def create_gdf(elements, nodes):
    """Create a GeoDataFrame from OSM elements and nodes."""
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

    if gdf.crs is None:
        gdf.set_crs("EPSG:4326", inplace=True)
    
    return gdf

def fetch_and_normalize_data(query):
    """Fetch data from the Overpass API and normalize it into a GeoDataFrame."""
    data = fetch_data_from_overpass(query)
    elements, nodes = extract_elements_and_nodes(data)
    gdf = create_gdf(elements, nodes)
    return gdf
