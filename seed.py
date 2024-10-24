import json
import os
from numpy import shape
from shapely.geometry import box
from sqlalchemy import create_engine, text

# Connect to PostgreSQL
db_username = 'postgres'
db_password = 'postgres'
db_host = 'postgis'
db_port = '5432'
db_name = 'gis'
connection_string = f"postgresql://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"
engine = create_engine(connection_string)

# Load city data from JSON file
def load_city_data():
    with open('./citylist.json', 'r') as file:
        city_data = json.load(file)
    return city_data

def json_to_hstore(properties):
    """
    Convert a JSON object (Python dictionary) to an hstore string format.
    """
    hstore_str = ','.join([f'"{k}"=>"{v}"' for k, v in properties.items()])
    return hstore_str

# Initialize the table
def initialize_table(engine):
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            # Drop the table if it exists
            conn.execute(text("DROP TABLE IF EXISTS cities"))
            # Create the cities table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS cities (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    geom GEOMETRY(Polygon, 4326)
                )
            """))
            
						# Drop the table if it exists
            conn.execute(text("DROP TABLE IF EXISTS geojsons"))
            # Create the geojsons table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS geojsons (
                    id SERIAL PRIMARY KEY,
                    city_id INTEGER NOT NULL,
                    name VARCHAR(255) CHECK (name IN ('park', 'supermarket')) NOT NULL,
                    geom GEOMETRY,
                    properties JSONB
                )
            """))
            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            print(f"Error initializing table: {e}")

# Insert data into the database
def insert_city_data(city_data, engine):
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            for city_name, city_info in city_data.items():
                geom = box(city_info['bbox'][0], city_info['bbox'][1], city_info['bbox'][2], city_info['bbox'][3])
                stmt = text("INSERT INTO cities (id, name, geom) VALUES (:id, :name, ST_GeomFromText(:geom, 4326))")
                print(f"Inserting: {city_info['id']}, {city_name}, {geom.wkt}")  # Debug print
                conn.execute(stmt, {'id': city_info['id'], 'name': city_name, 'geom': geom.wkt})
            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            print(f"Error inserting data: {e}")

# Insert data into the geojsons table
def insert_geojson_data(city_data, engine):
    geojson_dir = './geojson'
    with engine.connect() as conn:
        trans = conn.begin()  # Begin a transaction
        try:
            for filename in os.listdir(geojson_dir):
                if filename.endswith('.geojson'):
                    city_name = None
                    for name in city_data.keys():
                        if name in filename:
                            city_name = name
                            break
                    if not city_name:
                        continue

                    city_id = city_data[city_name]["id"]
                    if 'park' in filename:
                        name = 'park'
                    elif 'supermarket' in filename:
                        name = 'supermarket'
                    else:
                        continue


                    with open(os.path.join(geojson_dir, filename), 'r') as file:
                        geojson_data = json.load(file)
                        for feature in geojson_data['features']:
                            geom_json = json.dumps(feature['geometry'])
                            properties_json = json.dumps(feature['properties'])
                            stmt = text("INSERT INTO geojsons (city_id, name, geom, properties) VALUES (:city_id, :name, ST_GeomFromGeoJSON(:geom), :properties)")
                            print(f"Inserting: {city_id}, {name}, {properties_json}, {geom_json}")  # Debug print
                            conn.execute(stmt, {'city_id': city_id, 'name': name, 'geom': geom_json, 'properties': properties_json})
            trans.commit()  # Commit the transaction
        except Exception as e:
            trans.rollback()  # Rollback the transaction on error
            print(f"Error inserting geojson data: {e}")
            
# Load city data
city_data = load_city_data()

# Initialize the table
initialize_table(engine)

# Insert city data into the database
insert_city_data(city_data, engine)
# Insert geojson data into the database
insert_geojson_data(city_data, engine)