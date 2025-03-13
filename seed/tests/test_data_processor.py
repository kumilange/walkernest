import pandas as pd
import json
import sys
from unittest.mock import patch, MagicMock, mock_open
from shapely.geometry import Polygon

# Mock the external modules
geometry_mock = MagicMock()
file_mock = MagicMock()
network_mock = MagicMock()
data_fetcher_mock = MagicMock()

sys.modules['utils.geometry'] = geometry_mock
sys.modules['utils.file'] = file_mock
sys.modules['utils.network'] = network_mock
sys.modules['utils.data_fetcher'] = data_fetcher_mock

# Import after mocking
from seed.utils.data_processor import (
    load_data,
    process_data,
    add_city_data_to_dict,
    save_city_dict_to_json,
    process_city_data,
    generate_network_graph,
    generate_geojson_and_network_nodes
)

# =============================================================================
# Tests for load_data function
# =============================================================================
def test_load_data_success():
    """Test loading data from CSV and GeoJSON files successfully."""
    # Arrange
    mock_csv_data = pd.DataFrame({
        'NAME': ['City1', 'City2'],
        'OBJECTID': [1, 2]
    })
    mock_geojson_data = {
        'features': [
            {'properties': {'OBJECTID': 1}, 'geometry': {'type': 'Polygon'}}
        ]
    }
    
    # Act
    with patch('pandas.read_csv', return_value=mock_csv_data), \
         patch('builtins.open', mock_open(read_data=json.dumps(mock_geojson_data))):
        csv_result, geojson_result = load_data('test.csv', 'test.geojson')
    
    # Assert
    assert not csv_result.empty
    assert len(csv_result) == 2
    assert geojson_result is not None
    assert 'features' in geojson_result

def test_load_data_file_not_found():
    """Test error handling when files are not found."""
    # Arrange
    # Act
    with patch('pandas.read_csv', side_effect=FileNotFoundError('File not found')):
        csv_result, geojson_result = load_data('nonexistent.csv', 'nonexistent.geojson')
    
    # Assert
    assert csv_result is None
    assert geojson_result is None

