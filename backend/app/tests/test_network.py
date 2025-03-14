import networkx as nx
import numpy as np
import geopandas as gpd
from shapely.geometry import Point
from app.utils.network import (
    deserialize_graph,
    find_suitable_apartment_network_nodes,
    retrieve_suitable_apartments
)
import pytest

# =============================================================================
# Tests for deserialize_graph function
# =============================================================================

def test_deserialize_graph_valid_json():
    """Test that function correctly deserializes a valid graph JSON into a MultiDiGraph."""
    # Arrange
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
    # Arrange
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

# Success Cases
def test_find_suitable_apartment_network_nodes_with_constraints(mocker):
    """Test that function returns nodes satisfying all amenity constraints."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = [1, 2, 3, 4]
    mock_dijkstra = mocker.patch.object(nx, 'multi_source_dijkstra_path_length')
    mock_dijkstra.side_effect = [
        {1: 100, 2: 200, 3: 300},
        {1: 150, 2: 250, 4: 350}
    ]
    amenity_kwargs = {
        'supermarket': ([10, 11], 500),
        'park': ([20, 21], 600)
    }

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)

    # Assert
    assert result == [1, 2]
    assert mock_dijkstra.call_count == 2

def test_find_suitable_apartment_network_nodes_multiple_amenities(mocker):
    """Test that function correctly handles multiple amenity types with different constraints."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = [1, 2, 3, 4, 5]
    mock_dijkstra = mocker.patch.object(nx, 'multi_source_dijkstra_path_length')
    mock_dijkstra.side_effect = [
        {1: 100, 2: 200, 3: 300},
        {1: 150, 2: 250, 4: 350},
        {1: 180, 5: 280}
    ]
    amenity_kwargs = {
        'supermarket': ([10, 11], 500),
        'park': ([20, 21], 600),
        'school': ([30, 31], 400)
    }

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)

    # Assert
    assert result == [1]
    assert mock_dijkstra.call_count == 3

def test_find_suitable_apartment_network_nodes_real_graph():
    """Test finding suitable apartment network nodes with a real graph instance."""
    # Arrange
    G = nx.MultiGraph()
    G.add_edges_from([(1, 2, {'length': 1}), (2, 3, {'length': 1}), (1, 3, {'length': 2})])
    
    apartment_nnodes = [1, 2, 3]
    amenity_kwargs = {
        'cafe': ([2], 1),  # Cafe at node 2 within 1 unit distance
        'park': ([3], 2)   # Park at node 3 within 2 units distance
    }

    # Act
    suitable_nodes = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)

    # Assert
    assert suitable_nodes == [1, 2, 3]  # All nodes are suitable

     # Test with more restrictive constraints where not all nodes meet criteria
    amenity_kwargs_restrictive = {
        'cafe': ([2], 0.5),  # Cafe at node 2 within 0.5 unit distance
        'park': ([3], 2)     # Park at node 3 within 2 units distance
    }
    
    # Act
    restricted_nodes = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs_restrictive)
    
    # Assert
    assert restricted_nodes == [2]  # Only node 2 should meet the more restrictive criteria

