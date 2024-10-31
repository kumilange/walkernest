import os
import json
import logging
from shapely.geometry import box
from sqlalchemy import text

logger = logging.getLogger(__name__)

# Load city data from JSON file
def load_city_data():
    try:
        with open('./citylist.json', 'r') as file:
            city_data = json.load(file)
        return city_data
    except FileNotFoundError as e:
        logger.error(f"Error loading city data from './citylist.json': {e}", exc_info=True)
        return {}

# Initialize the table
def initialize_tables(engine):
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            # Drop and create the cities table
            conn.execute(text("DROP TABLE IF EXISTS cities"))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS cities (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    geom GEOMETRY(Polygon, 4326)
                )
            """))

            # Drop and create the geojsons table
            conn.execute(text("DROP TABLE IF EXISTS geojsons"))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS geojsons (
                    id SERIAL PRIMARY KEY,
                    city_id INTEGER NOT NULL,
                    name VARCHAR(50) CHECK (name IN ('park', 'supermarket', 'apartment')) NOT NULL,
                    geom GEOMETRY,
                    properties JSONB
                )
            """))

            # Drop and create the network_graphs table
            conn.execute(text("DROP TABLE IF EXISTS network_graphs"))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS network_graphs (
                    id SERIAL PRIMARY KEY,
                    city_id INTEGER NOT NULL,
                    graph JSONB NOT NULL
                )
            """))

            # Drop and create the network_nodes table
            conn.execute(text("DROP TABLE IF EXISTS network_nodes"))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS network_nodes (
                    id SERIAL PRIMARY KEY,
                    city_id INTEGER NOT NULL,
                    name VARCHAR(50) CHECK (name IN ('park', 'supermarket', 'apartment')) NOT NULL,
                    nodes JSONB NOT NULL
                )
            """))

            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            logger.error(f"Error initializing table: {e}", exc_info=True)

# Insert data into the database
def insert_city_data(engine, city_data):
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            for city_name, city_info in city_data.items():
                geom = box(city_info['bbox'][0], city_info['bbox'][1], city_info['bbox'][2], city_info['bbox'][3])
                stmt = text("INSERT INTO cities (id, name, geom) VALUES (:id, :name, ST_GeomFromText(:geom, 4326))")
                print(f"Inserting: {city_info['id']}, {city_name}") 
                conn.execute(stmt, {'id': city_info['id'], 'name': city_name, 'geom': geom.wkt})
            
            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            logger.error(f"Error inserting data: {e}", exc_info=True)

# Insert data into the geojsons table
def insert_geojson_data(engine, city_data):
    geojson_dir = 'data/geojson'
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            for filename in os.listdir(geojson_dir):
                if filename.endswith('.geojson'):
                    city_name = next((name for name in city_data.keys() if name in filename), None)
                    if not city_name:
                        continue

                    city_id = city_data[city_name]["id"]
                    name = 'apartment' if 'apartment' in filename else 'supermarket' if 'supermarket' in filename else 'park' if 'park' in filename else None
                    if not name:
                        continue

                    with open(os.path.join(geojson_dir, filename), 'r') as file:
                        geojson_data = json.load(file)
                        for feature in geojson_data['features']:
                            geom_json = json.dumps(feature['geometry'])
                            properties_json = json.dumps(feature['properties'])
                            stmt = text("INSERT INTO geojsons (city_id, name, geom, properties) VALUES (:city_id, :name, ST_GeomFromGeoJSON(:geom), :properties)")
                            print(f"Inserting geojson_data: {city_id}, {name}") 
                            conn.execute(stmt, {'city_id': city_id, 'name': name, 'geom': geom_json, 'properties': properties_json})
            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            logger.error(f"Error inserting geojson data: {e}", exc_info=True)

# Function to insert network graphs into PostgreSQL
def insert_network_graphs_data(engine, city_data):
    nodes_dir = './network_graphs'
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            for filename in os.listdir(nodes_dir):
                city_name = next((name for name in city_data.keys() if name in filename), None)
                if not city_name:
                    continue

                city_id = city_data[city_name]["id"]

                with open(os.path.join(nodes_dir, filename), 'r') as file:
                    graph_json_str = file.read()
                    stmt = text("INSERT INTO network_graphs (city_id, graph) VALUES (:city_id, :graph)")
                    print(f"Inserting network_graphs_data: {city_id}") 
                    conn.execute(stmt, {'city_id': city_id, 'graph': graph_json_str})
        
            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            logger.error(f"Error inserting network nodes: {e}", exc_info=True)

# Function to insert network nodes into PostgreSQL
def insert_network_nodes_data(engine, city_data):
    nodes_dir = './network_nodes'
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            for filename in os.listdir(nodes_dir):
                if filename.endswith('.json'):
                    city_name = next((name for name in city_data.keys() if name in filename), None)
                    if not city_name:
                        continue

                    city_id = city_data[city_name]["id"]
                    name = 'apartment' if 'apartment' in filename else 'supermarket' if 'supermarket' in filename else 'park' if 'park' in filename else None
                    if not name:
                        continue

                    with open(os.path.join(nodes_dir, filename), 'r') as file:
                        nodes_data = json.load(file)
                        nodes_json = json.dumps(nodes_data)  # Convert the list to a JSON string
                        stmt = text("INSERT INTO network_nodes (city_id, name, nodes) VALUES (:city_id, :name, :nodes)")
                        print(f"Inserting: {city_id}, {name}") 
                        conn.execute(stmt, {'city_id': city_id, 'name': name, 'nodes': nodes_json})
			
            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            logger.error(f"Error inserting network nodes: {e}", exc_info=True)

