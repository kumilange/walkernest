import pytest
from fastapi import HTTPException
from app.crud import fetch_amenities, fetch_apartment_geom_and_centroid, fetch_favorites, fetch_network_graph, fetch_network_nodes  

# =============================================================================
# Tests for fetch_favorites function
# =============================================================================

# Success Cases
def test_fetch_favorites_returns_correct_amenities(mocker):
    """Test that function correctly fetches amenities when given valid IDs."""
    # Arrange
    mock_cur = mocker.MagicMock()
    mock_cur.fetchall.return_value = [
        {"centroid": '{"type":"Point","coordinates":[10.0,20.0]}', "properties": {"id": 1, "name": "Park"}, "city_id": 100},
        {"centroid": '{"type":"Point","coordinates":[30.0,40.0]}', "properties": {"id": 2, "name": "Restaurant"}, "city_id": 101}
    ]
    ids = [1, 2]

    # Act
    result = fetch_favorites(mock_cur, ids)

    # Assert
    mock_cur.execute.assert_called_once()
    assert "WHERE (properties->>'id')::bigint IN %s" in mock_cur.execute.call_args[0][0]
    assert mock_cur.execute.call_args[0][1] == ((1, 2),)

    # Verify the result
    assert len(result) == 2
    assert result[0]["properties"]["name"] == "Park"
    assert result[1]["properties"]["name"] == "Restaurant"

# Edge Cases
def test_fetch_favorites_with_empty_ids_list(mocker):
    """Test that function returns an empty list when given an empty list of IDs."""
    # Arrange
    mock_cur = mocker.MagicMock()
    mock_cur.fetchall.return_value = []
    ids = []

    # Act
    result = fetch_favorites(mock_cur, ids)

    # Assert
    mock_cur.execute.assert_called_once()
    assert "WHERE (properties->>'id')::bigint IN %s" in mock_cur.execute.call_args[0][0]
    assert mock_cur.execute.call_args[0][1] == ((),)

    # Verify the result is an empty list
    assert result == []

# Error Cases
def test_fetch_favorites_raises_exception_for_invalid_ids(mocker):
    """Test that function raises HTTPException for invalid IDs."""
    # Arrange
    mock_cur = mocker.MagicMock()
    mock_cur.execute.side_effect = Exception("Database error")
    ids = [999]  # Assuming this ID does not exist

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        fetch_favorites(mock_cur, ids)

    # Verify exception details
    assert excinfo.value.status_code == 500
    assert excinfo.value.detail == "Failed to fetch favorite amenities: Database error"

# =============================================================================
# Tests for fetch_amenities function
# =============================================================================

# Success Cases
def test_fetch_amenities_with_centroid(mocker):
    """Test that function returns amenities with centroids."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.fetchall.return_value = [
        {"centroid": '{"type":"Point","coordinates":[10.0,20.0]}', "properties": {"type": "restaurant"}}
    ]
    city_id = 123
    name = "Restaurant"
    is_centroid = True

    # Act
    result = fetch_amenities(mock_cursor, city_id, name, is_centroid)

    # Assert
    mock_cursor.execute.assert_called_once()
    sql = mock_cursor.execute.call_args[0][0]
    assert "SELECT ST_AsGeoJSON(ST_Centroid(geom), 5) AS centroid" in sql
    assert mock_cursor.execute.call_args[0][1] == (city_id, name)
    assert result == mock_cursor.fetchall.return_value

def test_fetch_amenities_without_centroid(mocker):
    """Test that function returns amenities without centroid."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.fetchall.return_value = [
        {"geom": '{"type":"Point","coordinates":[10.0,20.0]}', "properties": {"amenity": "cafe", "name": "Starbucks"}}
    ]
    city_id = 123
    name = "cafe"
    is_centroid = False

    # Act
    result = fetch_amenities(mock_cursor, city_id, name, is_centroid)

    # Assert
    mock_cursor.execute.assert_called_once()
    sql = mock_cursor.execute.call_args[0][0]
    assert "SELECT ST_AsGeoJSON(geom, 5) AS geom, properties" in sql
    assert mock_cursor.execute.call_args[0][1] == (city_id, name)
    assert result == mock_cursor.fetchall.return_value

