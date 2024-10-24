import os
from utils.postgis import initialize_tables, insert_city_data, insert_geojson_data, insert_network_nodes_data, load_city_data
from sqlalchemy import create_engine, text

# Connect to PostgreSQL
db_username = os.getenv('DB_USERNAME')
db_password = os.getenv('DB_PASSWORD')
db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')
if None in [db_username, db_password, db_host, db_port, db_name]:
    raise ValueError("Database connection parameters are not fully set.")
connection_string = f"postgresql://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"
engine = create_engine(connection_string)

# Load city data
city_data = load_city_data()

# Initialize tables
initialize_tables(engine)

# Insert datasets
# city data
insert_city_data(engine, city_data)
# geojson data
insert_geojson_data(engine, city_data)
# network nodes
insert_network_nodes_data(engine, city_data)