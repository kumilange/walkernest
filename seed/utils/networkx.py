import json
import osmnx as ox
import networkx as nx
from shapely.geometry import Point, LineString, MultiLineString

def create_network_graph(geometry):
    """Create a network graph from a given geometry (Polygon or MultiPolygon)."""
    return ox.graph_from_polygon(geometry, network_type='walk')

def compress_network_graph(G: nx.MultiDiGraph) -> str:
    """Compresses a network graph by reducing size, reducing precision and pruning."""
    G = reduce_graph_size(G)
    G = reduce_coordinate_precision(G)
    G = prune_graph(G)
    return G

def reduce_graph_size(G: nx.MultiDiGraph) -> nx.MultiDiGraph:
    """Reduces the size of a network graph by removing specific attributes."""
    remove_attributes = ['name', 'highway', 'maxspeed', 'lanes', 'service', 'ref', 'street_count', 'oimid', 'oneway', 'reversed', 'geometry', 'key']

    for _, node_data in G.nodes(data=True):
        for attr in remove_attributes:
            node_data.pop(attr, None) 

    for _, _, edge_data in G.edges(data=True):
        for attr in remove_attributes:
            edge_data.pop(attr, None) 

    return G

def reduce_coordinate_precision(G: nx.MultiDiGraph, decimals: int = 5) -> nx.MultiDiGraph:
    """Reduces coordinate precision in the graph to save space."""
    for _, node_data in G.nodes(data=True):
        if 'x' in node_data and 'y' in node_data:
            node_data['x'] = round(node_data['x'], decimals)
            node_data['y'] = round(node_data['y'], decimals)

    return G

def prune_graph(G: nx.MultiDiGraph, min_edge_length: float = 5.0) -> nx.MultiDiGraph:
    """Prunes the graph by removing short edges or isolated nodes."""
    edges_to_remove = [(u, v, k) for u, v, k, d in G.edges(keys=True, data=True) if d.get('length', 0) < min_edge_length]
    G.remove_edges_from(edges_to_remove)

    isolated_nodes = [node for node in G.nodes if G.degree(node) == 0]
    G.remove_nodes_from(isolated_nodes)

    return G

def convert_graph_to_json(G: nx.MultiDiGraph) -> str:
    """Converts a network graph to a JSON string."""
    return json.dumps(nx.node_link_data(G))

def convert_gdf_to_network_nodes(G, gdf, use_centroid=True):
    """Convert GeoDataFrame geometries to network nodes."""    
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
        points = gdf['centroid']
        nodes = {ox.distance.nearest_nodes(G, point.x, point.y) for point in points}
    else:
        nodes = set()
        for geometry in gdf['boundary']:
            add_nearest_nodes(geometry, nodes)

    return list(nodes)  


