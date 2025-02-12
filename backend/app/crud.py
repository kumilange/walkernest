from fastapi import HTTPException 

def fetch_favorites(cur, ids):
    """Fetch favorite amenities by their IDs."""
    # Convert ids to a tuple for the SQL IN clause
    ids_tuple = tuple(ids)
    
    # Execute the query to fetch centroid GeoJSON and properties
    cur.execute("""
        SELECT ST_AsGeoJSON(ST_Centroid(geom), 5) AS centroid, properties, city_id
        FROM amenities
        WHERE (properties->>'id')::bigint IN %s
    """, (ids_tuple,))
    
    return cur.fetchall()

def fetch_amenities(cur, city_id, name, is_centroid):
    """Fetch amenities by city ID and name, optionally fetching centroids."""
    if is_centroid:
        # Execute the query to fetch centroid GeoJSON and properties
        cur.execute("""
            SELECT ST_AsGeoJSON(ST_Centroid(geom), 5) AS centroid, properties
            FROM amenities
            WHERE city_id = %s AND name = %s
        """, (city_id, name))
    else:
        # Execute the query to fetch normal GeoJSON and properties
        cur.execute("""
            SELECT ST_AsGeoJSON(geom, 5) AS geom, properties
            FROM amenities
            WHERE city_id = %s AND name = %s
        """, (city_id, name))
    return cur.fetchall()

def fetch_network_graph(cur, city_id):
    """Fetch the network graph for a given city ID."""
    cur.execute("""
        SELECT graph
        FROM network_graphs
        WHERE city_id = %s
    """, (city_id,))
    row = cur.fetchone()
    if row:
        return row[0]
    else:
        raise HTTPException(status_code=404, detail="Network graph not found")

def fetch_network_nodes(cur, city_id, amenities):
    """Fetch network nodes for given amenities in a city."""
    amenities = set(amenities)
    # Ensure 'apartment' is always included
    amenities.add('apartment')

    query = """
        SELECT name, nodes
        FROM network_nodes
        WHERE city_id = %s AND name IN ({})
    """.format(','.join(['%s'] * len(amenities)))

    cur.execute(query, (city_id, *amenities))
    return cur.fetchall()

def fetch_apartment_geom_and_centroid(cur, city_id):
    """Fetch geometry and centroid for apartments in a city."""
    cur.execute("""
        SELECT ST_AsGeoJSON(geom, 5) AS geom, ST_AsGeoJSON(ST_Centroid(geom), 5) AS centroid, properties
        FROM amenities
        WHERE city_id = %s AND name = 'apartment'
    """, (city_id,))
    return cur.fetchall()
