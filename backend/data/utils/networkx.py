import json
import numpy as np
import osmnx as ox
import networkx as nx
from shapely import MultiPolygon, Polygon
from shapely.geometry import shape, Point, LineString, MultiLineString

def create_network_graph(geometry):
    """
    Create a network graph from a given geometry (Polygon or MultiPolygon).

    Parameters:
    geometry (Polygon or MultiPolygon): The geometry to create the network graph from.

    Returns:
    networkx.MultiDiGraph: The created network graph.
    """
    if isinstance(geometry, (Polygon, MultiPolygon)):
        G = ox.graph_from_polygon(geometry, network_type='walk')
    else:
        raise TypeError("Unsupported geometry type")

    return G

def convert_to_network_nodes(G, gdf, use_centroid=True):
    def add_nearest_nodes(geometry, nodes):
        if isinstance(geometry, Point):
            nodes.add(ox.distance.nearest_nodes(G, geometry.x, geometry.y))
        elif isinstance(geometry, (LineString)):
            all_points = list(geometry.coords)
            for point in all_points:
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

def reduce_graph_size(G: nx.MultiDiGraph) -> nx.MultiDiGraph:
    """
    Reduces the size of a MultiDiGraph by removing specific attributes: 'name' and 'highway'.

    Parameters:
    G (nx.MultiDiGraph): The input graph.

    Returns:
    nx.MultiDiGraph: The reduced graph.
    """
    remove_attributes = ['name', 'highway', 'maxspeed', 'lanes', 'service', 'ref', 'street_count', 'oimid', 'oneway', 'reversed', 'geometry', 'key']
    # Remove 'name' and 'highway' attributes from nodes
    for _, node_data in G.nodes(data=True):
        for attr in remove_attributes:
            node_data.pop(attr, None)  # Remove if the attribute exists

    # Remove 'name' and 'highway' attributes from edges
    for _, _, edge_data in G.edges(data=True):
        for attr in remove_attributes:
            edge_data.pop(attr, None)  # Remove if the attribute exists

    return G

def simplify_edge_geometries(G: nx.MultiDiGraph, tolerance: float = 0.001) -> nx.MultiDiGraph:
    """
    Simplifies edge geometries in the graph to reduce size.

    Parameters:
    G (nx.MultiDiGraph): The input graph.
    tolerance (float): The simplification tolerance.

    Returns:
    nx.MultiDiGraph: The graph with simplified geometries.
    """
    for _, _, edge_data in G.edges(data=True):
        if 'geometry' in edge_data and isinstance(edge_data['geometry'], (LineString, MultiLineString)):
            edge_data['geometry'] = edge_data['geometry'].simplify(tolerance)

    return G

def reduce_coordinate_precision(G: nx.MultiDiGraph, decimals: int = 5) -> nx.MultiDiGraph:
    """
    Reduces coordinate precision in the graph to save space.

    Parameters:
    G (nx.MultiDiGraph): The input graph.
    decimals (int): The number of decimal places to keep.

    Returns:
    nx.MultiDiGraph: The graph with reduced coordinate precision.
    """
    for _, node_data in G.nodes(data=True):
        if 'x' in node_data and 'y' in node_data:
            node_data['x'] = round(node_data['x'], decimals)
            node_data['y'] = round(node_data['y'], decimals)

    for _, _, edge_data in G.edges(data=True):
        if 'geometry' in edge_data:
            coords = edge_data['geometry'].coords
            edge_data['geometry'] = LineString([(round(x, decimals), round(y, decimals)) for x, y in coords])

    return G

def prune_graph(G: nx.MultiDiGraph, min_edge_length: float = 5.0) -> nx.MultiDiGraph:
    """
    Prunes the graph by removing short edges or isolated nodes.

    Parameters:
    G (nx.MultiDiGraph): The input graph.
    min_edge_length (float): Minimum edge length to retain.

    Returns:
    nx.MultiDiGraph: The pruned graph.
    """
    edges_to_remove = [(u, v, k) for u, v, k, d in G.edges(keys=True, data=True) if d.get('length', 0) < min_edge_length]
    G.remove_edges_from(edges_to_remove)

    # Remove isolated nodes
    isolated_nodes = [node for node in G.nodes if G.degree(node) == 0]
    G.remove_nodes_from(isolated_nodes)

    return G

def compress_graph_to_json(G: nx.MultiDiGraph):
    # Convert the graph to a dictionary
    graph_dict = nx.node_link_data(G)
    
    # Convert LineString objects to a list of coordinates
    for link in graph_dict['links']:
        if 'geometry' in link and isinstance(link['geometry'], LineString):
            link['geometry'] = {
                "type": "LineString",
                "coordinates": list(link['geometry'].coords)
            }
    
    # Convert the dictionary to a JSON string
    graph_json_str = json.dumps(graph_dict)
    
    return graph_json_str