def test_fetch_amenities_with_special_characters_in_name(mocker):
    """Test that function handles special characters in name parameter."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.fetchall.return_value = [
        {"geom": '{"type":"Point","coordinates":[10.0,20.0]}', "properties": {"type": "café"}}
    ]
    city_id = 123
    name = "Café & Bistro"
    is_centroid = False

    # Act
    result = fetch_amenities(mock_cursor, city_id, name, is_centroid)

    # Assert
    mock_cursor.execute.assert_called_once()
    assert mock_cursor.execute.call_args[0][1] == (city_id, name)
    assert result == mock_cursor.fetchall.return_value

# Error Cases
def test_fetch_amenities_raises_exception_for_invalid_city_id(mocker):
    """Test that function raises HTTPException for invalid city_id."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.execute.side_effect = Exception("Database error")
    city_id = -1  # Invalid city ID
    name = "Restaurant"
    is_centroid = True

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        fetch_amenities(mock_cursor, city_id, name, is_centroid)

    # Verify exception details
    assert excinfo.value.status_code == 500
    assert excinfo.value.detail == "Failed to fetch amenities: Database error"

# =============================================================================
# Tests for fetch_network_graph function
# =============================================================================

# Success Cases
def test_fetch_network_graph_returns_data_for_valid_city_id(mocker):
    """Test that function returns data for a valid city_id."""
    # Arrange
    mock_cur = mocker.Mock()
    mock_cur.fetchone.return_value = [{"nodes": [], "edges": []}]
    city_id = 1

    # Act
    result = fetch_network_graph(mock_cur, city_id)

    # Assert
    mock_cur.execute.assert_called_once()
    actual_sql = mock_cur.execute.call_args[0][0]
    assert "SELECT graph" in actual_sql
    assert "FROM network_graphs" in actual_sql
    assert "WHERE city_id = %s" in actual_sql
    assert mock_cur.execute.call_args[0][1] == (city_id,)
    assert result == {"nodes": [], "edges": []}

# Error Cases
def test_fetch_network_graph_raises_exception_for_invalid_city_id(mocker):
    """Test that function raises HTTPException for invalid city_id."""
    # Arrange
    mock_cur = mocker.Mock()
    mock_cur.execute.side_effect = Exception("Database error")
    city_id = -1  # Invalid city ID

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        fetch_network_graph(mock_cur, city_id)

    # Verify exception details
    assert excinfo.value.status_code == 500
    assert excinfo.value.detail == "Failed to fetch network graph: Database error"

# =============================================================================
# Tests for fetch_network_nodes function
# =============================================================================

# Success Cases
def test_fetch_network_nodes_returns_correct_nodes(mocker):
    """Test that function returns correct nodes for given amenities."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.fetchall.return_value = [
        {"name": "apartment", "nodes": [{"id": 1, "name": "Node 1"}, {"id": 2, "name": "Node 2"}]}
    ]
    city_id = 1
    amenities = ["cafe", "park", "apartment"]

    # Act
    result = fetch_network_nodes(mock_cursor, city_id, amenities)

    # Assert
    assert mock_cursor.execute.call_count == 1
    actual_sql = mock_cursor.execute.call_args[0][0]
    assert "SELECT name, nodes" in actual_sql
    assert "FROM network_nodes" in actual_sql
    assert "WHERE city_id = %s AND name IN" in actual_sql
    actual_params = mock_cursor.execute.call_args[0][1]
    assert actual_params[0] == city_id
    # Verify all amenities are present in parameters, regardless of order
    for amenity in amenities:
        assert amenity in actual_params
    assert result == mock_cursor.fetchall.return_value

# Edge Cases
def test_fetch_network_nodes_handles_empty_amenities_list(mocker):
    """Test that function handles empty list of amenities and returns default apartment data."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.fetchall.return_value = [
        {"name": "apartment", "nodes": [{"id": 1, "name": "Node 1"}, {"id": 2, "name": "Node 2"}]}
    ]
    city_id = 1
    amenities = []  # No amenities passed

    # Act
    result = fetch_network_nodes(mock_cursor, city_id, amenities)

    # Assert
    mock_cursor.execute.assert_called_once()
    actual_sql = mock_cursor.execute.call_args[0][0]
    assert "SELECT name, nodes" in actual_sql
    assert "FROM network_nodes" in actual_sql
    assert "WHERE city_id = %s AND name IN" in actual_sql
    assert mock_cursor.execute.call_args[0][1] == (city_id, "apartment")
    assert result == mock_cursor.fetchall.return_value

