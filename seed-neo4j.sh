#!/bin/sh

# Function to log messages
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

# Check if Neo4j environment variables are set
if [ -z "$NEO4J_HOST" ] || [ -z "$NEO4J_PORT" ] || [ -z "$NEO4J_AUTH" ]|| [ -z "$NEO4J_USERNAME" ]|| [ -z "$NEO4J_PASSWORD" ]; then
  echo "Database connection parameters for Neo4j are not fully set."
  exit 1
fi

# Connection strings
NEO4J_CONNECTION_STRING="bolt://$NEO4J_HOST:$NEO4J_PORT"

# Function to wait for Neo4j to be ready
wait_for_neo4j() {
    log "Waiting for Neo4j to be ready..."
    for i in $(seq 1 30); do
        if cypher-shell -a "$NEO4J_CONNECTION_STRING" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" "RETURN 1" > /dev/null 2>&1; then
            log "Neo4j is ready."
            return 0
        fi
        log "Neo4j is not ready yet. Retrying in 2 seconds..."
        sleep 2
    done
    log "Neo4j did not become ready in time."
    exit 1
}

# Wait for Neo4j to be ready
wait_for_neo4j

# Load city data from JSON file
CITY_DATA=$(cat /data/citylist.json)

# Drop existing nodes and relationships
log "Dropping existing nodes and relationships..."
cypher-shell -a "$NEO4J_CONNECTION_STRING" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" "MATCH (n) DETACH DELETE n"

