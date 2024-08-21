import time
import argparse
import warnings
import pandas as pd
from utils.file import save_to_geojson
from utils.data_fetcher import fetch_and_normalize_data, generate_query
from utils.geometry import add_boundary, add_centroid, drop_additional_geometry_columns, set_centroid
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
    save_to_geojson(park_gdf, city, "park")

    # Add centroids and boundary to the DataFrames
    residentials = add_centroid(residential_gdf)
    supermarkets = add_centroid(supermarket_gdf)
    parks = add_boundary(park_gdf)
    
	# Convert centroids and boundary to network nodes
    G = create_network_graph(bbox)
    supermarket_nnodes = convert_to_network_nodes(G, supermarkets)
    residential_nnodes = convert_to_network_nodes(G, residentials)
    park_nnodes = convert_to_network_nodes(G, parks, use_centroid=False)
    
    # Find suitable residential network nodes
    suitable_residential_nnodes = find_suitable_residential_network_nodes(
        G, residential_nnodes, park_nnodes, supermarket_nnodes, MAX_DISTANCE_PARK, MAX_DISTANCE_SUPERMARKET)
    
    # Retrieve suitable residential areas
    suitable_residential_gdf = retrieve_suitable_residential_areas(residentials, G, suitable_residential_nnodes)

    # Drop additional geometry columns if any
    suitable_residential_gdf = drop_additional_geometry_columns(suitable_residential_gdf)
    
    # Replace the geometry of each feature in the GeoDataFrame with its centroid
    suitable_residential_gdf_for_clusters = set_centroid(suitable_residential_gdf.copy())

	# Save the suitable residential areas as GeoJSON
    save_to_geojson(suitable_residential_gdf, city)
    print(f"Suitable residential areas have been saved to 'geojson/{city.lower()}.geojson'")
    save_to_geojson(suitable_residential_gdf_for_clusters, city, "clusters")
    print(f"Suitable residential areas for clusters have been saved to 'geojson/{city.lower()}_cluster.geojson'")

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