import time
import argparse
import requests
import osmnx as ox
import numpy as np
import pandas as pd
import networkx as nx
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon, MultiPolygon

def generate_query(bbox, key_value_pairs):
    """
    Generates an Overpass API query based on the bounding box and key-value pairs.
    
    :param bbox: The bounding box for the query.
    :param key_value_pairs: A list of tuples containing key-value pairs for the query.
    :return: A formatted Overpass API query string.
    """
    query = f"[out:json][timeout:25][bbox:{bbox}];\n(\n"
    for key, value in key_value_pairs:
        query += f'  nwr["{key}"="{value}"];\n'
    query += ");\nout geom;\n>;\nout skel qt;\n"
    return query

def fetch_data(query, bbox):
    """
    Fetch data from the Overpass API based on the provided query template and bounding box.

    Parameters:
    query (str): The Overpass API query template with a placeholder for the bounding box.
    bbox (str): The bounding box coordinates in the format "min_lat,min_lon,max_lat,max_lon".

    Returns:
    dict: The JSON response from the Overpass API.
    """
    query = query.format(bbox=bbox)
    overpass_url = "http://overpass-api.de/api/interpreter"
    
    try:
        response = requests.get(overpass_url, params={'data': query})
        response.raise_for_status()
        data = response.json()
        return data
    except requests.RequestException as e:
        print(f"Error fetching data from Overpass API: {e}")
        return None

def normalize_data(data):
    """
    Normalize the fetched data from the Overpass API into a GeoDataFrame.

    Parameters:
    data (dict): The JSON response from the Overpass API.

    Returns:
    gpd.GeoDataFrame: A GeoDataFrame containing the normalized data.
    """
    # A dictionary to store nodes by their ID for lookup
    elements = data['elements']
    nodes = {element['id']: element for element in elements if element['type'] == 'node'}

    # Parse the Overpass API Data
    geometry = []
    properties = []

    for element in elements:
        if element['type'] == 'node':
            # For nodes, create a Point
            point = Point(element['lon'], element['lat'])
            props = element['tags'] if 'tags' in element else {}
            filtered_props = {k: v for k, v in props.items() if k in ['building', 'shop', 'leisure', 'name']}
            if filtered_props:
                geometry.append(point)
                properties.append(filtered_props)
        elif element['type'] == 'way':
            # For ways, create a LineString or Polygon from the node references
            way_nodes = element['nodes']
            way_geometry = [Point(nodes[node_id]['lon'], nodes[node_id]['lat']) for node_id in way_nodes]
            if way_geometry[0] == way_geometry[-1]:
                # If the first and last nodes are the same, it's a closed way (Polygon)
                geom = Polygon(way_geometry)
            else:
                # Otherwise, it's a LineString
                geom = LineString(way_geometry)
            props = element['tags'] if 'tags' in element else {}
            filtered_props = {k: v for k, v in props.items() if k in ['building', 'shop', 'leisure', 'name']}
            if filtered_props:
                geometry.append(geom)
                properties.append(filtered_props)
        elif element['type'] == 'relation':
            # For relations, handle multipolygon
            outer = []
            inners = []
            for member in element['members']:
                member_geometry = [Point(coord['lon'], coord['lat']) for coord in member['geometry']]
                if member['role'] == 'outer':
                    if len(member_geometry) >= 4:  # Ensure at least 4 coordinates
                        outer.append(member_geometry)
                elif member['role'] == 'inner':
                    if len(member_geometry) >= 4:  # Ensure at least 4 coordinates
                        inners.append(member_geometry)
            if outer:
                if len(outer) == 1:
                    geom = Polygon(outer[0], inners)
                else:
                    geom = MultiPolygon([Polygon(o, inners) for o in outer if len(o) >= 4])
                props = element['tags'] if 'tags' in element else {}
                filtered_props = {k: v for k, v in props.items() if k in ['building', 'shop', 'leisure', 'name']}
                if filtered_props:
                    geometry.append(geom)
                    properties.append(filtered_props)

    # Create the GeoDataFrame
    gdf = gpd.GeoDataFrame(properties, geometry=geometry)

    return gdf

def get_centroid(geometry):
    if isinstance(geometry, (Point, Polygon, MultiPolygon)):
        return geometry.centroid
    return None

def add_centroids(gdf):
    gdf = gdf.assign(centroid=gdf['geometry'].apply(get_centroid))
    return gdf

# def add_sampled_points(gdf):    
#     num_points = 10
#     # Sample points within each geometry
#     sampled_points = []
#     for geom in gdf.geometry:
#         minx, miny, maxx, maxy = geom.bounds
#         points = []
#         while len(points) < num_points:
#             random_point = gpd.points_from_xy(
#                 np.random.uniform(minx, maxx, num_points),
#                 np.random.uniform(miny, maxy, num_points)
#             )
#             points.extend([point for point in random_point if geom.contains(point)])
#         sampled_points.append(points[:num_points])
    
