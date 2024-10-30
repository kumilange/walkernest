import json
import numpy as np
import osmnx as ox
import networkx as nx
from shapely.geometry import shape, Point, LineString, MultiLineString

def create_network_graph(bbox, network_type='walk'):
    """
    Create a graph from a bounding box string.

    Parameters:
    bbox (str): The bounding box string in the format "south,west,north,east".
    network_type (str): The type of network to create (default is 'walk').

    Returns:
    networkx.Graph: The graph representing the road network within the bounding box.
    """
    south, west, north, east = map(float, bbox.split(','))
    return ox.graph_from_bbox(north, south, east, west, network_type=network_type)

def deserialize_graph(graph_json_str):    
    # Ensure the input is a JSON string
    if isinstance(graph_json_str, dict):
        graph_json_str = json.dumps(graph_json_str)

    # Deserialize the JSON string to a dictionary
    graph_data = json.loads(graph_json_str)

    # Convert GeoJSON-like dictionaries back to shapely geometries
    for node in graph_data['nodes']:
        if 'geometry' in node:
            node['geometry'] = shape(node['geometry'])
    for link in graph_data['links']:
        if 'geometry' in link:
            link['geometry'] = shape(link['geometry'])

    # Convert the dictionary to a MultiDiGraph
    G = nx.readwrite.json_graph.node_link_graph(graph_data, multigraph=True)

    return G
  
def get_equally_distant_points(coords):
    total_points = len(coords)

    if total_points < 10:
        num_points = total_points
    elif 10 <= total_points < 100:
        num_points = 10
    else:
        num_points = total_points // 10

    if total_points < num_points:
        raise ValueError("Not enough points to select from")
    
    step = total_points // num_points
    return [coords[i * step] for i in range(num_points)]

def convert_to_network_nodes(G, gdf, use_centroid=True):
    def add_nearest_nodes(geometry, nodes):
        if isinstance(geometry, Point):
            nodes.add(ox.distance.nearest_nodes(G, geometry.x, geometry.y))
        elif isinstance(geometry, (LineString)):
            selected_points = get_equally_distant_points(list(geometry.coords))
            for point in selected_points:
                nodes.add(ox.distance.nearest_nodes(G, point[0], point[1]))
        elif isinstance(geometry, (MultiLineString)):
            for part in geometry.geoms:
                add_nearest_nodes(part, nodes)
        else:
            raise TypeError("Unsupported geometry type")

    if use_centroid:
        # Ensure the 'centroid' column exists
        if 'centroid' not in gdf.columns:
            raise KeyError("The GeoDataFrame does not contain a 'centroid' column.")
        points = gdf['centroid']
        # Use a set to store unique nodes
        nodes = {ox.distance.nearest_nodes(G, point.x, point.y) for point in points}
    else:
        nodes = set()  # Use a set to store unique nodes
        for geometry in gdf['boundary']:
            add_nearest_nodes(geometry, nodes)

    return list(nodes)  # Convert the set back to a list before returning

def find_suitable_apartment_network_nodes(G, apartment_nnodes, park_nnodes, supermarket_nnodes, max_park_distance, max_supermarket_distance):
    """
    Find suitable apartment network nodes that are within specified distances from both park and supermarket nodes.

    Parameters:
    G (networkx.Graph): The graph representing the network.
    apartment_nnodes (list): List of apartment network nodes.
    park_nnodes (list): List of park network nodes.
    supermarket_nnodes (list): List of supermarket network nodes.
    max_park_distance (float): Maximum distance from park nodes to consider.
    max_supermarket_distance (float): Maximum distance from supermarket nodes to consider.

    Returns:
    list: List of suitable apartment network nodes within the specified distances from both park and supermarket nodes.
    """
    # Create subgraphs for parks and supermarkets within the specified distances
    park_subgraph_nnodes = set()
    for park_nnode in park_nnodes:
        park_subgraph_nnodes.update(nx.ego_graph(G, park_nnode, radius=max_park_distance, distance='length').nodes())

    supermarket_subgraph_nnodes = set()
    for supermarket_nnode in supermarket_nnodes:
        supermarket_subgraph_nnodes.update(nx.ego_graph(G, supermarket_nnode, radius=max_supermarket_distance, distance='length').nodes())
    
    # Find suitable apartment network nodes
    apartment_nnodes_set = set(apartment_nnodes)
    suitable_apartment_nnodes = list(apartment_nnodes_set & park_subgraph_nnodes & supermarket_subgraph_nnodes)

    return suitable_apartment_nnodes

def retrieve_suitable_apartments(apartments, G, suitable_apartment_nnodes):
    """
    Retrieve suitable apartments based on their centroids and nearest network nodes.

    Parameters:
    apartments (gpd.GeoDataFrame): GeoDataFrame of apartments.
    G (networkx.Graph): The graph representing the road network.
    suitable_apartment_nnodes (list): List of suitable apartment network nodes.

    Returns:
    gpd.GeoDataFrame: Filtered GeoDataFrame of suitable apartments.
    """
    try:
        # Extract centroid coordinates
        centroids = np.array([(geom.x, geom.y) for geom in apartments['centroid']])

        # Ensure centroids array is 2-dimensional
        if centroids.ndim != 2 or centroids.shape[1] != 2:
            raise ValueError("Centroids array must be 2-dimensional with shape (n, 2)")

        # Calculate nearest nodes for all centroids
        nearest_nodes = ox.distance.nearest_nodes(G, centroids[:, 0], centroids[:, 1])

        apartments['nearest_node'] = nearest_nodes
        filtered_apartments = apartments[apartments['nearest_node'].isin(suitable_apartment_nnodes)]
        filtered_apartments = filtered_apartments.drop(columns=['nearest_node'])

        return filtered_apartments
    except Exception as e:
        raise ValueError(f"Error retrieving suitable apartments: {e}")
