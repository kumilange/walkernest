import pytest
import networkx as nx
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon, MultiLineString
from unittest.mock import patch
import json

from seed.utils.network import (
    create_network_graph,
    convert_graph_to_json,
    compress_network_graph,
    reduce_graph_size,
    reduce_coordinate_precision,
    prune_graph,
    convert_gdf_to_network_nodes
)

# =============================================================================
# Tests for create_network_graph function
# =============================================================================
def test_create_network_graph():
    """Test that create_network_graph returns a MultiDiGraph."""
    # Arrange
    mock_graph = nx.MultiDiGraph()
    mock_graph.add_node(1, x=0, y=0)
    mock_graph.add_node(2, x=1, y=1)
    mock_graph.add_edge(1, 2, length=1.0)
    mock_graph.graph['crs'] = 'EPSG:4326'

    polygon = Polygon([
        (0, 0),
        (0, 0.05),
        (0.05, 0.05),
        (0.05, 0),
        (0, 0)
    ])

    # Act
    with patch('osmnx.graph_from_polygon') as mock_graph_from_polygon:
        mock_graph_from_polygon.return_value = mock_graph
        G = create_network_graph(polygon)
        
    # Assert
    assert isinstance(G, nx.MultiDiGraph)
    assert G.is_directed()
    assert G.is_multigraph()
    assert G.graph['crs'] == 'EPSG:4326'
    assert len(G.nodes) == 2
    assert len(G.edges) == 1

# =============================================================================
# Tests for convert_graph_to_json function
# =============================================================================
def test_convert_graph_to_json():
    """Test that convert_graph_to_json correctly serializes a graph to JSON."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_node(2, x=1.0, y=1.0)
    G.add_edge(1, 2, length=1.0, weight=1.0)
    
    # Act
    json_str = convert_graph_to_json(G)
    
    # Assert
    json_data = json.loads(json_str)
    assert 'directed' in json_data
    assert json_data['directed'] is True
    assert 'multigraph' in json_data
    assert json_data['multigraph'] is True
    assert 'nodes' in json_data
    assert len(json_data['nodes']) == 2
    assert 'links' in json_data
    assert len(json_data['links']) == 1

def test_convert_graph_to_json_empty_graph():
    """Test that convert_graph_to_json works with an empty graph."""
    # Arrange
    G = nx.MultiDiGraph()
    
    # Act
    json_str = convert_graph_to_json(G)
    
    # Assert
    json_data = json.loads(json_str)
    assert 'nodes' in json_data
    assert len(json_data['nodes']) == 0
    assert 'links' in json_data
    assert len(json_data['links']) == 0

# =============================================================================
# Tests for reduce_graph_size function
# =============================================================================
def test_reduce_graph_size():
    """Test that reduce_graph_size removes specified attributes."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0, name="Node 1", highway="primary")
    G.add_node(2, x=1.0, y=1.0, name="Node 2", street_count=3)
    G.add_edge(1, 2, length=1.0, name="Edge 1", highway="primary", lanes=2)
    
    # Act
    reduced_G = reduce_graph_size(G)
    
    # Assert
    for _, node_data in reduced_G.nodes(data=True):
        assert 'name' not in node_data
        assert 'highway' not in node_data
        assert 'street_count' not in node_data
    
    for _, _, edge_data in reduced_G.edges(data=True):
        assert 'name' not in edge_data
        assert 'highway' not in edge_data
        assert 'lanes' not in edge_data
    
    assert reduced_G.nodes[1]['x'] == 0.0
    assert reduced_G.nodes[1]['y'] == 0.0
    assert reduced_G.nodes[2]['x'] == 1.0
    assert reduced_G.nodes[2]['y'] == 1.0
    assert reduced_G.edges[1, 2, 0]['length'] == 1.0