#     # Flatten the list of lists and create a new GeoDataFrame
#     sampled_points_flat = [point for sublist in sampled_points for point in sublist]
#     sampled_gdf = gpd.GeoDataFrame(geometry=sampled_points_flat)
#     return sampled_gdf

def convert_to_network_nodes(G, gdf, use_centroid=True):
    if use_centroid:
        # Ensure the 'centroid' column exists
        if 'centroid' not in gdf.columns:
            raise KeyError("The GeoDataFrame does not contain a 'centroid' column.")
        points = gdf['centroid']
    else:
        points = gdf.geometry
    
    # Convert points to network nodes
    return [ox.distance.nearest_nodes(G, point.x, point.y) for point in points]

def find_suitable_residential_network_nodes(G, residential_nnodes, park_nnodes, supermarket_nnodes, max_park_distance, max_supermarket_distance):
    # Create subgraphs for parks and supermarkets within the specified distances
    park_subgraph_nnodes = set()
    for park_nnode in park_nnodes:
        park_subgraph_nnodes.update(nx.ego_graph(G, park_nnode, radius=max_park_distance, distance='length').nodes())
    
    supermarket_subgraph_nnodes = set()
    for supermarket_nnode in supermarket_nnodes:
        supermarket_subgraph_nnodes.update(nx.ego_graph(G, supermarket_nnode, radius=max_supermarket_distance, distance='length').nodes())
    
    # Find the intersection of the park and supermarket subgraphs
    suitable_nnodes = park_subgraph_nnodes.intersection(supermarket_subgraph_nnodes)
    
    # Filter the residential nodes to find suitable residential areas
    suitable_residential_nnodes = [node for node in residential_nnodes if node in suitable_nnodes]
    
    return suitable_residential_nnodes

def main(city, bbox):    
    # Create a network graph of the area
    G = ox.graph_from_place(f"{city}, Colorado, USA", network_type='walk')
    
    # Generate the queries
    residential_query = generate_query(bbox, [("building", "apartments"), ("building", "residential")])
    supermarket_query = generate_query(bbox, [("shop", "supermarket"), ("shop", "grocery")])
    park_query = generate_query(bbox, [("leisure", "park"), ("leisure", "dog_park")]
)
    # Fetch data from the Overpass API
    residential_gdf = normalize_data(fetch_data(residential_query, bbox))
    supermarket_gdf = normalize_data(fetch_data(supermarket_query, bbox))
    park_gdf = normalize_data(fetch_data(park_query, bbox))

    # Write residential, supermarket, park GeoDataFrames to a GeoJSON file
    residential_gdf.to_file(f"geojson/{city}_residential.geojson", driver='GeoJSON')
    supermarket_gdf.to_file(f"geojson/{city}_supermarket.geojson", driver='GeoJSON')
    park_gdf.to_file(f"geojson/{city}_park.geojson", driver='GeoJSON')

    # Add centroids to the DataFrames
    residentials = add_centroids(residential_gdf)
    supermarkets = add_centroids(supermarket_gdf)
    parks = add_centroids(park_gdf)
    
    # Convert centroids to network nodes
    park_nnodes = convert_to_network_nodes(G, parks)
    supermarket_nnodes = convert_to_network_nodes(G, supermarkets)
    residential_nnodes = convert_to_network_nodes(G, residentials)
    
    # Define distance thresholds
    max_park_distance_meters = 400  # 5 minutes walk in meters
    max_supermarket_distance_meters = 1000  # 12 minutes walk in meters

    # Find suitable residential areas in network nodes
    suitable_residential_nnodes = find_suitable_residential_network_nodes(G, residential_nnodes, park_nnodes, supermarket_nnodes, max_park_distance_meters, max_supermarket_distance_meters)
    
    # Retrieve the GeoDataFrame of suitable residential areas
    suitable_residential_gdf = residentials[residentials['centroid'].apply(lambda x: ox.distance.nearest_nodes(G, x.x, x.y) in suitable_residential_nnodes)]

	# Drop additional geometry columns if any
    geometry_columns = suitable_residential_gdf.geometry.name
    for col in suitable_residential_gdf.columns:
        if col != geometry_columns and suitable_residential_gdf[col].dtype == 'geometry':
            suitable_residential_gdf = suitable_residential_gdf.drop(columns=[col])
    
	# Output the suitable residential areas as GeoJSON
    suitable_residential_gdf.to_file(f"geojson/{city}.geojson", driver='GeoJSON')
    print(f"Suitable residential areas have been saved to '{city}.geojson'")

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
            print(f"Execution time for {city}: {end_time - start_time} seconds")
    else:
        print("Please provide the path to the CSV file using --csv argument.")