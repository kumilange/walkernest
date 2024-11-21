import json
import geopandas as gpd
from shapely.geometry import shape, Polygon, Point, LineString, MultiPolygon, MultiLineString

def get_geometry_by_objectid(geojson_data, objectid):
    """
    Get the geometry for a given OBJECTID from the GeoJSON data.

    Parameters:
    geojson_data (dict): GeoJSON data in JSON format.
    objectid (str or int): The OBJECTID to search for.

    Returns:
    shapely.geometry.base.BaseGeometry: The geometry for the given OBJECTID.
    """
    try:
        # Iterate through the features in the GeoJSON data
        for feature in geojson_data['features']:
            if feature['properties']['OBJECTID'] == objectid:
                return feature['geometry']
        raise ValueError(f"OBJECTID {objectid} not found in the data")
    except Exception as e:
        print(f"Unexpected error accessing geometry for OBJECTID {objectid}: {e}")
        raise
    
def generate_poly_string(geometry, tolerance=0.01):
    # Convert GeoJSON to Shapely geometry
    shapely_geometry = shape(geometry)

    # Simplify the geometry
    simplified_geometry = shapely_geometry.simplify(tolerance, preserve_topology=True)

    # Generate polygon string
    poly_strings = []

    if isinstance(simplified_geometry, MultiPolygon):
        for polygon in simplified_geometry.geoms:
            coordinates = list(polygon.exterior.coords)
            poly_string = " ".join([f"{lat} {lon}" for lon, lat in coordinates])
            poly_strings.append(poly_string)
    elif isinstance(simplified_geometry, Polygon):
        coordinates = list(simplified_geometry.exterior.coords)
        poly_string = " ".join([f"{lat} {lon}" for lon, lat in coordinates])
        poly_strings.append(poly_string)
    else:
        raise TypeError("Unsupported geometry type")

    return " ".join(poly_strings)

def add_centroid(gdf):
    def get_centroid(geometry):
        if isinstance(geometry, (Point, Polygon, MultiPolygon)):
            return geometry.centroid
        return None

    gdf['centroid'] = gdf['geometry'].apply(get_centroid)
    
    return gdf

def set_centroid(gdf):
    """
    Replace the geometry of each feature in the GeoDataFrame with its centroid.
    """
    # Re-project to a projected CRS (e.g., UTM)
    projected_gdf = gdf.to_crs(epsg=3395)  # World Mercator projection

    # Calculate centroids in the projected CRS
    projected_gdf['geometry'] = projected_gdf.geometry.centroid

    # Re-project back to the original CRS
    gdf['geometry'] = projected_gdf.to_crs(gdf.crs).geometry

    # Check if the 'centroid' column exists before dropping it
    if 'centroid' in gdf.columns:
        gdf = gdf.drop(columns=['centroid'])

    return gdf

def add_boundary(gdf):
    """
    Set the geometry to the boundary of each geometry in the GeoDataFrame.
    """
    def get_boundary(geometry):
        if isinstance(geometry, Point):
            return geometry
        elif isinstance(geometry, Polygon):
            return geometry.boundary
        elif isinstance(geometry, LineString):
            return geometry
        elif isinstance(geometry, MultiPolygon):
            boundaries = []
            for part in geometry.geoms:
                if isinstance(part.boundary, MultiLineString):
                    boundaries.extend(part.boundary.geoms)
                else:
                    boundaries.append(part.boundary)
            return MultiLineString(boundaries)
        elif isinstance(geometry, MultiLineString):
            return MultiLineString([part for part in geometry.geoms])
        else:
            raise TypeError("Unsupported geometry type")

    gdf['boundary'] = gdf.geometry.apply(get_boundary)
    return gdf


def create_geometry(element, nodes):
    if element['type'] == 'node':
        return Point(element['lon'], element['lat'])
    elif element['type'] == 'way':
        way_nodes = element['nodes']
        way_geometry = [Point(nodes[node_id]['lon'], nodes[node_id]['lat']) for node_id in way_nodes]
        if way_geometry[0] == way_geometry[-1]:
            return Polygon(way_geometry)
        else:
            return LineString(way_geometry)
    elif element['type'] == 'relation':
        outer = []
        inners = []
        for member in element['members']:
            member_geometry = [Point(coord['lon'], coord['lat']) for coord in member['geometry']]
            if member['role'] == 'outer' and len(member_geometry) >= 4:
                outer.append(member_geometry)
            elif member['role'] == 'inner' and len(member_geometry) >= 4:
                inners.append(member_geometry)
        if outer:
            if len(outer) == 1:
                return Polygon(outer[0], inners)
            else:
                return MultiPolygon([Polygon(o, inners) for o in outer if len(o) >= 4])
    return None

def filter_properties(element):
    props = element['tags'] if 'tags' in element else {}
    return {k: v for k, v in props.items() if k in ['building', 'shop', 'leisure', 'name']}

def create_gdf_with_centroid(geom_centroid_rows):
    try:
        # Parse rows with list comprehensions for better performance
        parsed_data = [
            (
                shape(json.loads(row[0])),
                Point(json.loads(row[1])['coordinates']),
                row[2]
            )
            for row in geom_centroid_rows
            if row[0] and row[1]  # Skip rows with None or empty strings
        ]
        
        # Separate parsed data into respective columns
        geometries, centroids, properties_list = zip(*parsed_data)

        # Create GeoDataFrame in a single step
        gdf = gpd.GeoDataFrame(
            list(properties_list),
            geometry=list(geometries),
            crs="EPSG:4326"
        )
        gdf['centroid'] = list(centroids)

        return gdf

    except Exception as e:
        raise ValueError(f"Error creating GeoDataFrame: {e}")
    # try:
    #     parsed_data = []
    #     for row in geom_centroid_rows:
    #         if len(row) < 3 or not row[0] or not row[1]:  # Validate row length and content
    #             continue
    #         geometry = shape(json.loads(row[0]))
    #         centroid = Point(json.loads(row[1])['coordinates'])
    #         properties = row[2]
    #         parsed_data.append((geometry, centroid, properties))

    #     if not parsed_data:
    #         raise ValueError("No valid data to create GeoDataFrame")
        
    #     geometries, centroids, properties_list = zip(*parsed_data)

    #     gdf = gpd.GeoDataFrame(
    #         list(properties_list),
    #         geometry=list(geometries),
    #         crs="EPSG:4326"
    #     )
    #     gdf['centroid'] = list(centroids)

    #     return gdf
    # except Exception as e:
    #     raise ValueError(f"Error creating GeoDataFrame: {e}")


