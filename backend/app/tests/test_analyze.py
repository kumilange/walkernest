import json
import sys
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException

# Create a custom DatabaseError that inherits from BaseException
class MockDatabaseError(Exception):
    pass
# Create a mock for the psycopg2 module
mock_psycopg2 = MagicMock()
mock_pool = MagicMock()
mock_pool.SimpleConnectionPool.return_value = MagicMock()
# Attach the pool to psycopg2
mock_psycopg2.pool = mock_pool
# Set up the DatabaseError
mock_psycopg2.DatabaseError = MockDatabaseError
# Mock the module
sys.modules['psycopg2'] = mock_psycopg2
sys.modules['psycopg2.pool'] = mock_pool

from fastapi.responses import JSONResponse
from app.routers.analyze import analyze_apartments

# =============================================================================
# Tests for analyze_apartments function
# =============================================================================

# Success Cases
def test_analyze_apartments_with_valid_constraints(mocker):
    """Test that the analyze_apartments function correctly processes valid constraints."""
    
    # Arrange
    mock_conn = mocker.MagicMock()
    mock_cursor = mock_conn.cursor.return_value.__enter__.return_value
    mock_cursor.fetchall.return_value = [
        ('{"type":"Polygon","coordinates":[[[1,1],[1,2],[2,2],[2,1],[1,1]]]}', 
         '{"type":"Point","coordinates":[1.5,1.5]}', 
         {"id": 1, "name": "apartment"})
    ]
    
    mocker.patch('app.db.get_connection', return_value=mock_conn)

    mock_apartment_gdf = mocker.MagicMock()
    mock_suitable_gdf = mocker.MagicMock()
    mock_suitable_gdf.copy.return_value = mock_suitable_gdf
    mock_suitable_gdf.to_json.return_value = '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[1,1],[1,2],[2,2],[2,1],[1,1]]]},"properties":{"id":1,"name":"apartment"}}]}'
    mock_suitable_gdf.__getitem__.return_value = mock_suitable_gdf
    mock_suitable_gdf.drop.return_value = mock_suitable_gdf
    mock_suitable_gdf.assign.return_value = mock_suitable_gdf

    fetch_apartment_geom_mock = mocker.patch('app.routers.analyze.fetch_apartment_geom_and_centroid', return_value=mock_cursor.fetchall.return_value)
    fetch_network_graph_mock = mocker.patch('app.routers.analyze.fetch_network_graph', return_value={"directed": False, "nodes": [], "links": []})
    fetch_network_nodes_mock = mocker.patch('app.routers.analyze.fetch_network_nodes', return_value=[('apartment', [1, 2, 3]), ('cafe', [4, 5, 6])])
    create_gdf_mock = mocker.patch('app.routers.analyze.create_gdf_with_centroid', return_value=mock_apartment_gdf)
    mock_graph = mocker.MagicMock()
    deserialize_graph_mock = mocker.patch('app.routers.analyze.deserialize_graph', return_value=mock_graph)
    find_suitable_nodes_mock = mocker.patch('app.routers.analyze.find_suitable_apartment_network_nodes', return_value=[1, 2])
    retrieve_suitable_apartments_mock = mocker.patch('app.routers.analyze.retrieve_suitable_apartments', return_value=mock_suitable_gdf)

    city_id = 1
    kwargs = json.dumps({"max_meter_cafe": 500})

    # Act
    result = analyze_apartments(city_id=city_id, kwargs=kwargs, conn=mock_conn)

    # Assert
    assert isinstance(result, JSONResponse)
    content = json.loads(result.body)
    assert "polygon" in content
    assert "centroid" in content

    fetch_apartment_geom_mock.assert_called_once()
    fetch_network_graph_mock.assert_called_once()
    fetch_network_nodes_mock.assert_called_once_with(mocker.ANY, city_id, ['cafe'])
    create_gdf_mock.assert_called_once_with(mock_cursor.fetchall.return_value)
    deserialize_graph_mock.assert_called_once()
    find_suitable_nodes_mock.assert_called_once()
    retrieve_suitable_apartments_mock.assert_called_once()

