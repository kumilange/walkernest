import time
import json
import pandas as pd
from shapely.geometry import shape
from utils.file import save_gdf_to_geojson, save_network_graph_to_json, save_network_nodes_to_json
from utils.data_fetcher import fetch_and_normalize_data, generate_query
from utils.geometry import add_boundary, add_centroid, get_geometry_by_objectid, generate_poly_string
from utils.networkx import compress_network_graph, convert_gdf_to_network_nodes, create_network_graph

def load_data(csv_path, geojson_path):
    """Load CSV and GeoJSON data."""
    try:
        csv_data = pd.read_csv(csv_path)
        with open(geojson_path, 'r') as f:
            geojson_data = json.load(f)
        return csv_data, geojson_data
    except Exception as e:
        print(f"Error loading data: {e}")
        return None, None
    
def process_data(csv_data, geojson_data, output_file_path):
    """Process data for each city and save the city dictionary."""
    if csv_data.empty or not geojson_data:
        print("One or both of the datasets are empty.")
        return
    
    citydict = {}  # Dictionary to store processed city data
    for _, row in csv_data.iterrows():
        city = row['NAME']
        objectid = row['OBJECTID']
        geometry = get_geometry_by_objectid(geojson_data, objectid)
        print(f"\nExecution start for {city}")
        start_time = time.time()

        try:
            process_city_data(city, geometry)
            add_city_data_to_dict(citydict, city, objectid, geometry)
        except Exception as e:
            print(f"Error processing {city}: {e}")

        end_time = time.time()
        print(f"Execution time for {city}: {end_time - start_time} seconds\n")

    # Save the processed city dictionary to a JSON file
    save_city_dict_to_json(citydict, output_file_path)

def add_city_data_to_dict(citydict, city, objectid, geometry):
    """Add processed city data to the city dictionary."""
    citydict[city.lower()] = {
        "id": objectid,
        "geometry": geometry
    }

def save_city_dict_to_json(citydict, output_file_path):
    """Save the processed city dictionary to a JSON file."""
    try:
        with open(output_file_path, 'w') as f:
            json.dump(citydict, f)
    except Exception as e:
        print(f"Error saving citydict.json: {e}")

def process_city_data(city, geometry):
    """Processes data for a city by generating the network graph, GeoJSON and network nodes."""
    G = generate_network_graph(geometry, city)
    generate_geojson_and_network_nodes(G, geometry, city)

def generate_network_graph(geometry, city):
    """Process and compress the network graph."""
    G = create_network_graph(shape(geometry))
    save_network_graph_to_json(compress_network_graph(G), city)
    return G

def generate_geojson_and_network_nodes(G, geometry, city):
    """Processes geojsons and network nodes for amenities."""
    poly_string = generate_poly_string(geometry)
    amenities = {
        "apartment": [("building", "apartments"), ("building", "residential")],
        "park": [("leisure", "park"), ("leisure", "dog_park")],
        "supermarket": [("shop", "supermarket"), ("shop", "grocery")],
        "cafe": [("amenity", "cafe")]
    }
    for amenity, query_params in amenities.items():
        query = generate_query(poly_string, query_params)
        gdf = fetch_and_normalize_data(query)
        # Save GeoJSON
        save_gdf_to_geojson(gdf, city, amenity)

        if amenity == "park":
            gdf = add_boundary(gdf)
        else:
            gdf = add_centroid(gdf)
        nnodes = convert_gdf_to_network_nodes(G, gdf, use_centroid=amenity != "park")
        # Save network nodes
        save_network_nodes_to_json(nnodes, city, amenity)
