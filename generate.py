import time
import argparse
import requests
import osmnx as ox
import numpy as np
import pandas as pd
import networkx as nx
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon, MultiPolygon, MultiLineString

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

def add_boundary(gdf):
    """
    Set the geometry to the boundary of each geometry in the GeoDataFrame.
    """
    def get_boundary(geometry):
        if isinstance(geometry, Polygon):
            return geometry.boundary
        elif isinstance(geometry, Point):
            return geometry
        elif isinstance(geometry, LineString):
            return geometry
        elif isinstance(geometry, (MultiPolygon, MultiLineString)):
            return [part.boundary for part in geometry.geoms]
        else:
            raise TypeError("Unsupported geometry type")

    gdf['geometry'] = gdf.geometry.apply(get_boundary)
    return gdf

def convert_to_network_nodes(G, gdf, use_centroid=True):
    if use_centroid:
        # Ensure the 'centroid' column exists
        if 'centroid' not in gdf.columns:
            raise KeyError("The GeoDataFrame does not contain a 'centroid' column.")
        points = gdf['centroid']
        return [ox.distance.nearest_nodes(G, point.x, point.y) for point in points]
    else:
        nodes = []
        for _, row in gdf.iterrows():
            geometry = row['geometry']
            if isinstance(geometry, Point):
                # It's a Point geometry
                nodes.append(ox.distance.nearest_nodes(G, geometry.x, geometry.y))
            elif isinstance(geometry, (Polygon, LineString)):
                # It's a Polygon or LineString geometry, use the boundary
                for point in geometry.coords:
                    nodes.append(ox.distance.nearest_nodes(G, point[0], point[1]))
            elif isinstance(geometry, (MultiPolygon, MultiLineString)):
                # It's a MultiPolygon or MultiLineString geometry, use the boundaries of each part
                for part in geometry.geoms:
                    for point in part.boundary.coords:
                        nodes.append(ox.distance.nearest_nodes(G, point[0], point[1]))
            else:
                raise TypeError("Unsupported geometry type")
        return nodes

def find_suitable_residential_network_nodes(G, residential_nnodes, park_nnodes, supermarket_nnodes, max_park_distance, max_supermarket_distance):
    # Create subgraphs for parks and supermarkets within the specified distances
    park_subgraph_nnodes = set()
    for park_nnode in park_nnodes:
        park_subgraph_nnodes.update(nx.ego_graph(G, park_nnode, radius=max_park_distance, distance='length').nodes())
    
    supermarket_subgraph_nnodes = set()
    for supermarket_nnode in supermarket_nnodes:
        supermarket_subgraph_nnodes.update(nx.ego_graph(G, supermarket_nnode, radius=max_supermarket_distance, distance='length').nodes())
    
    # Filter the residential nodes to find those that intersect both park and supermarket subgraphs
    suitable_residential_nnodes = [
        node for node in residential_nnodes 
        if node in park_subgraph_nnodes and node in supermarket_subgraph_nnodes
    ]
    
    # Convert the sets to GeoDataFrames for saving to file
    park_subgraph_gdf = gpd.GeoDataFrame(geometry=[Point(G.nodes[node]['x'], G.nodes[node]['y']) for node in park_subgraph_nnodes], crs="EPSG:4326")
    supermarket_subgraph_gdf = gpd.GeoDataFrame(geometry=[Point(G.nodes[node]['x'], G.nodes[node]['y']) for node in supermarket_subgraph_nnodes], crs="EPSG:4326")
    
    # Save the GeoDataFrames to files
    park_subgraph_gdf.to_file(f"park_subgraph_nnodes.geojson", driver='GeoJSON')
    supermarket_subgraph_gdf.to_file(f"supermarket_subgraph_nnodes.geojson", driver='GeoJSON')

    return suitable_residential_nnodes

def main(city, bbox):
    # Parse the bounding box coordinates
    south, west, north, east = map(float, bbox.split(','))
    # Create a network graph of the area
    G = ox.graph_from_bbox(bbox=(north, south, east, west), network_type='walk')
    
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
    parks = add_boundary(park_gdf)
    
    # Convert centroids to network nodes
    supermarket_nnodes = convert_to_network_nodes(G, supermarkets)
    residential_nnodes = convert_to_network_nodes(G, residentials)
    park_nnodes = convert_to_network_nodes(G, parks, use_centroid=False)
    
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
            print(f"Execution time for {city}: {end_time - start_time} seconds")
    else:
        print("Please provide the path to the CSV file using --csv argument.")