# Insert network graphs data into Neo4j
log "Inserting network graph data into Neo4j..."
NETWORK_GRAPHS_DIR='/data/network_graphs'
if [ -d "$NETWORK_GRAPHS_DIR" ] && [ "$(ls -A $NETWORK_GRAPHS_DIR)" ]; then
  for FILE in "$NETWORK_GRAPHS_DIR"/*.json; do
    if [ -f "$FILE" ]; then
      # Extract city name and read the JSON content
      CITY_NAME=$(basename "$FILE" .json | cut -d'_' -f1)
      echo "Processing file: $FILE"
      echo "City name extracted: $CITY_NAME"

      # Check if city data exists
      if echo "$CITY_DATA" | jq -e --arg CITY_NAME "$CITY_NAME" 'has($CITY_NAME)' > /dev/null; then
        CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[$CITY_NAME].id')
        GRAPH=$(cat "$FILE" | jq -c .)
        echo City id extracted: "$CITY_ID"

        # Extract nodes and links, ensuring they are properly formatted JSON strings
        # NODES=$(echo "$GRAPH" | jq -c '.nodes')

        # Extract nodes and links, ensuring they are properly formatted JSON strings
        # Creating NODES variable with required structure
        NODES=$(echo "$GRAPH" | jq -c '.nodes | map({id: .id, x: .x, y: .y, street_count: .street_count} + (if .highway then {highway: .highway} else {} end))')
        LINKS=$(echo "$GRAPH" | jq -c '.links')

        # Use jq to remove outer quotes from the keys by constructing a valid format for bash
        NODES_FOR_CYPHER=$(echo "$NODES" | jq -r '[.[] | {id: .id, x: .x, y: .y, street_count: .street_count, highway: (.highway // null)}] | @json')
        echo NODES_FOR_CYPHER: "$NODES_FOR_CYPHER"

        # Use APOC batch processing to insert nodes
        log "Batch inserting nodes for city $CITY_NAME with ID $CITY_ID..."
        NODE_INSERTION_OUTPUT=$(cypher-shell -a "$NEO4J_CONNECTION_STRING" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" <<EOF
CALL apoc.periodic.iterate(
  'UNWIND \$nodes AS node RETURN node',
  'CREATE (n:NetworkNode {id: node.id, city_id: "$CITY_ID", x: node.x, y: node.y, street_count: node.street_count, highway: coalesce(node.highway, null)})',
  {batchSize: 1000, parallel: true, params: {nodes: $NODES_FOR_CYPHER}})
EOF
)
        # Check for errors in node insertion
        if [ $? -eq 0 ]; then
          echo "Node insertion completed successfully for $CITY_NAME"
        else
          echo "Error inserting nodes for $CITY_NAME"
          echo "Error details: $NODE_INSERTION_OUTPUT"
          exit 1
        fi

        # Insert links using APOC batch processing with debug
        echo "Batch Inserting links for city $CITY_NAME with ID $CITY_ID..."
        cypher-shell -a "$NEO4J_CONNECTION_STRING" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" <<EOF
CALL apoc.periodic.iterate(
  'UNWIND \$links AS link RETURN link',
  'CREATE (l:NetworkLink {city_id: "$CITY_ID", osmid: link.osmid, oneway: link.oneway, lanes: link.lanes, name: link.name, highway: link.highway, reversed: link.reversed, length: link.length, geometry: link.geometry.coordinates, source: link.source, target: link.target, key: link.key})',
  {batchSize: 1000, parallel: true, params: {links: $LINKS}})
EOF

        # Check for errors in link insertion
        if [ $? -eq 0 ]; then
          echo "Link insertion completed successfully for $CITY_NAME"
        else
          echo "Error inserting links for $CITY_NAME"
          exit 1
        fi

        echo "Data for city $CITY_NAME (ID: $CITY_ID) added successfully."
      else
        echo "No matching city data found for $CITY_NAME in CITY_DATA."
      fi
    else
      echo "No JSON files found in $NETWORK_GRAPHS_DIR."
    fi
  done
else
  echo "Directory $NETWORK_GRAPHS_DIR does not exist or is empty."
fi

# Keep the container running
tail -f /dev/null
# if [ -d "$NETWORK_GRAPHS_DIR" ] && [ "$(ls -A $NETWORK_GRAPHS_DIR)" ]; then
#   for FILE in $NETWORK_GRAPHS_DIR/*.json; do
#     if [ -f "$FILE" ]; then
#       CITY_NAME=$(basename "$FILE" .json | cut -d'_' -f1)
#       log "Processing file: $FILE for city: $CITY_NAME..."
      
#       if echo "$CITY_DATA" | jq -e --arg CITY_NAME "$CITY_NAME" 'has($CITY_NAME)' > /dev/null; then
#         CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[$CITY_NAME].id')
        
#         # Log start of city data insertion
#         log "Adding nodes and links for city $CITY_NAME with ID $CITY_ID..."

#         # Read JSON data from the file
#         NODES=$(jq -c '.nodes[]' "$FILE")
#         LINKS=$(jq -c '.links[]' "$FILE")

#         # Insert nodes
#         for NODE in $NODES; do
#           NODE_ID=$(echo $NODE | jq -r '.id')
#           X=$(echo $NODE | jq -r '.x')
#           Y=$(echo $NODE | jq -r '.y')
#           STREET_COUNT=$(echo $NODE | jq -r '.street_count')
#           HIGHWAY=$(echo $NODE | jq -r '.highway // ""')
          
#           log "Inserting node ID: $NODE_ID, coordinates: ($X, $Y), street_count: $STREET_COUNT, highway: $HIGHWAY..."

#           # Cypher command to add node
#           cypher-shell -a "$NEO4J_CONNECTION_STRING" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" <<EOF
# CREATE (n:NetworkNode {id: $NODE_ID, city_id: '$CITY_ID', graph_id: apoc.create.uuid(), x: $X, y: $Y, street_count: $STREET_COUNT, highway: '$HIGHWAY'})
# EOF
#         done

#         # Insert links
#         for LINK in $LINKS; do
#           OSMID=$(echo $LINK | jq -r '.osmid')
#           SOURCE_ID=$(echo $LINK | jq -r '.source')
#           TARGET_ID=$(echo $LINK | jq -r '.target')
#           HIGHWAY=$(echo $LINK | jq -r '.highway')
#           LENGTH=$(echo $LINK | jq -r '.length')
#           ONEWAY=$(echo $LINK | jq -r '.oneway')
#           KEY=$(echo $LINK | jq -r '.key')
          
#           # Handle geometry if present
#           GEOMETRY=$(echo $LINK | jq -c '.geometry.coordinates // empty')
#           if [ -n "$GEOMETRY" ]; then
#             COORDINATES=$(echo $GEOMETRY | jq -c '.')
#           else
#             COORDINATES="[]"
#           fi

#           log "Inserting link OSMID: $OSMID, source: $SOURCE_ID, target: $TARGET_ID, highway: $HIGHWAY, length: $LENGTH..."

#           # Cypher command to add link with geometry data
#           cypher-shell -a "$NEO4J_CONNECTION_STRING" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" <<EOF
# MATCH (a:NetworkNode {id: $SOURCE_ID, city_id: '$CITY_ID'}), (b:NetworkNode {id: $TARGET_ID, city_id: '$CITY_ID'})
# CREATE (a)-[:CONNECTED_TO {osmid: '$OSMID', highway: '$HIGHWAY', length: $LENGTH, oneway: $ONEWAY, key: $KEY, geometry: $COORDINATES}]->(b)
# EOF
#         done

#         # Log completion for the city
#         log "Data for city $CITY_NAME (ID: $CITY_ID) added successfully."
#       else
#         log "City $CITY_NAME not found in city list. Skipping file: $FILE."
#       fi
#     fi
#   done
# fi

echo "Data loading completed."