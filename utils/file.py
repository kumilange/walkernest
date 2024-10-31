import os
import json
import networkx as nx
from shapely.geometry import mapping

def save_gdf_to_geojson(gdf, city, data_type):
    """
    Save a GeoDataFrame to a GeoJSON file.

    Parameters:
    gdf (gpd.GeoDataFrame): The GeoDataFrame to save.
    city (str): The name of the city.
    data_type (str, optional): The type of data (e.g., apartment, supermarket, park). Defaults to None.
    """
    city = city.lower()
    file_path = f"data/geojson/{city}_{data_type}.geojson"
    
    gdf.to_file(file_path, driver='GeoJSON')

# Function to save list to a JSON file
def save_list_to_json(list, city, data_type):
    os.makedirs('data/network_nodes', exist_ok=True)
    city = city.lower()
    file_path = f"data/network_nodes/{city}_{data_type}.json"
    
    with open(file_path, 'w') as f:
        json.dump(list, f, separators=(',', ':'))

# Function to save list to a JSON file
def save_graph_to_json(G, city):
    os.makedirs('data/network_graphs', exist_ok=True)
    city = city.lower()
    # Serialize the MultiDiGraph to JSON-serializable format
    graph_data = nx.readwrite.json_graph.node_link_data(G)
    # Convert geometries to GeoJSON format
    for node in graph_data['nodes']:
        if 'geometry' in node:
            node['geometry'] = mapping(node['geometry'])
    for link in graph_data['links']:
        if 'geometry' in link:
            link['geometry'] = mapping(link['geometry'])

    # Serialize the JSON-serializable format to a JSON string
    graph_json_str = json.dumps(graph_data)

    file_path = f"data/network_graphs/{city}_graph.json"
    
    with open(file_path, 'w') as f:
        f.write(graph_json_str)