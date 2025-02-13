import numpy as np
import osmnx as ox
import networkx as nx

def deserialize_graph(graph_json) -> nx.MultiDiGraph:
    """Deserialize a graph JSON into a network graph."""
    G = nx.node_link_graph(graph_json, edges="links")
    return G

def find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs):
    """Find suitable apartment network nodes based on distance constraints to amenities."""
    if not amenity_kwargs: 
        return apartment_nnodes

    matched_nodes = []

    for _, (nodes, max_distance) in amenity_kwargs.items():
        if nodes is not None and max_distance is not None:
            # Get a dictionary of node with shortest path lengths {nodeid: length} to nearest network nodes
            shortest_node_dict = nx.multi_source_dijkstra_path_length(G, nodes, cutoff=max_distance, weight='length')
            matched_nodes.append(shortest_node_dict) 

    # Filter and find suitable apartment network nodes that are within specified distances from all passed amenities
    suitable_apartment_nnodes = [
        node for node in apartment_nnodes
        # Check if the node is present in all dictionaries in the matched_nodes.
        if all(node in nodes for nodes in matched_nodes)
    ]

    return suitable_apartment_nnodes

# def find_suitable_apartment_network_nodes(G, apartment_nnodes, park_nnodes, supermarket_nnodes, max_park_distance, max_supermarket_distance):
#     """
#     Find suitable apartment network nodes that are within specified distances from both park and supermarket nodes.

#     Parameters:
#     G (networkx.Graph): The graph representing the network.
#     apartment_nnodes (list): List of apartment network nodes.
#     park_nnodes (list): List of park network nodes.
#     supermarket_nnodes (list): List of supermarket network nodes.
#     max_park_distance (float): Maximum distance from park nodes to consider.
#     max_supermarket_distance (float): Maximum distance from supermarket nodes to consider.

#     Returns:
#     list: List of suitable apartment network nodes within the specified distances from both park and supermarket nodes.
#     """
#     # Create subgraphs for parks and supermarkets within the specified distances
#     park_subgraph_nnodes = set()
#     for park_nnode in park_nnodes:
#         park_subgraph_nnodes.update(nx.ego_graph(G, park_nnode, radius=max_park_distance, distance='length').nodes())

#     supermarket_subgraph_nnodes = set()
#     for supermarket_nnode in supermarket_nnodes:
#         supermarket_subgraph_nnodes.update(nx.ego_graph(G, supermarket_nnode, radius=max_supermarket_distance, distance='length').nodes())
    
#     # Find suitable apartment network nodes
#     apartment_nnodes_set = set(apartment_nnodes)
#     suitable_apartment_nnodes = list(apartment_nnodes_set & park_subgraph_nnodes & supermarket_subgraph_nnodes)

#     return suitable_apartment_nnodes

def retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes):
    """Retrieve suitable apartments based on proximity to specified network nodes."""
    try:
        centroids = np.array([(c.x, c.y) for c in apartment_gdf['centroid']])
        nearest_nodes = ox.distance.nearest_nodes(G, X=centroids[:, 0], Y=centroids[:, 1])

        suitable_nodes_set = set(suitable_apartment_nnodes)
        # Create a boolean array indicating whether each nearest node is in the suitable nodes set
        is_suitable = np.isin(nearest_nodes, list(suitable_nodes_set))
        # Filter apartment_gdf based on whether their nearest node is in the suitable nodes set(True)
        suitable_apartments = apartment_gdf.loc[is_suitable].copy()

        return suitable_apartments
    except Exception as e:
        raise ValueError(f"Error retrieving suitable apartments: {e}")
