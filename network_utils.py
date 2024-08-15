import osmnx as ox
import networkx as nx
from shapely.geometry import Point, Polygon, LineString, MultiPolygon, MultiLineString

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
                    if isinstance(part, (Polygon, LineString)):
                        for point in part.coords:
                            nodes.append(ox.distance.nearest_nodes(G, point[0], point[1]))
                    else:
                        raise TypeError("Unsupported sub-geometry type in MultiPolygon or MultiLineString")
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

    return suitable_residential_nnodes

def retrieve_suitable_residential_areas(residentials, G, suitable_residential_nnodes):
    """
    Retrieve suitable residential areas based on their centroids and nearest network nodes.

    Parameters:
    residentials (gpd.GeoDataFrame): GeoDataFrame of residential areas.
    G (networkx.Graph): The graph representing the road network.
    suitable_residential_nnodes (list): List of suitable residential network nodes.

    Returns:
    gpd.GeoDataFrame: Filtered GeoDataFrame of suitable residential areas.
    """
    return residentials[residentials['centroid'].apply(lambda x: ox.distance.nearest_nodes(G, x.x, x.y) in suitable_residential_nnodes)]