# Error Cases
def test_fetch_network_nodes_raises_exception_for_invalid_city_id(mocker):
    """Test that function raises HTTPException for invalid city_id."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.execute.side_effect = Exception("Database error")
    city_id = -1  # Invalid city ID
    amenities = ["cafe", "park"]

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        fetch_network_nodes(mock_cursor, city_id, amenities)

    # Verify exception details
    assert excinfo.value.status_code == 500
    assert excinfo.value.detail == "Failed to fetch network nodes: Database error"

# =============================================================================
# Tests for fetch_apartment_geom_and_centroid function
# =============================================================================

# Success Cases
def test_fetch_apartment_geom_and_centroid_returns_correct_data(mocker):
    """Test that function returns correct data for given city_id."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.fetchall.return_value = [
        {
            "geom": '{"type":"Polygon","coordinates":[[[1,1],[1,2],[2,2],[2,1],[1,1]]]}',
            "centroid": '{"type":"Point","coordinates":[1.5,1.5]}',
            "properties": {"id": 1, "name": "apartment"}
        }
    ]
    city_id = 1

    # Act
    result = fetch_apartment_geom_and_centroid(mock_cursor, city_id)

    # Assert
    mock_cursor.execute.assert_called_once()
    actual_sql = mock_cursor.execute.call_args[0][0]
    assert "SELECT ST_AsGeoJSON(geom, 5) AS geom" in actual_sql
    assert "ST_AsGeoJSON(ST_Centroid(geom), 5) AS centroid" in actual_sql
    assert "FROM amenities" in actual_sql
    assert "WHERE city_id = %s AND name = 'apartment'" in actual_sql
    assert mock_cursor.execute.call_args[0][1] == (city_id,)
    assert result == mock_cursor.fetchall.return_value

# Edge Cases
def test_fetch_apartment_geom_and_centroid_handles_nonexistent_city_id(mocker):
    """Test that function returns empty list for nonexistent city_id."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.fetchall.return_value = []
    city_id = 999 # Assuming this is a city_id with no apartments

    # Act
    result = fetch_apartment_geom_and_centroid(mock_cursor, city_id)

    # Assert
    mock_cursor.execute.assert_called_once()
    actual_sql = mock_cursor.execute.call_args[0][0]
    assert "SELECT ST_AsGeoJSON(geom, 5) AS geom" in actual_sql
    assert "ST_AsGeoJSON(ST_Centroid(geom), 5) AS centroid" in actual_sql
    assert "FROM amenities" in actual_sql
    assert "WHERE city_id = %s AND name = 'apartment'" in actual_sql
    assert mock_cursor.execute.call_args[0][1] == (city_id,)
    assert result == []  # Function should return empty list

# Error Cases
def test_fetch_apartment_geom_and_centroid_raises_exception_for_invalid_city_id(mocker):
    """Test that function raises HTTPException for invalid city_id."""
    # Arrange
    mock_cursor = mocker.MagicMock()
    mock_cursor.execute.side_effect = Exception("Database error")
    city_id = -1  # Invalid city ID

    # Act & Assert
    with pytest.raises(HTTPException) as excinfo:
        fetch_apartment_geom_and_centroid(mock_cursor, city_id)

    # Verify exception details
    assert excinfo.value.status_code == 500
    assert excinfo.value.detail == "Failed to fetch apartment geometry and centroid: Database error"
    