def test_reduce_graph_size_with_nonexistent_attributes():
    """Test that reduce_graph_size gracefully handles nonexistent attributes."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_edge(1, 1, length=1.0)
    
    # Act
    reduced_G = reduce_graph_size(G)
    
    # Assert
    assert reduced_G.nodes[1]['x'] == 0.0
    assert reduced_G.nodes[1]['y'] == 0.0
    assert reduced_G.edges[1, 1, 0]['length'] == 1.0

# =============================================================================
# Tests for reduce_coordinate_precision function
# =============================================================================
def test_reduce_coordinate_precision():
    """Test that reduce_coordinate_precision rounds coordinates to specified precision."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=1.23456789, y=9.87654321)
    G.add_node(2, x=5.55555555, y=3.33333333)
    
    # Act
    reduced_G = reduce_coordinate_precision(G, decimals=3)
    
    # Assert
    assert reduced_G.nodes[1]['x'] == 1.235
    assert reduced_G.nodes[1]['y'] == 9.877
    assert reduced_G.nodes[2]['x'] == 5.556
    assert reduced_G.nodes[2]['y'] == 3.333

def test_reduce_coordinate_precision_default():
    """Test reduce_coordinate_precision with default decimals."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=1.23456789, y=9.87654321)
    
    # Act
    reduced_G = reduce_coordinate_precision(G)
    
    # Assert
    assert reduced_G.nodes[1]['x'] == 1.23457
    assert reduced_G.nodes[1]['y'] == 9.87654

def test_reduce_coordinate_precision_with_missing_coordinates():
    """Test that reduce_coordinate_precision handles nodes without coordinates."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=1.23456789, y=9.87654321)
    G.add_node(2)
    G.add_node(3, z=5.0)
    
    # Act
    reduced_G = reduce_coordinate_precision(G)
    
    # Assert
    assert reduced_G.nodes[1]['x'] == 1.23457
    assert reduced_G.nodes[1]['y'] == 9.87654
    assert 'x' not in reduced_G.nodes[2]
    assert 'y' not in reduced_G.nodes[2]
    assert 'x' not in reduced_G.nodes[3]
    assert 'y' not in reduced_G.nodes[3]
    assert reduced_G.nodes[3]['z'] == 5.0

# =============================================================================
# Tests for prune_graph function
# =============================================================================
def test_prune_graph_removes_short_edges():
    """Test that prune_graph removes edges shorter than the threshold."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_node(2, x=1.0, y=1.0)
    G.add_node(3, x=2.0, y=2.0)
    G.add_node(4, x=3.0, y=3.0)
    G.add_edge(1, 2, length=10.0)
    G.add_edge(2, 3, length=4.0)
    G.add_edge(3, 4, length=6.0)
    
    # Act
    pruned_G = prune_graph(G)
    
    # Assert
    assert len(pruned_G.edges) == 2
    assert (1, 2, 0) in pruned_G.edges
    assert (2, 3, 0) not in pruned_G.edges
    assert (3, 4, 0) in pruned_G.edges

def test_prune_graph_removes_isolated_nodes():
    """Test that prune_graph removes nodes without any connected edges."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_node(2, x=1.0, y=1.0)
    G.add_node(3, x=2.0, y=2.0)
    G.add_node(4, x=3.0, y=3.0)
    G.add_edge(1, 2, length=10.0)
    G.add_edge(2, 3, length=4.0)
    
    # Act
    pruned_G = prune_graph(G, min_edge_length=5.0)
    
    # Assert
    assert len(pruned_G.nodes) == 2
    assert 1 in pruned_G.nodes
    assert 2 in pruned_G.nodes
    assert 3 not in pruned_G.nodes
    assert 4 not in pruned_G.nodes

def test_prune_graph_custom_threshold():
    """Test prune_graph with a custom minimum edge length threshold."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_node(2, x=1.0, y=1.0)
    G.add_node(3, x=2.0, y=2.0)
    G.add_edge(1, 2, length=3.0)
    G.add_edge(2, 3, length=7.0)
    
    # Act
    pruned_G = prune_graph(G, min_edge_length=5.0)
    
    # Assert
    assert len(pruned_G.edges) == 1
    assert (1, 2, 0) not in pruned_G.edges
    assert (2, 3, 0) in pruned_G.edges

# =============================================================================
# Tests for compress_network_graph function
# =============================================================================
def test_compress_network_graph():
    """Test that compress_network_graph calls all compression functions."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=1.23456789, y=9.87654321, name="Node 1")
    G.add_node(2, x=5.55555555, y=3.33333333, name="Node 2")
    G.add_edge(1, 2, length=10.0, name="Edge 1")
    
    # Act
    compressed_G = compress_network_graph(G)
    
    # Assert
    assert 1 in compressed_G.nodes
    assert 2 in compressed_G.nodes
    assert 'name' not in compressed_G.nodes[1]
    assert 'name' not in compressed_G.edges[1, 2, 0]
    assert compressed_G.nodes[1]['x'] == 1.23457
    assert compressed_G.nodes[1]['y'] == 9.87654
    assert (1, 2, 0) in compressed_G.edges

