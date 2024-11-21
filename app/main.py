import json
import time
import psycopg2.pool
from psycopg2 import DatabaseError
from concurrent.futures import ThreadPoolExecutor
from fastapi import Depends, FastAPI, FastAPI, Depends, Query, HTTPException
from fastapi.responses import JSONResponse, ORJSONResponse
from fastapi.middleware.cors import CORSMiddleware
from utils.geometry import set_centroid, create_gdf_with_centroid
from utils.networkx import deserialize_graph, find_suitable_apartment_network_nodes, retrieve_suitable_apartments

app = FastAPI()
pool = psycopg2.pool.SimpleConnectionPool(
    dsn="postgresql://postgres:postgres@postgis:5432/gis", minconn=2, maxconn=4
)
# Define the origins that should be allowed to make cross-origin requests
origins = [
    "http://localhost:5173",  # Your frontend URL
    "http://localhost:3000",  # Your backend URL 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a database connection
def get_connection():
    try:
        conn = pool.getconn()
        try:
            yield conn
        finally:
            pool.putconn(conn)
    except DatabaseError:
        raise HTTPException(status_code=503, detail="Database connection pool exhausted")

def fetch_favorites(cur, ids):
    # Convert ids to a tuple for the SQL IN clause
    ids_tuple = tuple(ids)
    
    # Execute the query to fetch normal GeoJSON and properties
    cur.execute("""
        SELECT ST_AsGeoJSON(ST_Centroid(geom)) AS centroid, properties, city_id
        FROM geojsons
        WHERE (properties->>'id')::bigint IN %s
    """, (ids_tuple,))
    
    return cur.fetchall()

def fetch_geojson(cur, city_id, name, is_centroid):
    if is_centroid:
        # Execute the query to fetch centroid GeoJSON and properties
        cur.execute("""
            SELECT ST_AsGeoJSON(ST_Centroid(geom)) AS centroid, properties
            FROM geojsons
            WHERE city_id = %s AND name = %s
        """, (city_id, name))
    else:
        # Execute the query to fetch normal GeoJSON and properties
        cur.execute("""
            SELECT ST_AsGeoJSON(geom, 5) AS geom, properties
            FROM geojsons
            WHERE city_id = %s AND name = %s
        """, (city_id, name))
    return cur.fetchall()

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

def fetch_geom_and_centroid(cur, city_id):
    cur.execute("""
        SELECT ST_AsGeoJSON(geom) AS geom, ST_AsGeoJSON(ST_Centroid(geom)) AS centroid, properties
        FROM geojsons
        WHERE city_id = %s AND name = 'apartment'
    """, (city_id,))
    return cur.fetchall()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/favorites")
def get_favorites(ids: list = Query(...), conn=Depends(get_connection)):
    """
    Return List of feature from the geojsons table based on property IDs.
    """
    try:
        with conn.cursor() as cur:
            res = fetch_favorites(cur, ids)
            
            features = []
            geojson = {}
            for row in res:
                geojson = {
                    'type': "Feature",
                    'geometry': json.loads(row[0]),
                    'properties': row[1],
                }
                features.append(geojson)

            return JSONResponse(content=features)

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@app.get("/geojsons")
def get_geojsons(city_id: int = Query(...), name: str = Query(...), is_centroid: bool = Query(False), conn=Depends(get_connection)):
    """
    Return GeoJSON FeatureCollection from the geojsons table based on city_id and name.
    """
    try:
        with conn.cursor() as cur:
            res = fetch_geojson(cur, city_id, name, is_centroid)

            # Merge properties
            features = []
            geojson = {}
            for row in res:
                geojson = {
                    'type': "Feature",
                    'geometry': json.loads(row[0]),
                    'properties': row[1]
                }
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
    
@app.get("/analyze")
def analyze_suitable_apartments(city_id: int = Query(...), max_park_meter:int = Query(...), max_supermarket_meter:int = Query(...), conn=Depends(get_connection)):
    """
    Return the nodes JSONB list from the network_nodes table based on city_id and name.
    """
    try:
        start_time0 = time.time()
        with conn.cursor() as cur:
            # Use ThreadPoolExecutor to parallelize database queries
            with ThreadPoolExecutor() as executor:
                start_time1 = time.time()
                future_geom_and_centroid = executor.submit(fetch_geom_and_centroid, cur, city_id)
                geom_centroid_rows = future_geom_and_centroid.result()
                future_nodes = executor.submit(fetch_nodes, cur, city_id)
                nodes_rows = future_nodes.result()
                future_graphs = executor.submit(fetch_network_graph, cur, city_id)
                graphs_row = future_graphs.result()

                end_time1 = time.time()
                print(f"Execution time for ThreadPoolExecutor: {end_time1 - start_time1} seconds")

            # Store the results in a dictionary {name: nodes}
            nodes_dict = {row[0]: row[1] for row in nodes_rows}
            apartment_nnodes = nodes_dict.get('apartment')
            supermarket_nnodes = nodes_dict.get('supermarket')
            park_nnodes = nodes_dict.get('park')

            try:
                start_time_deserialize_graph = time.time()
                G = deserialize_graph(graphs_row)
                end_time_deserialize_graph = time.time()
                print(f"Execution time for deserialize_graph: {end_time_deserialize_graph - start_time_deserialize_graph} seconds")
            except Exception as e:
                print(f"Error deserializing graph: {e}")
                raise HTTPException(status_code=500, detail=f"Error deserializing graph: {e}")

            try:
                # Find suitable apartment network nodes
                start_time_find_suitable_apartment = time.time()
                suitable_apartment_nnodes = find_suitable_apartment_network_nodes(
                    G, apartment_nnodes, park_nnodes, supermarket_nnodes, max_park_meter, max_supermarket_meter)
                end_time_find_suitable_apartment = time.time()
                print(f"Execution time for find_suitable_apartment: {end_time_find_suitable_apartment - start_time_find_suitable_apartment} seconds")
            except Exception as e:
                print(f"Error in find_suitable_apartment_network_nodes: {e}")
                raise HTTPException(status_code=500, detail=f"Error in find_suitable_apartment_network_nodes: {e}")

            try:
                start_time_create_gdf_with_centroid = time.time()
                apartment_gdf = create_gdf_with_centroid(geom_centroid_rows)
                end_time_create_gdf_with_centroid = time.time()
                print(f"Execution time for create_gdf_with_centroid: {end_time_create_gdf_with_centroid - start_time_create_gdf_with_centroid} seconds")
            except Exception as e:
                print(f"Error creating GeoDataFrame: {e}")
                raise HTTPException(status_code=500, detail=f"Error creating GeoDataFrame: {e}")
            
            try:
                # Retrieve suitable apartment areas from network nodes
                start_time_retrieve_suitable_apartments = time.time()
                suitable_apartment_gdf_with_geoms = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)
                end_time_retrieve_suitable_apartments = time.time()
                print(f"Execution time for retrieve_suitable_apartments: {end_time_retrieve_suitable_apartments - start_time_retrieve_suitable_apartments} seconds")
            except Exception as e:
                print(f"Error retrieving suitable apartments: {e}")
                raise HTTPException(status_code=500, detail=f"Error retrieving suitable apartments: {e}")

            suitable_apartment_polygon = (suitable_apartment_gdf_with_geoms.copy()).drop(columns=['centroid'])
            suitable_apartment_centroid = set_centroid(suitable_apartment_gdf_with_geoms.copy())

            end_time0 = time.time()
            print(f"Execution time for Analize Suitable Apartments: {end_time0 - start_time0} seconds")
            
            return ORJSONResponse(content={
                "polygon": json.loads(suitable_apartment_polygon.to_json()),
                "centroid": json.loads(suitable_apartment_centroid.to_json())
            })

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
