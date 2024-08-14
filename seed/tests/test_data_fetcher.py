import pytest
import geopandas as gpd
import sys
from unittest.mock import patch, MagicMock
from shapely.geometry import Point, Polygon

# Mock the utils.geometry module
geometry_mock = MagicMock()
sys.modules['utils.geometry'] = geometry_mock

from seed.utils.data_fetcher import create_gdf, fetch_and_normalize_data

# =============================================================================
# Tests for create_gdf function
# =============================================================================
def test_create_gdf_with_valid_data():
    """Test creating GeoDataFrame from valid OSM data with different element types."""
    # Arrange
    mock_data = {
        'elements': [
            {
                'type': 'node',
                'id': 1,
                'lat': 40.7128,
                'lon': -74.0060,
                'tags': {'amenity': 'cafe', 'name': 'Test Cafe'}
            },
            {
                'type': 'way',
                'id': 2,
                'nodes': [1, 3, 4, 1],  # Closed way (polygon)
                'tags': {'building': 'yes', 'name': 'Test Building'}
            },
            {
                'type': 'node',
                'id': 3,
                'lat': 40.7130,
                'lon': -74.0065,
                'tags': {}  # No tags, should be skipped
            },
            {
                'type': 'node',
                'id': 4,
                'lat': 40.7135,
                'lon': -74.0055,
                'tags': {'highway': 'traffic_signals'}  # Valid tags
            }
        ]
    }
    
    # Act
    geometry_mock.create_geometry.side_effect = [
        Point(-74.0060, 40.7128),  # Node 1
        Polygon([(-74.0060, 40.7128), (-74.0065, 40.7130), (-74.0055, 40.7135), (-74.0060, 40.7128)]),  # Way 2
        None,  # Node 3 (will be combined with empty properties to be skipped)
        Point(-74.0055, 40.7135)  # Node 4
    ]
    
    geometry_mock.filter_properties.side_effect = [
        {'amenity': 'cafe', 'name': 'Test Cafe'},  # Node 1
        {'building': 'yes', 'name': 'Test Building'},  # Way 2
        {},  # Node 3 (empty, will cause this element to be skipped)
        {'highway': 'traffic_signals'}  # Node 4
    ]
    
    result = create_gdf(mock_data)
    
    # Assert
    assert isinstance(result, gpd.GeoDataFrame)
    assert len(result) == 3  # Only 3 elements have both geometry and properties
    assert result.crs == "EPSG:4326"
    assert 'id' in result.columns
    assert set(result['id']) == {1, 2, 4}  # Node 3 should be skipped

def test_create_gdf_with_empty_data():
    """Test creating GeoDataFrame from empty OSM data."""
    # Arrange
    mock_data = {'elements': []}
    
    # Act
    result = create_gdf(mock_data)
    
    # Assert
    assert isinstance(result, gpd.GeoDataFrame)
    assert len(result) == 0
    assert result.crs == "EPSG:4326"

def test_create_gdf_with_no_valid_elements():
    """Test creating GeoDataFrame from data that results in no valid geometries."""
    # Arrange
    mock_data = {
        'elements': [
            {
                'type': 'node',
                'id': 1,
                'lat': 40.7128,
                'lon': -74.0060,
                'tags': {'amenity': 'cafe', 'name': 'Test Cafe'}
            },
            {
                'type': 'node',
                'id': 2,
                'lat': 40.7130,
                'lon': -74.0065,
                'tags': {'highway': 'traffic_signals'}
            }
        ]
    }
    
    # Act
    # Reset any previous side_effects
    geometry_mock.create_geometry.reset_mock()
    geometry_mock.filter_properties.reset_mock()
    
    # Configure side_effects with lists that match the number of elements
    geometry_mock.create_geometry.side_effect = [None, None]
    geometry_mock.filter_properties.side_effect = [{}, {}]
    
    result = create_gdf(mock_data)
    
    # Assert
    assert isinstance(result, gpd.GeoDataFrame)
    assert len(result) == 0
    assert result.crs == "EPSG:4326"
    assert geometry_mock.create_geometry.call_count == 2
    assert geometry_mock.filter_properties.call_count == 2

# =============================================================================
# Tests for fetch_and_normalize_data function
# =============================================================================
def test_fetch_and_normalize_data_success():
    """Test fetching and normalizing data with a valid query."""
    # Arrange
    test_query = 'node["amenity"="cafe"](40.7,-74.0,40.8,-73.9);'
    mock_osm_data = {
        'elements': [
            {
                'type': 'node',
                'id': 1,
                'lat': 40.7128,
                'lon': -74.0060,
                'tags': {'amenity': 'cafe', 'name': 'Test Cafe'}
            }
        ]
    }
    
    mock_gdf = gpd.GeoDataFrame(
        [{'amenity': 'cafe', 'name': 'Test Cafe', 'id': 1}],
        geometry=[Point(-74.0060, 40.7128)],
        crs="EPSG:4326"
    )
    
    # Act
    with patch('seed.utils.data_fetcher.fetch_data_from_overpass') as mock_fetch, \
         patch('seed.utils.data_fetcher.create_gdf', return_value=mock_gdf) as mock_create_gdf:
        
        mock_fetch.return_value = mock_osm_data
        
        result = fetch_and_normalize_data(test_query)
    
    # Assert
    assert isinstance(result, gpd.GeoDataFrame)
    assert len(result) == 1
    assert result.crs == "EPSG:4326"
    assert 'amenity' in result.columns
    assert result.iloc[0]['amenity'] == 'cafe'
    mock_fetch.assert_called_once_with(test_query)
    mock_create_gdf.assert_called_once_with(mock_osm_data)

def test_fetch_and_normalize_data_empty_result():
    """Test fetching and normalizing data with a query that returns no results."""
    # Arrange
    test_query = 'node["amenity"="nonexistent"](40.7,-74.0,40.8,-73.9);'
    mock_osm_data = {'elements': []}
    mock_gdf = gpd.GeoDataFrame([], geometry=[], crs="EPSG:4326")
    
    # Act
    with patch('seed.utils.data_fetcher.fetch_data_from_overpass') as mock_fetch, \
         patch('seed.utils.data_fetcher.create_gdf', return_value=mock_gdf) as mock_create_gdf:
        
        mock_fetch.return_value = mock_osm_data
        
        result = fetch_and_normalize_data(test_query)
    
    # Assert
    assert isinstance(result, gpd.GeoDataFrame)
    assert len(result) == 0
    assert result.crs == "EPSG:4326"
    mock_fetch.assert_called_once_with(test_query)
    mock_create_gdf.assert_called_once_with(mock_osm_data)

def test_fetch_and_normalize_data_api_error_handling():
    """Test handling of API errors during data fetching."""
    # Arrange
    test_query = 'node["amenity"="cafe"](40.7,-74.0,40.8,-73.9);'
    
    # Act & Assert
    with patch('seed.utils.data_fetcher.fetch_data_from_overpass') as mock_fetch:
        mock_fetch.side_effect = Exception("API Error")
        
        with pytest.raises(Exception, match="API Error"):
            fetch_and_normalize_data(test_query)
        
        mock_fetch.assert_called_once_with(test_query)