def test_compress_network_graph_removes_short_edges():
    """Test that compress_network_graph removes short edges during compression."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0, name="Node 1")
    G.add_node(2, x=1.0, y=1.0, name="Node 2")
    G.add_node(3, x=2.0, y=2.0, name="Node 3")
    G.add_edge(1, 2, length=10.0, name="Edge 1")
    G.add_edge(2, 3, length=3.0, name="Edge 2")
    
    # Act
    compressed_G = compress_network_graph(G)
    
    # Assert
    assert len(compressed_G.edges) == 1
    assert (1, 2, 0) in compressed_G.edges
    assert (2, 3, 0) not in compressed_G.edges
    assert 1 in compressed_G.nodes
    assert 2 in compressed_G.nodes
    assert 3 not in compressed_G.nodes

# =============================================================================
# Tests for convert_gdf_to_network_nodes function
# =============================================================================
def test_convert_gdf_to_network_nodes_with_centroids():
    """Test convert_gdf_to_network_nodes with centroid-based node finding."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_node(2, x=1.0, y=1.0)
    
    p1 = Point(0.01, 0.01)
    p2 = Point(0.99, 0.99)
    gdf = gpd.GeoDataFrame({'geometry': [p1, p2]})
    gdf['centroid'] = gdf['geometry']
    
    # Act
    with patch('osmnx.distance.nearest_nodes') as mock_nearest_nodes:
        mock_nearest_nodes.side_effect = [1, 2]
        result = convert_gdf_to_network_nodes(G, gdf, use_centroid=True)
        
    # Assert
    assert len(result) == 2
    assert 1 in result
    assert 2 in result
    assert mock_nearest_nodes.call_count == 2

def test_convert_gdf_to_network_nodes_with_boundaries():
    """Test convert_gdf_to_network_nodes with boundary-based node finding."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_node(2, x=1.0, y=1.0)
    
    ls1 = LineString([(0.0, 0.0), (0.5, 0.5)])
    ls2 = LineString([(0.5, 0.5), (1.0, 1.0)])
    gdf = gpd.GeoDataFrame({'boundary': [ls1, ls2]})
    
    # Act
    with patch('osmnx.distance.nearest_nodes') as mock_nearest_nodes:
        mock_nearest_nodes.side_effect = [1, 2, 1, 2, 1, 2]
        result = convert_gdf_to_network_nodes(G, gdf, use_centroid=False)
        
    # Assert
    assert len(result) == 2
    assert 1 in result
    assert 2 in result

def test_convert_gdf_to_network_nodes_with_multilinestring():
    """Test convert_gdf_to_network_nodes with MultiLineString boundaries."""
    # Arrange
    G = nx.MultiDiGraph()
    G.add_node(1, x=0.0, y=0.0)
    G.add_node(2, x=1.0, y=1.0)
    
    ls1 = LineString([(0.0, 0.0), (0.5, 0.5)])
    ls2 = LineString([(0.5, 0.5), (1.0, 1.0)])
    mls = MultiLineString([ls1, ls2])
    gdf = gpd.GeoDataFrame({'boundary': [mls]})
    
    # Act
    with patch('osmnx.distance.nearest_nodes') as mock_nearest_nodes:
        mock_nearest_nodes.side_effect = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2]
        result = convert_gdf_to_network_nodes(G, gdf, use_centroid=False)
        
    # Assert
    assert len(result) == 2
    assert 1 in result
    assert 2 in result

def test_convert_gdf_to_network_nodes_invalid_geometry():
    """Test convert_gdf_to_network_nodes raises an error with invalid geometry."""
    # Arrange
    G = nx.MultiDiGraph()
    
    class UnsupportedGeometry:
        pass
    
    gdf = gpd.GeoDataFrame({'boundary': [UnsupportedGeometry()]})
    
    # Act & Assert
    with pytest.raises(TypeError, match="Unsupported geometry type"):
        convert_gdf_to_network_nodes(G, gdf, use_centroid=False) 
