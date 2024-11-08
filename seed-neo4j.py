import os
import json
import time
import logging
from py2neo import Graph
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Neo4j connection parameters from environment variables
NEO4J_HOST = os.getenv('NEO4J_HOST')
NEO4J_PORT = os.getenv('NEO4J_PORT')
NEO4J_USERNAME = os.getenv('NEO4J_USERNAME')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD')

# Check if all necessary environment variables are set
if not all([NEO4J_HOST, NEO4J_PORT, NEO4J_USERNAME, NEO4J_PASSWORD]):
    logger.error("Database connection parameters for Neo4j are not fully set.")
    exit(1)

NEO4J_CONNECTION_STRING = f"bolt://{NEO4J_HOST}:{NEO4J_PORT}"

# Initialize Neo4j graph connection
graph = Graph(NEO4J_CONNECTION_STRING, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))



# Function to wait for Neo4j to be ready
def wait_for_neo4j():
    logger.info("Waiting for Neo4j to be ready...")
    for i in range(30):
        try:
            graph.run("RETURN 1").data()
            logger.info("Neo4j is ready.")
            return
        except:
            logger.info(f"Neo4j is not ready yet. Retrying in 2 seconds... ({i+1}/30)")
            time.sleep(2)
    logger.error("Neo4j did not become ready in time.")
    exit(1)

# Wait for Neo4j to be ready
wait_for_neo4j()

# Load city data from JSON file
CITY_DATA_PATH = '/data/citylist.json'
with open(CITY_DATA_PATH, 'r') as file:
    CITY_DATA = json.load(file)

# Drop existing nodes and relationships in Neo4j
logger.info("Dropping existing nodes and relationships...")
graph.run("MATCH (n) DETACH DELETE n")

# Define function to insert data into Neo4j using py2neo's Graph
def insert_graph_data(graph, nodes, links, city_id):
    # Insert nodes
    cypher_query_nodes = """
    CALL apoc.periodic.iterate(
        'UNWIND $nodes AS node RETURN node',
        'MERGE (n:Node {id: node.id, city_id: $city_id})
        SET n.latitude = node.y,
            n.longitude = node.x,
            n.ref = COALESCE(node.ref, NULL),
            n.street_count = node.street_count,
            n.highway = COALESCE(node.highway, NULL)',
        {batchSize: 1000, parallel: true, params: {nodes: $nodes, city_id: $city_id}}
    )
    """
    try:
        result = graph.run(cypher_query_nodes, parameters={"nodes": nodes, "city_id": city_id})
        logger.info(f"Node insertion completed successfully for {city_name}")
    except Exception as e:
        logger.error(f"Error inserting nodes for {city_name}: {e}")

    # Insert links
    cypher_query_links = """
    CALL apoc.periodic.iterate(
        'UNWIND $links AS link RETURN link',
        'MATCH (source:Node {id: link.source, city_id: $city_id})
        MATCH (target:Node {id: link.target, city_id: $city_id})
        MERGE (source)-[r:LINK {key: link.key}]->(target)
        SET r.osmid = link.osmid,
            r.oneway = COALESCE(link.oneway, NULL),
            r.lanes = COALESCE(link.lanes, NULL),
            r.ref = COALESCE(link.ref, NULL),
            r.name = COALESCE(link.name, NULL),
            r.highway = link.highway,
            r.maxspeed = COALESCE(link.maxspeed, NULL),
            r.reversed = COALESCE(link.reversed, NULL),
            r.length = COALESCE(link.length, NULL),
            r.geometry = COALESCE(link.geometry, NULL)',
        {batchSize: 1000, parallel: true, params: {links: $links, city_id: $city_id}}
    )
    """
    try:
        result = graph.run(cypher_query_links, parameters={"links": links, "city_id": city_id})
        logger.info(f"Link insertion completed successfully for {city_name}")
        logger.debug(f"Result: {result.data()}")
    except Exception as e:
        logger.error(f"Error inserting links for {city_name}: {e}")
        logger.debug(f"Link data: {link_data}")
        
# Directory containing network graph files
NETWORK_GRAPHS_DIR = '/data/network_graphs'
# Insert network graphs data into Neo4j
if Path(NETWORK_GRAPHS_DIR).exists() and any(Path(NETWORK_GRAPHS_DIR).glob('*.json')):
    for file_path in Path(NETWORK_GRAPHS_DIR).glob('*.json'):
        city_name = file_path.stem.split('_')[0]

        # Check if city data exists
        if city_name in CITY_DATA:
            city_id = CITY_DATA[city_name]['id']
            logger.info(f"City: {city_name} {city_id}")

            with open(file_path, 'r') as file:
                graph_data = json.load(file)

            # Extract nodes and links from the graph data
            nodes = graph_data.get('nodes', [])
            links = graph_data.get('links', [])

            # Prepare the nodes for batch insertion
            node_data = [
                {
                    'id': node['id'],
                    'x': node['x'],
                    'y': node['y'],
                    'street_count': node['street_count'],
                    'highway': node.get('highway', None)
                }
                for node in nodes
            ]

            # Prepare the links for batch insertion
            link_data = [
                {
                    'osmid': link['osmid'],
                    'oneway': link.get('oneway', None),
                    'lanes': link.get('lanes', None),
                    'ref': link.get('ref', None),
                    'name': link.get('name', None),
                    'highway': link.get('highway', None),
                    'maxspeed': link.get('maxspeed', None),
                    'reversed': link.get('reversed'),
                    'length': link.get('length'),
                    'geometry': json.dumps(link.get('geometry', {}).get('coordinates', [])),  # Convert geometry to JSON string
                    'source': link['source'],
                    'target': link['target'],
                    'key': link['key']
                }
                for link in links
            ]

            # Run insertion
            insert_graph_data(graph, node_data, link_data, city_id)

else:
    logger.error(f"Directory {NETWORK_GRAPHS_DIR} does not exist or is empty.")

logger.info("Data loading completed.")