def test_analyze_apartments_with_no_constraints(mocker):
    """Test that the analyze_apartments function correctly handles no constraints."""
    
    # Arrange
    mock_conn = mocker.MagicMock()
    mock_cursor = mock_conn.cursor.return_value.__enter__.return_value
    mock_cursor.fetchall.return_value = [
        ('{"type":"Polygon","coordinates":[[[1,1],[1,2],[2,2],[2,1],[1,1]]]}', 
         '{"type":"Point","coordinates":[1.5,1.5]}', 
         {"id": 1, "name": "apartment"})
    ]
    
    mocker.patch('app.db.get_connection', return_value=mock_conn)

    mock_apartment_gdf = mocker.MagicMock()
    mock_suitable_gdf = mocker.MagicMock()
    mock_suitable_gdf.copy.return_value = mock_suitable_gdf
    mock_suitable_gdf.to_json.return_value = '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[1,1],[1,2],[2,2],[2,1],[1,1]]]},"properties":{"id":1,"name":"apartment"}}]}'
    mock_suitable_gdf.__getitem__.return_value = mock_suitable_gdf
    mock_suitable_gdf.drop.return_value = mock_suitable_gdf
    mock_suitable_gdf.assign.return_value = mock_suitable_gdf

    fetch_apartment_geom_mock = mocker.patch('app.routers.analyze.fetch_apartment_geom_and_centroid', return_value=mock_cursor.fetchall.return_value)
    fetch_network_graph_mock = mocker.patch('app.routers.analyze.fetch_network_graph', return_value={"directed": False, "nodes": [], "links": []})
    fetch_network_nodes_mock = mocker.patch('app.routers.analyze.fetch_network_nodes', return_value=[('apartment', [1, 2, 3])])
    create_gdf_mock = mocker.patch('app.routers.analyze.create_gdf_with_centroid', return_value=mock_apartment_gdf)
    mock_graph = mocker.MagicMock()
    deserialize_graph_mock = mocker.patch('app.routers.analyze.deserialize_graph', return_value=mock_graph)
    find_suitable_nodes_mock = mocker.patch('app.routers.analyze.find_suitable_apartment_network_nodes', return_value=[1, 2, 3])
    retrieve_suitable_apartments_mock = mocker.patch('app.routers.analyze.retrieve_suitable_apartments', return_value=mock_suitable_gdf)

    city_id = 1
    kwargs = json.dumps({})
    
    # Act
    result = analyze_apartments(city_id=city_id, kwargs=kwargs, conn=mock_conn)
    
    # Assert
    assert isinstance(result, JSONResponse)
    content = json.loads(result.body)
    assert "polygon" in content
    assert "centroid" in content
    
    fetch_apartment_geom_mock.assert_called_once_with(mocker.ANY, city_id)
    fetch_network_graph_mock.assert_called_once_with(mocker.ANY, city_id)
    fetch_network_nodes_mock.assert_called_once_with(mocker.ANY, city_id, [])
    create_gdf_mock.assert_called_once_with(mock_cursor.fetchall.return_value)
    deserialize_graph_mock.assert_called_once_with(mocker.ANY)
    find_suitable_nodes_mock.assert_called_once_with(mock_graph, [1, 2, 3])
    retrieve_suitable_apartments_mock.assert_called_once_with(mock_apartment_gdf, mock_graph, [1, 2, 3])

# Error Cases
def test_analyze_apartments_error_handling(mocker):
    """Test that the analyze_apartments function correctly handles various error scenarios."""
    
    # Arrange common elements
    mock_conn = mocker.MagicMock()
    city_id = 1
    
    # Scenario 1: Invalid JSON
    invalid_kwargs = "{invalid_json"  # This is not valid JSON
    
    # Act & Assert for invalid JSON
    with pytest.raises(HTTPException) as exc_info:
        analyze_apartments(city_id=city_id, kwargs=invalid_kwargs, conn=mock_conn)
    
    assert exc_info.value.status_code == 500
    assert "An error occurred" in exc_info.value.detail
    assert "JSONDecodeError" in exc_info.value.detail or "Expecting property name" in exc_info.value.detail
    
    # Scenario 2: Database error
    database_error = MockDatabaseError("Simulated database error")
    fetch_apartment_geom_mock = mocker.patch('app.routers.analyze.fetch_apartment_geom_and_centroid', 
                                          side_effect=database_error)
    
    kwargs = json.dumps({"max_meter_cafe": 500})
    
    # Act & Assert for database error
    with pytest.raises(HTTPException) as exc_info:
        analyze_apartments(city_id=city_id, kwargs=kwargs, conn=mock_conn)
    
    assert exc_info.value.status_code == 500
    assert "Database error" in exc_info.value.detail
    assert str(database_error) in exc_info.value.detail
    
    fetch_apartment_geom_mock.assert_called_once()
    
    # Scenario 3: Empty apartment data
    fetch_apartment_geom_mock = mocker.patch('app.routers.analyze.fetch_apartment_geom_and_centroid', 
                                          return_value=[])
    create_gdf_mock = mocker.patch('app.routers.analyze.create_gdf_with_centroid', 
                               side_effect=ValueError("not enough values to unpack"))
    
    # Act & Assert for empty apartment data
    with pytest.raises(HTTPException) as exc_info:
        analyze_apartments(city_id=city_id, kwargs=kwargs, conn=mock_conn)
    
    assert exc_info.value.status_code == 500
    assert "An error occurred" in exc_info.value.detail
    assert "not enough values to unpack" in exc_info.value.detail
    
    fetch_apartment_geom_mock.assert_called_once()
    create_gdf_mock.assert_called_once_with([])
    