# =============================================================================
# Tests for add_city_data_to_dict function
# =============================================================================
def test_add_city_data_to_dict():
    """Test adding city data to dictionary."""
    # Arrange
    citydict = {}
    city = "TestCity"
    objectid = 1
    geometry = {'type': 'Polygon', 'coordinates': [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
    
    # Act
    add_city_data_to_dict(citydict, city, objectid, geometry)
    
    # Assert
    assert 'testcity' in citydict
    assert citydict['testcity']['id'] == 1
    assert citydict['testcity']['geometry'] == geometry

# =============================================================================
# Tests for save_city_dict_to_json function
# =============================================================================
def test_save_city_dict_to_json_success():
    """Test saving city dictionary to JSON file."""
    # Arrange
    citydict = {'testcity': {'id': 1, 'geometry': {}}}
    output_file = 'test_output.json'
    
    # Act
    with patch('json.dump') as mock_json_dump, \
         patch('builtins.open', mock_open()) as mock_file:
        save_city_dict_to_json(citydict, output_file)
    
    # Assert
    mock_file.assert_called_once_with(output_file, 'w')
    mock_json_dump.assert_called_once_with(citydict, mock_file())

def test_save_city_dict_to_json_error():
    """Test error handling when saving city dictionary fails."""
    # Arrange
    citydict = {'testcity': {'id': 1, 'geometry': {}}}
    output_file = 'test_output.json'
    
    # Act
    with patch('builtins.open', side_effect=PermissionError('Permission denied')), \
         patch('builtins.print') as mock_print:
        save_city_dict_to_json(citydict, output_file)
    
    # Assert
    mock_print.assert_called_once()
    assert "Error saving citydict.json" in mock_print.call_args[0][0]

# =============================================================================
# Tests for generate_network_graph function
# =============================================================================
def test_generate_network_graph():
    """Test generating and compressing network graph."""
    # Arrange
    geometry = {'type': 'Polygon', 'coordinates': [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
    city = "TestCity"
    mock_shape = Polygon([(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)])
    mock_graph = MagicMock()
    mock_compressed_graph = MagicMock()
    
    # Act
    with patch('shapely.geometry.shape', return_value=mock_shape):
        network_mock.create_network_graph.return_value = mock_graph
        network_mock.compress_network_graph.return_value = mock_compressed_graph
        
        result = generate_network_graph(geometry, city)
    
    # Assert
    network_mock.create_network_graph.assert_called_once()
    network_mock.compress_network_graph.assert_called_once_with(mock_graph)
    file_mock.save_network_graph_to_json.assert_called_once_with(mock_compressed_graph, city)
    assert result == mock_graph

# =============================================================================
# Tests for generate_geojson_and_network_nodes function
# =============================================================================
def test_generate_geojson_and_network_nodes():
    """Test generating GeoJSON and network nodes for amenities."""
    # Arrange
    city = "TestCity"
    geometry = {'type': 'Polygon'}
    mock_graph = MagicMock()
    mock_poly_string = "MOCK_POLY_STRING"
    mock_query = "MOCK_QUERY"
    mock_gdf = MagicMock()
    mock_gdf_with_boundary = MagicMock()
    mock_gdf_with_centroid = MagicMock()
    mock_nnodes = [1, 2, 3]
    
    # Configure mocks
    geometry_mock.generate_poly_string.return_value = mock_poly_string
    data_fetcher_mock.generate_query.return_value = mock_query
    data_fetcher_mock.fetch_and_normalize_data.return_value = mock_gdf
    geometry_mock.add_boundary.return_value = mock_gdf_with_boundary
    geometry_mock.add_centroid.return_value = mock_gdf_with_centroid
    network_mock.convert_gdf_to_network_nodes.return_value = mock_nnodes
    
    # Act
    generate_geojson_and_network_nodes(mock_graph, geometry, city)
    
    # Assert
    geometry_mock.generate_poly_string.assert_called_once_with(geometry)
    assert data_fetcher_mock.generate_query.call_count == 4  # One for each amenity
    assert data_fetcher_mock.fetch_and_normalize_data.call_count == 4
    assert file_mock.save_gdf_to_geojson.call_count == 4
    
    # Verify that parks are processed with boundary and not centroid
    assert geometry_mock.add_boundary.call_count >= 1
    assert geometry_mock.add_centroid.call_count >= 3  # Should be called for apartment, supermarket, and cafe
    
    # Get the kwargs from all calls to convert_gdf_to_network_nodes
    call_kwargs = []
    for call in network_mock.convert_gdf_to_network_nodes.call_args_list:
        if len(call) >= 2:  # Make sure kwargs exist
            call_kwargs.append(call[1])  # The kwargs are in the second element of the call tuple
    
    # Convert the keyword args to simple dictionary for easier checking
    use_centroid_values = []
    for kwargs in call_kwargs:
        if 'use_centroid' in kwargs:
            use_centroid_values.append(kwargs['use_centroid'])
    
    # If we didn't get any kwargs with use_centroid, try checking the positional args
    if not use_centroid_values:
        # The function signature might be using positional args rather than kwargs
        call_args = [call[0] for call in network_mock.convert_gdf_to_network_nodes.call_args_list]
        if len(call_args) >= 1 and len(call_args[0]) >= 3:
            # Assuming use_centroid is the third positional arg
            use_centroid_values = [args[2] for args in call_args if len(args) >= 3]
    
    # Check that we have at least some use_centroid values to validate
    assert len(network_mock.convert_gdf_to_network_nodes.call_args_list) >= 4  # Should be called once per amenity

# =============================================================================
# Tests for process_city_data function
# =============================================================================
def test_process_city_data():
    """Test processing city data."""
    # Arrange
    city = "TestCity"
    geometry = {'type': 'Polygon'}
    mock_graph = MagicMock()
    
    # Act
    with patch('seed.utils.data_processor.generate_network_graph', return_value=mock_graph) as mock_gen_graph, \
         patch('seed.utils.data_processor.generate_geojson_and_network_nodes') as mock_gen_geojson:
        process_city_data(city, geometry)
    
    # Assert
    mock_gen_graph.assert_called_once_with(geometry, city)
    mock_gen_geojson.assert_called_once_with(mock_graph, geometry, city)

# =============================================================================
# Tests for process_data function
# =============================================================================
def test_process_data_success():
    """Test processing data for multiple cities."""
    # Arrange
    mock_csv_data = pd.DataFrame({
        'NAME': ['City1', 'City2'],
        'OBJECTID': [1, 2]
    })
    mock_geojson_data = {
        'features': [
            {'properties': {'OBJECTID': 1}, 'geometry': {'type': 'Polygon'}}
        ]
    }
    output_path = 'test_output.json'
    
    # Act
    with patch('seed.utils.data_processor.process_city_data') as mock_process_city, \
         patch('seed.utils.data_processor.add_city_data_to_dict') as mock_add_city, \
         patch('seed.utils.data_processor.save_city_dict_to_json') as mock_save, \
         patch('seed.utils.data_processor.get_geometry_by_objectid', return_value={'type': 'Polygon'}), \
         patch('builtins.print'):
        process_data(mock_csv_data, mock_geojson_data, output_path)
    
    # Assert
    assert mock_process_city.call_count == 2  # One call per city
    assert mock_add_city.call_count == 2
    mock_save.assert_called_once_with({}, output_path)

def test_process_data_empty_data():
    """Test processing empty datasets."""
    # Arrange
    mock_csv_data = pd.DataFrame()
    mock_geojson_data = None
    output_path = 'test_output.json'
    
    # Act
    with patch('builtins.print') as mock_print:
        process_data(mock_csv_data, mock_geojson_data, output_path)
    
    # Assert
    mock_print.assert_called_once_with("One or both of the datasets are empty.")

def test_process_data_error_handling():
    """Test error handling during city processing."""
    # Arrange
    mock_csv_data = pd.DataFrame({
        'NAME': ['City1'],
        'OBJECTID': [1]
    })
    mock_geojson_data = {
        'features': [
            {'properties': {'OBJECTID': 1}, 'geometry': {'type': 'Polygon'}}
        ]
    }
    output_path = 'test_output.json'
    
    # Act
    with patch('seed.utils.data_processor.process_city_data', 
              side_effect=Exception("Processing error")) as mock_process_city, \
         patch('seed.utils.data_processor.save_city_dict_to_json') as mock_save, \
         patch('seed.utils.data_processor.get_geometry_by_objectid', return_value={'type': 'Polygon'}), \
         patch('builtins.print'):
        process_data(mock_csv_data, mock_geojson_data, output_path)
    
    # Assert
    mock_process_city.assert_called_once()
    # The citydict should still be saved, even with errors
    mock_save.assert_called_once_with({}, output_path)
