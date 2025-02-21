import numpy as np
import osmnx as ox
import networkx as nx

def deserialize_graph(graph_json) -> nx.MultiDiGraph:
    """Deserialize a graph JSON into a network graph."""
    return nx.node_link_graph(graph_json, edges="links")

def find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs):
    """Find suitable apartment network nodes based on distance constraints to amenities."""
    if not amenity_kwargs: 
        return apartment_nnodes

    # Calculate nodes within max distance of each amenity type, returning dicts mapping node IDs to shortest path distances
    matched_nodes = [
        nx.multi_source_dijkstra_path_length(G, nodes, cutoff=max_distance, weight="length")
        for nodes, max_distance in amenity_kwargs.values()
        if nodes and max_distance
    ]

    # Keep only apartment nodes that are within range of every amenity type by checking presence in all distance dicts
    suitable_apartment_nnodes = [
        node for node in apartment_nnodes
        if all(node in nodes for nodes in matched_nodes)
    ]

    return suitable_apartment_nnodes

def retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes):
    """Retrieve suitable apartments based on proximity to specified network nodes."""
    try:
        centroids = np.array([(c.x, c.y) for c in apartment_gdf['centroid']])
        # Get an array of closest network nodes, one for each apartment's centroid coordinates
        nearest_nodes = ox.distance.nearest_nodes(G, X=centroids[:, 0], Y=centroids[:, 1])
        # Filter apartments whose nearest node is in the suitable nodes
        suitable_apartments = apartment_gdf[np.isin(nearest_nodes, suitable_apartment_nnodes)].copy()

        return suitable_apartments
    except Exception as e:
        raise ValueError(f"Error retrieving suitable apartments: {e}")
