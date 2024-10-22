import time
import argparse
import warnings
import pandas as pd
from utils.file import save_to_geojson
from utils.data_fetcher import fetch_and_normalize_data, generate_query
from utils.geometry import add_boundary, add_centroid, set_centroid
from utils.networkx import convert_to_network_nodes, create_network_graph, find_suitable_residential_network_nodes, retrieve_suitable_residential_areas

# Suppress FutureWarning
warnings.simplefilter(action='ignore', category=FutureWarning)

# Constants
MAX_DISTANCE_PARK = 400  # 5 minutes walk in meters
MAX_DISTANCE_SUPERMARKET = 1000  # 12 minutes walk in meters

def main(city, bbox):    
    # Generate the queries
    residential_query = generate_query(bbox, [("building", "apartments"), ("building", "residential")])
    supermarket_query = generate_query(bbox, [("shop", "supermarket"), ("shop", "grocery")])
    park_query = generate_query(bbox, [("leisure", "park"), ("leisure", "dog_park")])

    # Fetch data from the Overpass API
    residential_gdf = fetch_and_normalize_data(residential_query)
    supermarket_gdf = fetch_and_normalize_data(supermarket_query)
    park_gdf = fetch_and_normalize_data(park_query)

    # Save different types of GeoDataFrames to their respective GeoJSON files
    save_to_geojson(residential_gdf, city, "residential")
    save_to_geojson(supermarket_gdf, city, "supermarket")
    save_to_geojson(set_centroid(supermarket_gdf.copy()), city, "supermarket_centroid")
    save_to_geojson(park_gdf, city, "park")

    # Add centroids and boundary to the DataFrames
    residentials = add_centroid(residential_gdf)
    supermarkets = add_centroid(supermarket_gdf)
    parks = add_boundary(park_gdf)
    
	# Convert centroids and boundary to network nodes
    G = create_network_graph(bbox)
    residential_nnodes = convert_to_network_nodes(G, residentials)
    supermarket_nnodes = convert_to_network_nodes(G, supermarkets)
    park_nnodes = convert_to_network_nodes(G, parks, use_centroid=False)
    
    # Find suitable residential network nodes
    suitable_residential_nnodes = find_suitable_residential_network_nodes(
        G, residential_nnodes, park_nnodes, supermarket_nnodes, MAX_DISTANCE_PARK, MAX_DISTANCE_SUPERMARKET)

    # Retrieve suitable residential areas from network nodes
    suitable_residential_gdf_with_geoms = retrieve_suitable_residential_areas(residentials, G, suitable_residential_nnodes)

	# Save the suitable residential areas as GeoJSON
    suitable_residential_gdf = (suitable_residential_gdf_with_geoms.copy()).drop(columns=['centroid'])
    save_to_geojson(suitable_residential_gdf, city, "result")

    # Save the suitable residential GeoDataFrame for cluster presentation to a GeoJSON file
    suitable_residential_gdf_with_centroid = set_centroid(suitable_residential_gdf_with_geoms.copy())
    save_to_geojson(suitable_residential_gdf_with_centroid, city, "result_centroid")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process city and bbox for main function')
    parser.add_argument('--csv', type=str, help='Path to the CSV file containing city and bbox parameters')
    args = parser.parse_args()

    if args.csv:
        df = pd.read_csv(args.csv)
        for index, row in df.iterrows():
            city = row['city']
            bbox = row['bbox']
            print(f"Execution start for {city} with Bounding Box {bbox}")
            start_time = time.time()
            main(city, bbox) # Call the main function
            end_time = time.time()
            print(f"Execution time for {city}: {end_time - start_time} seconds\n")
    else:
        print("Please provide the path to the CSV file using --csv argument.")