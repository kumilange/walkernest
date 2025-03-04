import pytest
import networkx as nx
import numpy as np
import geopandas as gpd
from shapely.geometry import Point, LineString, Polygon
from unittest.mock import patch
from seed.utils.network import create_network_graph

def test_create_network_graph():
    """Test that create_network_graph returns a MultiDiGraph."""
    # Create a mock graph
    mock_graph = nx.MultiDiGraph()
    mock_graph.add_node(1, x=0, y=0)
    mock_graph.add_node(2, x=1, y=1)
    mock_graph.add_edge(1, 2, length=1.0)
    mock_graph.graph['crs'] = 'EPSG:4326'

    # Create a test polygon (5km x 5km)
    polygon = Polygon([
        (0, 0),
        (0, 0.05),  # 5km in degrees
        (0.05, 0.05),
        (0.05, 0),
        (0, 0)
    ])

    # Mock the OSMnx graph_from_polygon function
    with patch('osmnx.graph_from_polygon') as mock_graph_from_polygon:
        mock_graph_from_polygon.return_value = mock_graph
        
        # Act
        G = create_network_graph(polygon)
        
        # Assert
        assert isinstance(G, nx.MultiDiGraph)
        assert G.is_directed()
        assert G.is_multigraph()
        assert G.graph['crs'] == 'EPSG:4326'
        assert len(G.nodes) == 2
        assert len(G.edges) == 1 