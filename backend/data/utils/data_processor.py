import time
import json
import pandas as pd
from shapely.geometry import shape
from utils.file import save_gdf_to_geojson, save_graph_to_json, save_network_nodes_to_json
from utils.data_fetcher import fetch_and_normalize_data, generate_query
from utils.geometry import add_boundary, add_centroid, get_geometry_by_objectid, generate_poly_string
from utils.networkx import convert_to_network_nodes, create_network_graph,reduce_graph_size, simplify_edge_geometries, reduce_coordinate_precision, prune_graph, compress_graph_to_json

amenities = {
    "apartment": [("building", "apartments"), ("building", "residential")],
    "park": [("leisure", "park"), ("leisure", "dog_park")],
    "supermarket": [("shop", "supermarket"), ("shop", "grocery")],
    "cafe": [("amenity", "cafe")]
}

def process_city(city, geometry):
    # Create and optimize the network graph by reducing size, simplifying edges, reducing precision, and pruning
    G = create_network_graph(shape(geometry))
    G = reduce_graph_size(G)
    G = simplify_edge_geometries(G)
    G = reduce_coordinate_precision(G)
    G = prune_graph(G)
    # Save stringified network graph to JSON file
    graph_json_str = compress_graph_to_json(G)
    save_graph_to_json(graph_json_str, city)

    # Generate the poly string
    poly_string = generate_poly_string(geometry)

    # Process each amenity data
    for amenity, query_params in amenities.items():
        query = generate_query(poly_string, query_params)
        gdf = fetch_and_normalize_data(query)
        # Save the GeoDataFrame to a GeoJSON file
        save_gdf_to_geojson(gdf, city, amenity)

        # Add centroids and boundary to the GeoDataFrame
        if amenity == "park":
            gdf = add_boundary(gdf)
        else:
            gdf = add_centroid(gdf)
        # Convert the GeoDataFrame to network nodes
        use_centroid = amenity != "park"
        nnodes = convert_to_network_nodes(G, gdf, use_centroid=use_centroid)
        # Save the network nodes to a JSON file
        save_network_nodes_to_json(nnodes, city, amenity)

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
    
def process_city_data(csv_data, geojson_data, output_file_path):
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
        with open(output_file_path, 'w') as f:
            json.dump(citylist, f)
    except Exception as e:
        print(f"Error saving citylist.json: {e}")
