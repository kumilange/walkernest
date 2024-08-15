import time
import argparse
import warnings
import osmnx as ox
import pandas as pd
from data_fetcher import fetch_and_normalize_data, generate_query
from file_utils import save_to_geojson
from generate import add_centroids
from geometry_utils import add_boundary, drop_additional_geometry_columns
from network_utils import convert_to_network_nodes, find_suitable_residential_network_nodes, retrieve_suitable_residential_areas

# Suppress FutureWarning
warnings.simplefilter(action='ignore', category=FutureWarning)

def main(city, bbox):    
    # Generate the queries
    residential_query = generate_query(bbox, [("building", "apartments"), ("building", "residential")])
    supermarket_query = generate_query(bbox, [("shop", "supermarket"), ("shop", "grocery")])
    park_query = generate_query(bbox, [("leisure", "park"), ("leisure", "dog_park")])

    # Fetch data from the Overpass API
    residential_gdf = fetch_and_normalize_data(residential_query)
    supermarket_gdf = fetch_and_normalize_data(supermarket_query)
    park_gdf = fetch_and_normalize_data(park_query)

    # Save GeoDataFrames to GeoJSON files
    save_to_geojson(residential_gdf, city, "residential")
    save_to_geojson(supermarket_gdf, city, "supermarket")
    save_to_geojson(park_gdf, city, "park")

    # Add centroids to the DataFrames
    residentials = add_centroids(residential_gdf)
    supermarkets = add_centroids(supermarket_gdf)
    parks = add_boundary(park_gdf)
    
		# Convert centroids to network nodes
    south, west, north, east = map(float, bbox.split(','))
    G = ox.graph_from_bbox(bbox=(north, south, east, west), network_type='walk') # Create a network graph of the area
    supermarket_nnodes = convert_to_network_nodes(G, supermarkets)
    residential_nnodes = convert_to_network_nodes(G, residentials)
    park_nnodes = convert_to_network_nodes(G, parks, use_centroid=False)
    
    # Find suitable residential network nodes
    max_park_distance = 400  # 5 minutes walk in meters
    max_supermarket_distance = 1000  # 12 minutes walk in meters
    suitable_residential_nnodes = find_suitable_residential_network_nodes(
        G, residential_nnodes, park_nnodes, supermarket_nnodes, max_park_distance, max_supermarket_distance)
    
    # Retrieve suitable residential areas
    suitable_residential_gdf = retrieve_suitable_residential_areas(residentials, G, suitable_residential_nnodes)

    # Drop additional geometry columns if any
    suitable_residential_gdf = drop_additional_geometry_columns(suitable_residential_gdf)
    
		# Output the suitable residential areas as GeoJSON
    save_to_geojson(suitable_residential_gdf, city)
    print(f"Suitable residential areas have been saved to 'geojson/{city}.geojson'")

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
            main(city, bbox)
            end_time = time.time()
            print(f"Execution time for {city}: {end_time - start_time} seconds\n")
    else:
        print("Please provide the path to the CSV file using --csv argument.")