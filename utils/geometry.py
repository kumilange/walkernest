from shapely.geometry import Polygon, Point, LineString, MultiPolygon, MultiLineString

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
    gdf['geometry'] = gdf.geometry.centroid
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
        elif isinstance(geometry, (MultiPolygon, MultiLineString)):
            return MultiLineString([part.boundary for part in geometry.geoms])
        else:
            raise TypeError("Unsupported geometry type")

    gdf['boundary'] = gdf.geometry.apply(get_boundary)
    return gdf

def drop_additional_geometry_columns(gdf):
    """
    Drop additional geometry columns from a GeoDataFrame if any.

    Parameters:
    gdf (gpd.GeoDataFrame): The GeoDataFrame to process.

    Returns:
    gpd.GeoDataFrame: The GeoDataFrame with additional geometry columns removed.
    """
    geometry_column = gdf.geometry.name
    for col in gdf.columns:
        if col != geometry_column and gdf[col].dtype == 'geometry':
            gdf = gdf.drop(columns=[col])
    return gdf