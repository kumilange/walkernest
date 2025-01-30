import json
import numpy as np
import osmnx as ox
import networkx as nx
from shapely.geometry import shape

def deserialize_graph(graph_json) -> nx.MultiDiGraph:
    # If the input is a dictionary, use it directly; otherwise, parse the JSON string
    if isinstance(graph_json, str):
        graph_dict = json.loads(graph_json)
    elif isinstance(graph_json, dict):
        graph_dict = graph_json
    else:
        raise TypeError("The input must be a JSON string or a dictionary")
    
    # Convert shapely geometries for nodes and links in one pass
    def restore_geometry(item):
        """Helper function to restore shapely geometry."""
        if 'geometry' in item and isinstance(item['geometry'], dict):
            item['geometry'] = shape(item['geometry'])
        return item

    # Use list comprehensions for faster iteration
    graph_dict['nodes'] = [restore_geometry(node) for node in graph_dict['nodes']]
    graph_dict['links'] = [restore_geometry(link) for link in graph_dict['links']]

    # Convert the dictionary back to a MultiDiGraph
    G = nx.node_link_graph(graph_dict, edges="links")
    
    return G

def find_suitable_apartment_network_nodes(G, apartment_nnodes, **kwargs):
    """
    Find apartments within the specified distances to various amenities.

    Parameters:
    - G: The networkx graph representing the area.
    - apartment_nnodes: A list of apartment nodes.
    - kwargs: A dictionary where values are tuples of (nodes, max_distance).

    Returns:
    - A list of apartments that meet the distance criteria.
    """
    # If no dictionary is provided, return all apartments
    if not kwargs:
        return apartment_nnodes

    distance_constraints = []

    # Precompute distances from each node if parameters are provided
    for _, (nodes, max_distance) in kwargs.items():
        if nodes is not None and max_distance is not None:
            distances = nx.multi_source_dijkstra_path_length(G, nodes, cutoff=max_distance, weight='length')
            distance_constraints.append(distances)

    # Find suitable apartment nodes that meet all distance constraints
    suitable_apartment_nnodes = [
        node for node in apartment_nnodes
        if all(node in distances for distances in distance_constraints)
    ]

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
        # Convert the list of suitable nodes to a set for faster lookups
        suitable_nodes_set = set(suitable_apartment_nnodes)

        # Extract centroid coordinates as a 2D NumPy array
        centroids = np.array([(c.x, c.y) for c in apartments['centroid']])

        # Ensure centroids array is valid
        if centroids.ndim != 2 or centroids.shape[1] != 2:
            raise ValueError("Centroids array must be 2-dimensional with shape (n, 2)")

        # Calculate nearest nodes for all centroids in one vectorized operation
        nearest_nodes = ox.distance.nearest_nodes(G, X=centroids[:, 0], Y=centroids[:, 1])

        # Filter apartments based on whether their nearest node is in the suitable set
        is_suitable = np.isin(nearest_nodes, list(suitable_nodes_set))
        suitable_apartments = apartments.loc[is_suitable].copy()

        return suitable_apartments
    except Exception as e:
        raise ValueError(f"Error retrieving suitable apartments: {e}")
