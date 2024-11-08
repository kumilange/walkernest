import os
import json
import time
import logging
from concurrent.futures import ThreadPoolExecutor
import geopandas as gpd
import psycopg2.pool
from shapely.geometry import Point, shape, mapping
from psycopg2 import DatabaseError
from fastapi import Depends, FastAPI, FastAPI, Depends, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from shapely.wkt import loads as load_wkt
# from neo4j import GraphDatabase, exceptions
from py2neo import Graph
from utils.geometry import set_centroid
from utils.networkx import deserialize_graph, find_suitable_apartment_network_nodes, retrieve_suitable_apartments

# Setting up logging configuration
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()
pool = psycopg2.pool.SimpleConnectionPool(
    dsn="postgresql://postgres:postgres@postgis:5432/gis", minconn=2, maxconn=4
)
# Neo4j connection details
NEO4J_URI = f"bolt://{os.getenv('NEO4J_HOST', 'neo4j')}:{os.getenv('NEO4J_PORT', '7687')}"
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'testpassword')

# Create a Neo4j driver instance
# driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
# Initialize Neo4j graph connection
graph = Graph(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

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

def construct_graph_data(graph, city_id):
    # Query to get all nodes for a given city
    cypher_query_nodes = """
    MATCH (n:Node {city_id: $city_id})
    RETURN n.id AS id, n.latitude AS y, n.longitude AS x, 
           n.street_count AS street_count, n.highway AS highway
    """
    nodes = graph.run(cypher_query_nodes, parameters={"city_id": city_id}).data()

    # Convert the node data to the desired format
    node_data = [
        {
            "id": node['id'],
            "x": node['x'],
            "y": node['y'],
            "street_count": node['street_count'],
            "highway": node.get('highway', None)
        }
        for node in nodes
    ]

    # Query to get all links for a given city
    cypher_query_links = """
    MATCH (source:Node)-[r:LINK]->(target:Node {city_id: $city_id})
    RETURN r.osmid AS osmid, r.oneway AS oneway, r.lanes AS lanes, 
           r.ref AS ref, r.name AS name, r.highway AS highway, 
           r.maxspeed AS maxspeed, r.reversed AS reversed, 
           r.length AS length, r.geometry AS geometry, 
           source.id AS source, target.id AS target, r.key AS key
    """
    links = graph.run(cypher_query_links, parameters={"city_id": city_id}).data()

    # Convert the link data to the desired format
    link_data = [
        {
            "osmid": link['osmid'],
            "oneway": link.get('oneway', None),
            "lanes": link.get('lanes', None),
            "ref": link.get('ref', None),
            "name": link.get('name', None),
            "highway": link.get('highway', None),
            "maxspeed": link.get('maxspeed', None),
            "reversed": link.get('reversed', None),
            "length": link.get('length', None),
            "geometry": link.get('geometry', {}),
            "source": link['source'],
            "target": link['target'],
            "key": link['key']
        }
        for link in links
    ]

    # Construct the final graph data as a JSON object
    graph_data = {
        "directed": True,  # assuming the graph is directed
        "multigraph": False,  # assuming it's not a multigraph
        "graph": {
            "created_date": "2024-11-05 22:03:37",  # can be dynamic if needed
            "created_with": "CustomGraphBuilder",  # or any tool name you prefer
            "crs": "epsg:4326",  # assuming coordinate reference system
            "simplified": False  # or True, based on your graph processing
        },
        "nodes": node_data,
        "links": link_data
    }

    return graph_data

# Function to fetch nodes and links by city_id
# def fetch_data_by_city_id(city_id: int, driver: GraphDatabase.driver):
#     # Query for nodes
#     query_nodes = """
#     MATCH (n:NetworkNode {city_id: $city_id})
#     RETURN n.id AS id, n.x AS x, n.y AS y, n.street_count AS street_count, n.highway AS highway
#     """
    
#     # Query for links
#     query_links = """
#     MATCH (l:NetworkLink {city_id: $city_id})
#     RETURN l.osmid AS osmid, l.oneway AS oneway, l.lanes AS lanes, l.name AS name, 
#            l.highway AS highway, l.reversed AS reversed, l.length AS length, 
#            l.geometry AS geometry, l.source AS source, l.target AS target, l.key AS key
#     """
    
#     try:
#         logger.debug(f"Fetching data for city_id: {city_id}")
        
#         with driver.session() as session:
#             # Run queries for nodes and links
#             logger.debug(f"Running query for nodes")
#             nodes_data = session.run(query_nodes, city_id=city_id)
#             nodes = [{
#                 "id": node["id"], 
#                 "x": node["x"], 
#                 "y": node["y"], 
#                 "street_count": node["street_count"], 
#                 "highway": node["highway"]
#             } for node in nodes_data]
#             logger.debug(f"Nodes query executed successfully, fetched {len(nodes)} nodes")
            
#             # logger.debug(f"Running query for links")
#             # links_data = session.run(query_links, city_id=city_id)
#             # links = [{
#             #     "source": link["source"],
#             #     "target": link["target"],
#             #     "osmid": link["osmid"],
#             #     "highway": link["highway"],
#             #     "length": link["length"],
#             #     "oneway": link["oneway"],
#             #     "lanes": link["lanes"],
#             #     "name": link["name"],
#             #     "reversed": link["reversed"],
#             #     "geometry": link["geometry"],
#             #     "key": link["key"]
#             # } for link in links_data]
#             # logger.debug(f"Links query executed successfully, fetched {len(links)} links")
            
#             # Construct the graph data into JSON format
#             graph = {
#                 "nodes": nodes,
#                 # "links": links
#             }

#             logger.debug("Graph data successfully constructed")
#             return json.dumps(graph)  # Returning graph data as a JSON string

#     except Exception as e:
#         logger.error(f"Error fetching data for city_id {city_id}: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))
    
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
                future_graphs = executor.submit(construct_graph_data, graph, city_id)
                graphs_data = future_graphs.result()
                print(f"graphs_data: {graphs_data}")
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
                G = deserialize_graph(graphs_data)
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

@app.on_event("shutdown")

def shutdown_event():
    pool.closeall()
    
app.mount("/", StaticFiles(directory="static"), name="static")
