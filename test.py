import osmnx as ox
import geopandas as gpd
import requests
from shapely.geometry import Point, Polygon, MultiPolygon
import pandas as pd

def main():
    def get_overpass_data(query):
        overpass_url = "http://overpass-api.de/api/interpreter"
        response = requests.get(overpass_url, params={'data': query})
        data = response.json()
        return data

    # Queries for leisure and building data
    leisure_query = """
    [out:json][timeout:25][bbox:39.629,-105.212,39.739,-105.068];
    (
    way["leisure"="park"];
    way["leisure"="dog_park"];
    );
    out body geom;
    >;
    out skel qt;
    """

    building_query = """
    [out:json][timeout:25][bbox:39.629,-105.212,39.739,-105.068];
    (
    nwr["building"="apartments"];
    nwr["building"="residential"];
    );
    out body geom;
    >;
    out skel qt;
    """

    # Fetch data
    leisure_data = get_overpass_data(leisure_query)
    building_data = get_overpass_data(building_query)

    # Convert leisure data to GeoDataFrame
    leisure_features = []
    for element in leisure_data['elements']:
        if 'geometry' in element:
            coords = [(point['lon'], point['lat']) for point in element['geometry']]
            polygon = Polygon(coords)
            leisure_features.append({
                'id': element['id'],
                'geometry': polygon
            })

    leisure_gdf = gpd.GeoDataFrame(leisure_features, crs="EPSG:4326")

    # Convert building data to GeoDataFrame
    building_features = []
    for element in building_data['elements']:
        if 'geometry' in element:
            coords = [(point['lon'], point['lat']) for point in element['geometry']]
            if element['type'] == 'node':
                point = Point(coords[0])
                building_features.append({
                    'id': element['id'],
                    'geometry': point
                })
            else:
                if len(coords) > 2:
                    polygon = Polygon(coords)
                    building_features.append({
                        'id': element['id'],
                        'geometry': polygon
                    })

    building_gdf = gpd.GeoDataFrame(building_features, crs="EPSG:4326")

    # Buffer leisure areas by 1000 meters
    leisure_gdf = leisure_gdf.to_crs(epsg=3857)  # Reproject to a metric CRS for accurate buffering
    buffered_leisure_gdf = leisure_gdf.buffer(400)  # Buffer by 1000 meters

    # Spatial Join to find buildings within the buffer
    building_gdf = building_gdf.to_crs(epsg=3857)  # Ensure same CRS for accurate spatial join
    building_within_buffer = gpd.sjoin(building_gdf, gpd.GeoDataFrame(geometry=buffered_leisure_gdf), how='inner', predicate='intersects')

    # Reproject back to original CRS (WGS 84)
    building_within_buffer = building_within_buffer.to_crs(epsg=4326)

    # Output the overlapped buildings
    print(building_within_buffer)
    building_within_buffer.to_file(f"filtered_buildings.geojson", driver='GeoJSON')

if __name__ == "__main__":
    main()