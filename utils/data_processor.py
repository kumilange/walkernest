import time
import json
import pandas as pd
from shapely.geometry import shape
from utils.file import save_gdf_to_geojson, save_graph_to_json, save_network_nodes_to_json
from utils.data_fetcher import fetch_and_normalize_data, generate_query
from utils.geometry import add_boundary, add_centroid, get_geometry_by_objectid, generate_poly_string
from utils.networkx import convert_to_network_nodes, create_network_graph,reduce_graph_size, simplify_edge_geometries, reduce_coordinate_precision, prune_graph, compress_graph_to_json

def process_city(city, geometry):
    # Generate the poly string
    poly_string = generate_poly_string(geometry)

    # Generate the queries
    apartment_query = generate_query(poly_string, [("building", "apartments"), ("building", "residential")])
    supermarket_query = generate_query(poly_string, [("shop", "supermarket"), ("shop", "grocery")])
    park_query = generate_query(poly_string, [("leisure", "park"), ("leisure", "dog_park")])

    # Fetch data from the Overpass API
    apartment_gdf = fetch_and_normalize_data(apartment_query)
    supermarket_gdf = fetch_and_normalize_data(supermarket_query)
    park_gdf = fetch_and_normalize_data(park_query)
    # Save different types of GeoDataFrames to the respective GeoJSON files
    save_gdf_to_geojson(apartment_gdf, city, "apartment")
    save_gdf_to_geojson(supermarket_gdf, city, "supermarket")
    save_gdf_to_geojson(park_gdf, city, "park")

    # Add centroids and boundary to the GeoDataFrames
    apartments = add_centroid(apartment_gdf)
    supermarkets = add_centroid(supermarket_gdf)
    parks = add_boundary(park_gdf)

    # Create and optimize the network graph by reducing size, simplifying edges, reducing precision, and pruning
    G = create_network_graph(shape(geometry))
    G = reduce_graph_size(G)
    G = simplify_edge_geometries(G)
    G = reduce_coordinate_precision(G)
    G = prune_graph(G)
    # Save stringified network graph to JSON file
    graph_json_str = compress_graph_to_json(G)
    save_graph_to_json(graph_json_str, city)

    # Convert GeoDataFrames to network nodes
    supermarket_nnodes = convert_to_network_nodes(G, supermarkets)
    apartment_nnodes = convert_to_network_nodes(G, apartments)
    park_nnodes = convert_to_network_nodes(G, parks, use_centroid=False)
    # Save network nodes to JSON files
    save_network_nodes_to_json(apartment_nnodes, city, "apartment")
    save_network_nodes_to_json(supermarket_nnodes, city, "supermarket")
    save_network_nodes_to_json(park_nnodes, city, "park")

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
    
def process_city_data(csv_data, geojson_data):
    """Process data for each city."""
    if csv_data.empty or not geojson_data:
        print("One or both of the datasets are empty.")
        return

    citylist = {}
    for _, row in csv_data.iterrows():
        city = row['NAME']
        objectid = row['OBJECTID']
        geometry = get_geometry_by_objectid(geojson_data, objectid)
        print(f"\nExecution start for {city}")

        start_time = time.time()
        try:
            process_city(city, geometry)  # Call the main function
            citylist[city.lower()] = {
                "id": objectid,
                "geometry": geometry
            }
        except Exception as e:
            print(f"Error processing {city}: {e}")
        end_time = time.time()

        print(f"Execution time for {city}: {end_time - start_time} seconds\n")

    # Save citylist.json
    try:
        with open('data/citylist.json', 'w') as f:
            json.dump(citylist, f)
    except Exception as e:
        print(f"Error saving citylist.json: {e}")
