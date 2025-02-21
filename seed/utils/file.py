import os
import json
from utils.networkx import convert_graph_to_json

data_dir = "seed/data"

def save_gdf_to_geojson(gdf, city, data_type):
    """Save a GeoDataFrame to a GeoJSON file."""
    file_path = f"{data_dir}/geojson/{city.lower()}_{data_type}.geojson"
    gdf.to_file(file_path, driver='GeoJSON')

def save_network_nodes_to_json(nodes, city, data_type):
    """Save the network nodes(in list) to a JSON file."""
    file_path = f"{data_dir}/network_nodes/{city.lower()}_{data_type}.json"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'w') as f:
        json.dump(nodes, f, separators=(',', ':'))

def save_network_graph_to_json(G, city):
    """Save the network graph to a JSON file."""
    graph_json_str = convert_graph_to_json(G)
    file_path = f"{data_dir}/network_graphs/{city.lower()}_graph.json"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'w') as f:
        f.write(graph_json_str)
