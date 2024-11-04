import json
import time
from concurrent.futures import ThreadPoolExecutor
import geopandas as gpd
import psycopg2.pool
from shapely.geometry import Point, shape, mapping
from psycopg2 import DatabaseError
from fastapi import Depends, FastAPI, FastAPI, Depends, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from shapely.wkt import loads as load_wkt
from utils.geometry import set_centroid
from utils.networkx import deserialize_graph, find_suitable_apartment_network_nodes, retrieve_suitable_apartments

app = FastAPI()
pool = psycopg2.pool.SimpleConnectionPool(
    dsn="postgresql://postgres:postgres@postgis:5432/gis", minconn=2, maxconn=4
)

# Dependency to get a database connection
def get_connection():
    try:
        conn = pool.getconn()
        yield conn
    finally:
        pool.putconn(conn)

def polygon_to_bbox(polygon_wkt):
    """
    Convert a GEOMETRY(Polygon, 4326) to "south,west,north,east" format.
    
    Args:
        polygon_wkt (str): The WKT representation of the polygon.
    
    Returns:
        str: The bounding box in "south,west,north,east" format.
    """
    # Load the polygon from WKT
    polygon = load_wkt(polygon_wkt)
    
    # Get the bounding box (minx, miny, maxx, maxy)
    minx, miny, maxx, maxy = polygon.bounds
    
    # Format as "south,west,north,east"
    bbox_str = f"{miny},{minx},{maxy},{maxx}"
    
    return bbox_str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/geojsons")
def get_geojsons(city_id: int = Query(...), name: str = Query(...), conn=Depends(get_connection)):
    """
    Return GeoJSON features from the geojsons table based on city_id and name.
    """
    try:
        with conn.cursor() as cur:
            # Execute the query to fetch GeoJSON and properties
            cur.execute("""
                SELECT ST_AsGeoJSON(geom) AS geom, properties
                FROM geojsons
                WHERE city_id = %s AND name = %s
            """, (city_id, name))
            res = cur.fetchall()

        # Merge properties
        features = []
        for row in res:
            geojson = json.loads(row[0])
            properties = row[1]
            geojson['properties'] = properties
            features.append(geojson)

        # Return GeoJSON FeatureCollection
        return {
            "type": "FeatureCollection",
            "features": features,
        }

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

def fetch_network_graph(cur, city_id):
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
        
def fetch_nodes(cur, city_id):
    cur.execute("""
        SELECT name, nodes
        FROM network_nodes
        WHERE city_id = %s AND name IN ('park', 'supermarket', 'apartment')
    """, (city_id,))
    return cur.fetchall()

def fetch_geom(cur, city_id):
    cur.execute("""
        SELECT ST_AsText(geom) as geom
        FROM cities
        WHERE id = %s
    """, (city_id,))
    return cur.fetchone()

def fetch_centroids(cur, city_id):
    cur.execute("""
        SELECT ST_AsGeoJSON(ST_Centroid(geom)) AS centroid, properties
        FROM geojsons
        WHERE city_id = %s AND name = 'apartment'
    """, (city_id,))
    return cur.fetchall()

def fetch_geom_and_centroid(cur, city_id, name):
    cur.execute("""
        SELECT ST_AsGeoJSON(geom) AS geom, ST_AsGeoJSON(ST_Centroid(geom)) AS centroid, properties
        FROM geojsons
        WHERE city_id = %s AND name = %s
    """, (city_id, name))
    return cur.fetchall()

def create_geodataframe_with_centroid(rows):    
    geometries = []
    centroids = []
    properties_list = []

    for row in rows:
        try:
            if row[0] is None or row[1] is None:
                raise ValueError("Row contains None value")

            geom_json = json.loads(row[0])
            centroid_json = json.loads(row[1])
            properties = row[2]

            # Convert GeoJSON to shapely geometries
            geometry = shape(geom_json)
            centroid = Point(centroid_json['coordinates'])

            geometries.append(geometry)
            centroids.append(centroid)
            properties_list.append(properties)
        except (ValueError, TypeError) as e:
            print(f"Error processing row {row}: {e}")
        except Exception as e:
            print(f"Unexpected error processing row {row}: {e}")

    # Create GeoDataFrame
    try:
        gdf = gpd.GeoDataFrame(properties_list, geometry=geometries, crs="EPSG:4326")
        gdf['centroid'] = centroids
    except Exception as e:
        raise ValueError(f"Error creating GeoDataFrame: {e}")

    return gdf

