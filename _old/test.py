import osmnx as ox
import geopandas as gpd
import requests
from shapely.geometry import Point, LineString, Polygon, MultiPolygon
import pandas as pd

def generate_query(bbox, key_value_pairs):
    """
    Generates an Overpass API query based on the bounding box and key-value pairs.
    
    :param bbox: The bounding box for the query.
    :param key_value_pairs: A list of tuples containing key-value pairs for the query.
    :return: A formatted Overpass API query string.
    """
    query = f"[out:json][timeout:25][bbox:{bbox}];\n(\n"
    for key, value in key_value_pairs:
        query += f'  nwr["{key}"="{value}"];\n'
    query += ");\nout geom;\n>;\nout skel qt;\n"
    return query

def fetch_data(query, bbox):
    """
    Fetch data from the Overpass API based on the provided query template and bounding box.

    Parameters:
    query (str): The Overpass API query template with a placeholder for the bounding box.
    bbox (str): The bounding box coordinates in the format "min_lat,min_lon,max_lat,max_lon".

    Returns:
    dict: The JSON response from the Overpass API.
    """
    query = query.format(bbox=bbox)
    overpass_url = "http://overpass-api.de/api/interpreter"
    
    try:
        response = requests.get(overpass_url, params={'data': query})
        response.raise_for_status()
        data = response.json()
        return data
    except requests.RequestException as e:
        print(f"Error fetching data from Overpass API: {e}")
        return None

def normalize_data(data):
    """
    Normalize the fetched data from the Overpass API into a GeoDataFrame.

    Parameters:
    data (dict): The JSON response from the Overpass API.

    Returns:
    gpd.GeoDataFrame: A GeoDataFrame containing the normalized data.
    """
    # A dictionary to store nodes by their ID for lookup
    elements = data['elements']
    nodes = {element['id']: element for element in elements if element['type'] == 'node'}

    # Parse the Overpass API Data
    geometry = []
    properties = []

    for element in elements:
        if element['type'] == 'node':
            # For nodes, create a Point
            point = Point(element['lon'], element['lat'])
            props = element['tags'] if 'tags' in element else {}
            filtered_props = {k: v for k, v in props.items() if k in ['building', 'shop', 'leisure', 'name']}
            if filtered_props:
                geometry.append(point)
                properties.append(filtered_props)
        elif element['type'] == 'way':
            # For ways, create a LineString or Polygon from the node references
            way_nodes = element['nodes']
            way_geometry = [Point(nodes[node_id]['lon'], nodes[node_id]['lat']) for node_id in way_nodes]
            if way_geometry[0] == way_geometry[-1]:
                # If the first and last nodes are the same, it's a closed way (Polygon)
                geom = Polygon(way_geometry)
            else:
                # Otherwise, it's a LineString
                geom = LineString(way_geometry)
            props = element['tags'] if 'tags' in element else {}
            filtered_props = {k: v for k, v in props.items() if k in ['building', 'shop', 'leisure', 'name']}
            if filtered_props:
                geometry.append(geom)
                properties.append(filtered_props)
        elif element['type'] == 'relation':
            # For relations, handle multipolygon
            outer = []
            inners = []
            for member in element['members']:
                member_geometry = [Point(coord['lon'], coord['lat']) for coord in member['geometry']]
                if member['role'] == 'outer':
                    if len(member_geometry) >= 4:  # Ensure at least 4 coordinates
                        outer.append(member_geometry)
                elif member['role'] == 'inner':
                    if len(member_geometry) >= 4:  # Ensure at least 4 coordinates
                        inners.append(member_geometry)
            if outer:
                if len(outer) == 1:
                    geom = Polygon(outer[0], inners)
                else:
                    geom = MultiPolygon([Polygon(o, inners) for o in outer if len(o) >= 4])
                props = element['tags'] if 'tags' in element else {}
                filtered_props = {k: v for k, v in props.items() if k in ['building', 'shop', 'leisure', 'name']}
                if filtered_props:
                    geometry.append(geom)
                    properties.append(filtered_props)

    # Create the GeoDataFrame
    gdf = gpd.GeoDataFrame(properties, geometry=geometry, crs="EPSG:4326")

    return gdf

def main():
    bbox = "39.629,-105.212,39.739,-105.068"
    south, west, north, east = map(float, bbox.split(','))
    print(north, south, east, west)
    # Create a network graph of the area
    G = ox.graph_from_bbox(north, south, east, west, network_type='walk')

    # Generate the queries
    residential_query = generate_query(bbox, [("building", "apartments"), ("building", "residential")])
    supermarket_query = generate_query(bbox, [("shop", "supermarket"), ("shop", "grocery")])
    park_query = generate_query(bbox, [("leisure", "park"), ("leisure", "dog_park")])

    # Fetch data from the Overpass API
    park_gdf = normalize_data(fetch_data(park_query, bbox))
    supermarket_gdf = normalize_data(fetch_data(supermarket_query, bbox))
    residential_gdf = normalize_data(fetch_data(residential_query, bbox))

    # Buffer leisure areas
    park_gdf = park_gdf.to_crs(epsg=3857)  # Reproject to a metric CRS for accurate buffering
    supermarket_gdf = supermarket_gdf.to_crs(epsg=3857)
    buffered_park_gdf = (park_gdf.buffer(400)).to_crs(epsg=4326)  # Buffer by 400 meters
    buffered_supermarket_gdf = (supermarket_gdf.buffer(1000)).to_crs(epsg=4326)

    # Convert buffered geometries to GeoDataFrames
    buffered_park_gdf = gpd.GeoDataFrame(geometry=buffered_park_gdf, crs="EPSG:4326")
    buffered_supermarket_gdf = gpd.GeoDataFrame(geometry=buffered_supermarket_gdf, crs="EPSG:4326")

    # Find the intersection
    intersection_gdf = gpd.overlay(buffered_park_gdf, buffered_supermarket_gdf, how='intersection')
    # Ensure intersection_gdf is a GeoDataFrame
    intersection_gdf = gpd.GeoDataFrame(intersection_gdf, geometry='geometry')
    intersection_gdf.to_file(f"intersection_gdf.geojson", driver='GeoJSON')

    # Spatial Join to find buildings within the buffer
    # residential_gdf = residential_gdf.to_crs(epsg=3857)  # Ensure same CRS for accurate spatial join
    building_within_buffer = gpd.sjoin(residential_gdf, intersection_gdf, how='inner', predicate='intersects')

    # Reproject back to original CRS (WGS 84)
    building_within_buffer = building_within_buffer.to_crs(epsg=4326)

    # Output the overlapped buildings
    print(building_within_buffer)
    building_within_buffer.to_file(f"filtered_buildings.geojson", driver='GeoJSON')

if __name__ == "__main__":
    main()