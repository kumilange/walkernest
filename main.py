import time
import argparse
import warnings
import pandas as pd
from utils.file import save_gdf_to_geojson, save_list_to_json
from utils.data_fetcher import fetch_and_normalize_data, generate_query
from utils.geometry import add_boundary, add_centroid, set_centroid
from utils.networkx import convert_to_network_nodes, create_network_graph, find_suitable_apartment_network_nodes, retrieve_suitable_apartments

# Suppress FutureWarning
warnings.simplefilter(action='ignore', category=FutureWarning)

# Constants
MAX_DISTANCE_PARK = 400  # 5 minutes walk in meters
MAX_DISTANCE_SUPERMARKET = 1000  # 12 minutes walk in meters

def main(city, bbox):    
    # Generate the queries
    apartment_query = generate_query(bbox, [("building", "apartments"), ("building", "residential")])
    supermarket_query = generate_query(bbox, [("shop", "supermarket"), ("shop", "grocery")])
    park_query = generate_query(bbox, [("leisure", "park"), ("leisure", "dog_park")])

    # Fetch data from the Overpass API
    apartment_gdf = fetch_and_normalize_data(apartment_query)
    supermarket_gdf = fetch_and_normalize_data(supermarket_query)
    park_gdf = fetch_and_normalize_data(park_query)

    # Save different types of GeoDataFrames to their respective GeoJSON files
    save_gdf_to_geojson(apartment_gdf, city, "apartment")
    save_gdf_to_geojson(supermarket_gdf, city, "supermarket")
    # save_gdf_to_geojson(set_centroid(supermarket_gdf.copy()), city, "supermarket_centroid")
    save_gdf_to_geojson(park_gdf, city, "park")

    # Add centroids and boundary to the DataFrames
    apartments = add_centroid(apartment_gdf)
    supermarkets = add_centroid(supermarket_gdf)
    parks = add_boundary(park_gdf)
    
	# Convert centroids and boundary to network nodes
    G = create_network_graph(bbox)
    apartment_nnodes = convert_to_network_nodes(G, apartments)
    supermarket_nnodes = convert_to_network_nodes(G, supermarkets)
    park_nnodes = convert_to_network_nodes(G, parks, use_centroid=False)

    # Save different types of GeoDataFrames to their respective GeoJSON files
    save_list_to_json(apartment_nnodes, city, "apartment")
    save_list_to_json(supermarket_nnodes, city, "supermarket")
    save_list_to_json(park_nnodes, city, "park")

    return

    # Find suitable apartment network nodes
    suitable_apartment_nnodes = find_suitable_apartment_network_nodes(
        G, apartment_nnodes, park_nnodes, supermarket_nnodes, MAX_DISTANCE_PARK, MAX_DISTANCE_SUPERMARKET)

    # Retrieve suitable apartment areas from network nodes
    suitable_apartment_gdf_with_geoms = retrieve_suitable_apartments(apartments, G, suitable_apartment_nnodes)

	# Save the suitable apartment areas as GeoJSON
    suitable_apartment_gdf = (suitable_apartment_gdf_with_geoms.copy()).drop(columns=['centroid'])
    save_gdf_to_geojson(suitable_apartment_gdf, city, "result")

    # Save the suitable apartment GeoDataFrame for cluster presentation to a GeoJSON file
    suitable_apartment_gdf_with_centroid = set_centroid(suitable_apartment_gdf_with_geoms.copy())
    save_gdf_to_geojson(suitable_apartment_gdf_with_centroid, city, "result_centroid")

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