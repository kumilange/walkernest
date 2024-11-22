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
    G = nx.node_link_graph(graph_dict)
    
    return G

def find_suitable_apartment_network_nodes(G, apartment_nnodes, park_nnodes, supermarket_nnodes, max_park_distance, max_supermarket_distance):
    """
    Optimized function to find suitable apartment network nodes within specified distances from park and supermarket nodes.

    Explanation of Optimizations:
    multi_source_dijkstra_path_length drastically reduces the number of calculations by finding shortest paths from all park or supermarket nodes at once, instead of generating separate subgraphs.
    Cutoff Parameter: Setting cutoff to max_park_distance and max_supermarket_distance prevents unnecessary distance calculations, limiting search space to the needed distances.
    This approach should significantly improve the execution time by reducing the number of graph traversals and focusing only on relevant nodes and edges.
    """
    # Step 1: Precompute distances from all park nodes
    park_distances = nx.multi_source_dijkstra_path_length(G, park_nnodes, cutoff=max_park_distance, weight='length')

    # Step 2: Precompute distances from all supermarket nodes
    supermarket_distances = nx.multi_source_dijkstra_path_length(G, supermarket_nnodes, cutoff=max_supermarket_distance, weight='length')

    # Step 3: Find suitable apartment nodes within both distance constraints
    suitable_apartment_nnodes = [
        node for node in apartment_nnodes
        if node in park_distances and node in supermarket_distances
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