@app.get("/analyze")
def analyze_suitable_apartments(city_id: int = Query(...), max_park_meter:int = Query(...), max_supermarket_meter:int = Query(...), conn=Depends(get_connection)):
    """
    Return the nodes JSONB list from the network_nodes table based on city_id and name.
    """
    try:
        with conn.cursor() as cur:
            # Use ThreadPoolExecutor to parallelize database queries
            with ThreadPoolExecutor() as executor:
                start_time1 = time.time()

                # Measure time for fetch_nodes
                start_time_nodes = time.time()
                future_nodes = executor.submit(fetch_nodes, cur, city_id)
                nodes_rows = future_nodes.result()
                end_time_nodes = time.time()
                print(f"Time taken for fetch_nodes: {end_time_nodes - start_time_nodes} seconds")

                # Measure time for fetch_geom_and_centroid
                start_time_geom_and_centroid = time.time()
                future_geom_and_centroid = executor.submit(fetch_geom_and_centroid, cur, city_id, "apartment")
                geom_centroid_rows = future_geom_and_centroid.result()
                end_time_geom_and_centroid = time.time()
                print(f"Time taken for fetch_geom_and_centroid: {end_time_geom_and_centroid - start_time_geom_and_centroid} seconds")

                # Measure time for fetch_network_graph
                start_time_graphs = time.time()
                future_graphs = executor.submit(fetch_network_graph, cur, city_id)
                graphs_row = future_graphs.result()
                end_time_graphs = time.time()
                print(f"Time taken for fetch_network_graph: {end_time_graphs - start_time_graphs} seconds")
                
                end_time1 = time.time()
                print(f"Execution time for ThreadPoolExecutor: {end_time1 - start_time1} seconds\n")

            # Store the results in a dictionary {name: nodes}
            nodes_dict = {row[0]: row[1] for row in nodes_rows}

            # Check if all required types are present
            missing = [name for name in ['park', 'supermarket', 'apartment'] if name not in nodes_dict]
            if missing:
                raise HTTPException(status_code=404, detail=f"No data found for the given city_id for: {', '.join(missing)}")

            apartment_nnodes = nodes_dict.get('apartment')
            supermarket_nnodes = nodes_dict.get('supermarket')
            park_nnodes = nodes_dict.get('park')

            try:
                G = deserialize_graph(graphs_row)
            except Exception as e:
                print(f"Error deserializing graph: {e}")
                raise HTTPException(status_code=500, detail=f"Error deserializing graph: {e}")

            start_time3 = time.time()
            try:
                # Find suitable apartment network nodes
                suitable_apartment_nnodes = find_suitable_apartment_network_nodes(
                    G, apartment_nnodes, park_nnodes, supermarket_nnodes, max_park_meter, max_supermarket_meter)
            except Exception as e:
                print(f"Error in find_suitable_apartment_network_nodes: {e}")
                raise HTTPException(status_code=500, detail=f"Error in find_suitable_apartment_network_nodes: {e}")
            end_time3 = time.time()
            print(f"Execution time for find_suitable_apartment_network_nodes: {end_time3 - start_time3} seconds\n")

            try:
                apartment_gdf = create_geodataframe_with_centroid(geom_centroid_rows)
            except Exception as e:
                print(f"Error creating GeoDataFrame: {e}")
                raise HTTPException(status_code=500, detail=f"Error creating GeoDataFrame: {e}")
            
            start_time4 = time.time()
            try:
                # Retrieve suitable apartment areas from network nodes
                suitable_apartment_gdf_with_geoms = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)
            except Exception as e:
                print(f"Error retrieving suitable apartments: {e}")
                raise HTTPException(status_code=500, detail=f"Error retrieving suitable apartments: {e}")
            end_time4 = time.time()
            print(f"Execution time for retrieve_suitable_apartments: {end_time4 - start_time4} seconds\n")

            suitable_apartment_polygon = (suitable_apartment_gdf_with_geoms.copy()).drop(columns=['centroid'])
            suitable_apartment_centroid = set_centroid(suitable_apartment_gdf_with_geoms.copy())

            return JSONResponse(content={
                "polygon": json.loads(suitable_apartment_polygon.to_json()),
                "centroid": json.loads(suitable_apartment_centroid.to_json())
            })

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")


app.mount("/", StaticFiles(directory="static"), name="static")
