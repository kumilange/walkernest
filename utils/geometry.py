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
