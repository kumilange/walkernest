import time
import json
import argparse
import warnings
import pandas as pd
from shapely.geometry import shape
from utils.file import save_gdf_to_geojson, save_graph_to_json, save_list_to_json
from utils.data_fetcher import fetch_and_normalize_data, generate_query
from utils.geometry import add_boundary, add_centroid, get_geometry_by_objectid, generate_poly_string, set_centroid
from utils.networkx import convert_to_network_nodes, create_network_graph, find_suitable_apartment_network_nodes, retrieve_suitable_apartments

# Suppress FutureWarning
warnings.simplefilter(action='ignore', category=FutureWarning)

# Constants
MAX_DISTANCE_PARK = 400  # 5 minutes walk in meters
MAX_DISTANCE_SUPERMARKET = 1000  # 12 minutes walk in meters

def main(city, geometry):
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
    # Save different types of GeoDataFrames to their respective GeoJSON files
    save_gdf_to_geojson(apartment_gdf, city, "apartment")
    save_gdf_to_geojson(supermarket_gdf, city, "supermarket")
    save_gdf_to_geojson(park_gdf, city, "park")

	# Convert centroids and boundary to network nodes
    G = create_network_graph(shape(geometry))
    # Save network graph to JSON file
    save_graph_to_json(G, city)

    # Add centroids and boundary to the DataFrames
    apartments = add_centroid(apartment_gdf)
    supermarkets = add_centroid(supermarket_gdf)
    parks = add_boundary(park_gdf)
    # Convert GeoDataFrames to network nodes
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
    parser.add_argument('--csv', type=str, required=True, help='Path to the CSV file')
    parser.add_argument('--geojson', type=str, required=True, help='Path to the GeoJSON file')
    args = parser.parse_args()

    # Read CSV file
    csv_data = pd.read_csv(args.csv)
    # Read GeoJSON file as JSON
    with open(args.geojson, 'r') as f:
        geojson_data = json.load(f)
    
    # Check if both csv_data and geojson_data exist
    if not csv_data.empty and geojson_data:
        citylist = {}
        for index, row in csv_data.iterrows():
            city = row['NAME']
            objectid = row['OBJECTID'] 
            try:
                geometry = get_geometry_by_objectid(geojson_data, objectid)
                print(f"Execution start for {city}")
                start_time = time.time()
                main(city, geometry)  # Call the main function
                citylist[city.lower()] = {
                    "id": objectid,
                    "geometry": geometry
                }
                end_time = time.time()
                print(f"Execution time for {city}: {end_time - start_time} seconds\n")
            except ValueError as e:
                print(f"Skipping {city} due to error: {e}")
        # save citylist.json
        with open('data/citylist.json', 'w') as f:
            json.dump(citylist, f)
    else:
        print("One or both of the datasets are empty.")