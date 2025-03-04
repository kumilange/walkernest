import networkx as nx
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from app.utils.network import (
    deserialize_graph,
    find_suitable_apartment_network_nodes,
    retrieve_suitable_apartments
)

# =============================================================================
# Tests for deserialize_graph function
# =============================================================================

def test_deserialize_graph_valid_json():
    """Test that function correctly deserializes a valid graph JSON into a MultiDiGraph."""
    # Create a sample graph JSON with nodes and edges
    graph_json = {
        "directed": True,
        "multigraph": True,
        "graph": {},
        "nodes": [
            {"id": 1},
            {"id": 2},
            {"id": 3}
        ],
        "links": [
            {"source": 1, "target": 2, "key": 0},
            {"source": 2, "target": 3, "key": 0},
            {"source": 3, "target": 1, "key": 0}
        ]
    }

    # Act
    result = deserialize_graph(graph_json)

    # Assert
    assert isinstance(result, nx.MultiGraph)
    assert len(result.nodes) == 3
    assert len(result.edges) == 3
    assert result.has_edge(1, 2)
    assert result.has_edge(2, 3)
    assert result.has_edge(3, 1)

def test_deserialize_graph_empty_json():
    """Test that function correctly handles an empty graph JSON."""
    # Create an empty graph JSON with no nodes or edges
    empty_graph_json = {
        "directed": True,
        "multigraph": True,
        "graph": {},
        "nodes": [],
        "links": []
    }

    # Act
    result = deserialize_graph(empty_graph_json)

    # Assert
    assert isinstance(result, nx.MultiGraph)
    assert len(result.nodes) == 0
    assert len(result.edges) == 0

# =============================================================================
# Tests for find_suitable_apartment_network_nodes function
# =============================================================================

def test_find_suitable_nodes_satisfies_all_constraints(mocker):
    """Test that function returns nodes satisfying all amenity constraints."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = [1, 2, 3, 4]

    # Mock the multi_source_dijkstra_path_length function
    mock_dijkstra = mocker.patch.object(nx, 'multi_source_dijkstra_path_length')

    # Set up mock return values for two amenity types
    mock_dijkstra.side_effect = [
        {1: 100, 2: 200, 3: 300},  # Nodes 1, 2, 3 are within range of first amenity
        {1: 150, 2: 250, 4: 350}   # Nodes 1, 2, 4 are within range of second amenity
    ]

    # Define amenity constraints
    amenity_kwargs = {
        'supermarket': ([10, 11], 500),  # Supermarket nodes and max distance
        'park': ([20, 21], 600)          # Park nodes and max distance
    }

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)

    # Assert
    assert result == [1, 2]  # Only nodes 1 and 2 satisfy both constraints
    assert mock_dijkstra.call_count == 2

def test_find_suitable_nodes_empty_apartment_nodes(mocker):
    """Test that function returns empty list when no apartment nodes are provided."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = []

    # Mock the multi_source_dijkstra_path_length function
    mock_dijkstra = mocker.patch.object(nx, 'multi_source_dijkstra_path_length')

    # Define amenity constraints
    amenity_kwargs = {
        'supermarket': ([10, 11], 500),
        'park': ([20, 21], 600)
    }

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)

    # Assert
    assert result == []
    assert mock_dijkstra.call_count == 2

def test_find_suitable_nodes_multiple_amenity_types(mocker):
    """Test that function correctly handles multiple amenity types with different constraints."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = [1, 2, 3, 4, 5]

    # Mock the multi_source_dijkstra_path_length function
    mock_dijkstra = mocker.patch.object(nx, 'multi_source_dijkstra_path_length')

    # Set up mock return values for three amenity types
    mock_dijkstra.side_effect = [
        {1: 100, 2: 200, 3: 300},  # Nodes 1, 2, 3 are within range of first amenity
        {1: 150, 2: 250, 4: 350},  # Nodes 1, 2, 4 are within range of second amenity
        {1: 180, 5: 280}           # Nodes 1, 5 are within range of third amenity
    ]

    # Define amenity constraints
    amenity_kwargs = {
        'supermarket': ([10, 11], 500),  # Supermarket nodes and max distance
        'park': ([20, 21], 600),         # Park nodes and max distance
        'school': ([30, 31], 400)        # School nodes and max distance
    }

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)

    # Assert
    assert result == [1]  # Only node 1 satisfies all constraints
    assert mock_dijkstra.call_count == 3

def test_find_suitable_nodes_no_constraints():
    """Test that function returns original nodes when no amenity constraints are provided."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = [1, 2, 3, 4]

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes)

    # Assert
    assert result == apartment_nnodes

# =============================================================================
# Tests for retrieve_suitable_apartments function
# =============================================================================

def test_retrieve_suitable_apartments_with_matching_nodes(mocker):
    """Test that function returns apartments whose nearest nodes are in the suitable nodes list."""
    # Arrange
    points = [Point(1, 1), Point(2, 2), Point(3, 3)]
    data = {
        'id': [1, 2, 3],
        'centroid': points
    }
    apartment_gdf = gpd.GeoDataFrame(data=data, geometry=points)

    # Mock G network graph
    G = mocker.MagicMock()

    # Mock the nearest_nodes function to return predictable values
    nearest_nodes_mock = mocker.patch('osmnx.distance.nearest_nodes')
    nearest_nodes_mock.return_value = np.array([100, 200, 300])

    # Define suitable nodes - only include nodes for apartments 1 and 3
    suitable_apartment_nnodes = [100, 300]

    # Act
    result = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)

    # Assert
    assert len(result) == 2
    assert result['id'].tolist() == [1, 3]
    nearest_nodes_mock.assert_called_once()

def test_retrieve_suitable_apartments_no_matching_nodes(mocker):
    """Test that function returns empty result when no apartments have nearest nodes in suitable list."""
    # Arrange
    points = [Point(1, 1), Point(2, 2), Point(3, 3)]
    data = {
        'id': [1, 2, 3],
        'centroid': points
    }
    apartment_gdf = gpd.GeoDataFrame(data=data, geometry=points)

    # Mock G network graph
    G = mocker.MagicMock()

    # Mock the nearest_nodes function to return predictable values
    nearest_nodes_mock = mocker.patch('osmnx.distance.nearest_nodes')
    nearest_nodes_mock.return_value = np.array([400, 500, 600])

    # Define suitable nodes - none of the nearest nodes are suitable
    suitable_apartment_nnodes = [700, 800, 900]

    # Act
    result = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)

    # Assert
    assert len(result) == 0
    nearest_nodes_mock.assert_called_once()

def test_retrieve_suitable_apartments_empty_suitable_nodes(mocker):
    """Test that function returns empty result when suitable nodes list is empty."""
    # Arrange
    points = [Point(1, 1), Point(2, 2), Point(3, 3)]
    data = {
        'id': [1, 2, 3],
        'centroid': points
    }
    apartment_gdf = gpd.GeoDataFrame(data=data, geometry=points)

    # Mock G network graph
    G = mocker.MagicMock()

    # Mock the nearest_nodes function to return predictable values
    nearest_nodes_mock = mocker.patch('osmnx.distance.nearest_nodes')
    nearest_nodes_mock.return_value = np.array([100, 200, 300])

    # Define empty suitable nodes list
    suitable_apartment_nnodes = []

    # Act
    result = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)

    # Assert
    assert result.empty
    nearest_nodes_mock.assert_called_once()