# Edge Cases
def test_find_suitable_apartment_network_nodes_no_constraints():
    """Test that function returns original nodes when no amenity constraints are provided."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = [1, 2, 3, 4]

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes)

    # Assert
    assert result == apartment_nnodes

def test_find_suitable_apartment_network_nodes_empty_apartment_nodes(mocker):
    """Test that function returns empty list when no apartment nodes are provided."""
    # Arrange
    G = nx.Graph()
    apartment_nnodes = []
    mock_dijkstra = mocker.patch.object(nx, 'multi_source_dijkstra_path_length')
    amenity_kwargs = {
        'supermarket': ([10, 11], 500),
        'park': ([20, 21], 600)
    }

    # Act
    result = find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)

    # Assert
    assert result == []
    assert mock_dijkstra.call_count == 2

# Error Cases
def test_find_suitable_apartment_network_nodes_error_handling():
    """Test error handling in find_suitable_apartment_network_nodes."""
    # Arrange
    G = nx.MultiGraph()
    apartment_nnodes = [1, 2, 3]
    # In the implementation, the function skips processing when nodes is None,
    # so using an invalid argument to force an error
    amenity_kwargs = {
        'cafe': ([2], "invalid_distance")  # Invalid distance type
    }

    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)
    
    assert "Error finding suitable apartment network nodes" in str(exc_info.value)

def test_find_suitable_apartment_network_nodes_networkx_error(mocker):
    """Test handling of NetworkX function errors."""
    # Arrange
    G = nx.MultiGraph()
    apartment_nnodes = [1, 2, 3]
    mocker.patch.object(nx, 'multi_source_dijkstra_path_length', 
                                        side_effect=nx.NetworkXNoPath("No path between nodes"))
    amenity_kwargs = {
        'cafe': ([2], 500)
    }

    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        find_suitable_apartment_network_nodes(G, apartment_nnodes, **amenity_kwargs)
    
    assert "Error finding suitable apartment network nodes" in str(exc_info.value)
    assert "No path between nodes" in str(exc_info.value)

# =============================================================================
# Tests for retrieve_suitable_apartments function
# =============================================================================

# Success Cases
def test_retrieve_suitable_apartments_with_matching_nodes(mocker):
    """Test that function returns apartments whose nearest nodes are in the suitable nodes list."""
    # Arrange
    points = [Point(1, 1), Point(2, 2), Point(3, 3)]
    data = {
        'id': [1, 2, 3],
        'centroid': points
    }
    apartment_gdf = gpd.GeoDataFrame(data=data, geometry=points)
    G = mocker.MagicMock()
    nearest_nodes_mock = mocker.patch('osmnx.distance.nearest_nodes')
    nearest_nodes_mock.return_value = np.array([100, 200, 300])
    suitable_apartment_nnodes = [100, 300]

    # Act
    result = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)

    # Assert
    assert len(result) == 2
    assert result['id'].tolist() == [1, 3]
    nearest_nodes_mock.assert_called_once()

# Edge Cases
def test_retrieve_suitable_apartments_no_matching_nodes(mocker):
    """Test that function returns empty result when no apartments have nearest nodes in suitable list."""
    # Arrange
    points = [Point(1, 1), Point(2, 2), Point(3, 3)]
    data = {
        'id': [1, 2, 3],
        'centroid': points
    }
    apartment_gdf = gpd.GeoDataFrame(data=data, geometry=points)
    G = mocker.MagicMock()
    nearest_nodes_mock = mocker.patch('osmnx.distance.nearest_nodes')
    
    # Two scenarios that result in no matching nodes:
    # 1. Nodes found but none match the suitable nodes
    nearest_nodes_mock.return_value = np.array([400, 500, 600])
    suitable_apartment_nnodes = [700, 800, 900]

    # Act
    result = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)

    # Assert
    assert len(result) == 0
    nearest_nodes_mock.assert_called_once()
    
    # 2. Empty suitable nodes list
    nearest_nodes_mock.reset_mock()
    nearest_nodes_mock.return_value = np.array([100, 200, 300])
    suitable_apartment_nnodes = []
    
    # Act
    result = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)
    
    # Assert
    assert result.empty
    nearest_nodes_mock.assert_called_once()

# Error Cases
def test_retrieve_suitable_apartments_error_handling(mocker):
    """Test error handling in retrieve_suitable_apartments function."""
    # Arrange
    # 1. Invalid GeoDataFrame
    apartment_gdf = None
    G = nx.MultiGraph()
    suitable_apartment_nnodes = [1, 2]

    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)
    
    assert "Error retrieving suitable apartments" in str(exc_info.value)
    
    # 2. Error in osmnx nearest_nodes function
    points = [Point(1, 1), Point(2, 2)]
    data = {
        'id': [1, 2],
        'centroid': points
    }
    apartment_gdf = gpd.GeoDataFrame(data=data, geometry=points)
    mocker.patch('osmnx.distance.nearest_nodes', 
                                     side_effect=Exception("Network error"))
    
    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)
    
    assert "Error retrieving suitable apartments" in str(exc_info.value)
    assert "Network error" in str(exc_info.value) 
