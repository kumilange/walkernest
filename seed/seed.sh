#!/bin/sh

# Check if RUN_SEED is set to 'true'
if [ "$RUN_SEED" != "true" ]; then
    echo "Skipping seeding as RUN_SEED is not set to 'true'."
    exit 0
fi

# Check if environment variables are set
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
  echo "❌ Database connection parameters are not fully set."
  exit 1
fi

# Function to log messages
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

# Start the seeding process
log "Starting the seeding process..."

# Connection string
CONNECTION_STRING="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Variables
CITYLIST_PATH="../shared/citydict.json"
CITY_DATA=$(cat "$CITYLIST_PATH")
GEOJSON_DIR="../seed/data/geojson"
NETWORK_GRAPHS_DIR="../seed/data/network_graphs"
NETWORK_NODES_DIR="../seed/data/network_nodes"
BATCH_SIZE=100  # Number of rows to insert in a batch

# Initialize tables and create indexes
log "Initializing tables and creating indexes..."
psql "$CONNECTION_STRING" <<EOF
BEGIN;

DROP TABLE IF EXISTS amenities;
CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    name VARCHAR(50) CHECK (name IN ('park', 'supermarket', 'cafe', 'apartment')) NOT NULL,
    geom GEOMETRY,
    properties JSONB
);
CREATE INDEX idx_amenities_geom ON amenities USING GIST (geom);

DROP TABLE IF EXISTS network_graphs;
CREATE TABLE IF NOT EXISTS network_graphs (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    graph JSONB NOT NULL
);
CREATE INDEX idx_network_graphs_city_id ON network_graphs (city_id);

DROP TABLE IF EXISTS network_nodes;
CREATE TABLE IF NOT EXISTS network_nodes (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    name VARCHAR(50) CHECK (name IN ('park', 'supermarket', 'cafe', 'apartment')) NOT NULL,
    nodes JSONB NOT NULL
);

COMMIT;
EOF

# Wait for a few seconds before starting the seeding process
log "Waiting for 5 seconds before starting the seeding process..."
sleep 5

# Function to insert data in batches
insert_data_in_batches() {
    local table=$1
    local columns=$2
    local values=$3
    local retries=5
    local count=0

    while [ $count -lt $retries ]; do
        psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO $table ($columns) VALUES ${values%,};
COMMIT;
EOF
        if [ $? -eq 0 ]; then
            log "Batch inserted successfully."
            return 0
        else
            log "Error inserting batch. Retrying... ($((count+1))/$retries)"
            count=$((count + 1))
            sleep 2
        fi
    done

    log "Failed to insert batch after $retries retries."
    exit 1
}

# Insert GeoJSON data in batches
log "Inserting GeoJSON data in batches..."
if [ -d "$GEOJSON_DIR" ] && [ "$(ls -A $GEOJSON_DIR)" ]; then
  for FILE in "$GEOJSON_DIR"/*.geojson; do
    if [ -f "$FILE" ]; then
      CITY_NAME=$(basename "$FILE" .geojson | cut -d'_' -f1)
      if echo "$CITY_DATA" | jq -e --arg CITY_NAME "$CITY_NAME" 'has($CITY_NAME)' > /dev/null; then
        CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[$CITY_NAME].id')
        NAME=$(basename "$FILE" .geojson | cut -d'_' -f2)

        INSERT_VALUES=""
        COUNT=0

        echo "Processing file: $FILE for city: $CITY_NAME (ID: $CITY_ID), type: $NAME"

        jq -c '.features[]' "$FILE" > temp_features.json
        while read -r feature; do
          GEOM=$(echo "$feature" | jq -c '.geometry' | sed "s/'/''/g")
          PROPERTIES=$(echo "$feature" | jq -c '.properties' | sed "s/'/''/g")

          INSERT_VALUES="$INSERT_VALUES($CITY_ID, '$NAME', ST_GeomFromGeoJSON('$GEOM'), '$PROPERTIES'),"
          COUNT=$((COUNT + 1))

          if [ "$COUNT" -ge "$BATCH_SIZE" ]; then
            insert_data_in_batches "amenities" "city_id, name, geom, properties" "$INSERT_VALUES"
            INSERT_VALUES=""
            COUNT=0
          fi
        done < temp_features.json
        rm -f temp_features.json

        insert_data_in_batches "amenities" "city_id, name, geom, properties" "$INSERT_VALUES"
      fi
    fi
  done
fi

# Insert network nodes data in batches
log "Inserting network nodes data in batches..."
if [ -d "$NETWORK_NODES_DIR" ] && [ "$(ls -A $NETWORK_NODES_DIR)" ]; then
  INSERT_VALUES=""
  COUNT=0
  for FILE in "$NETWORK_NODES_DIR"/*.json; do
    if [ -f "$FILE" ]; then
      CITY_NAME=$(basename "$FILE" .json | cut -d'_' -f1)
      if echo "$CITY_DATA" | jq -e --arg CITY_NAME "$CITY_NAME" 'has($CITY_NAME)' > /dev/null; then
        CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[$CITY_NAME].id')
        NAME=$(basename "$FILE" .json | cut -d'_' -f2)
        NODES=$(cat "$FILE" | sed "s/'/''/g")  # Escape single quotes

        INSERT_VALUES="$INSERT_VALUES($CITY_ID, '$NAME', '$NODES'),"
        COUNT=$((COUNT + 1))

        if [ "$COUNT" -ge "$BATCH_SIZE" ]; then
          insert_data_in_batches "network_nodes" "city_id, name, nodes" "$INSERT_VALUES"
          INSERT_VALUES=""
          COUNT=0
        fi
      fi
    fi
  done

  insert_data_in_batches "network_nodes" "city_id, name, nodes" "$INSERT_VALUES"
fi

# Insert network graphs data
log "Inserting network graphs data..."
if [ -d "$NETWORK_GRAPHS_DIR" ] && [ "$(ls -A $NETWORK_GRAPHS_DIR)" ]; then
  for FILE in $NETWORK_GRAPHS_DIR/*.json; do
    if [ -f "$FILE" ]; then
      CITY_NAME=$(basename "$FILE" .json | cut -d'_' -f1)
      if echo "$CITY_DATA" | jq -e --arg CITY_NAME "$CITY_NAME" 'has($CITY_NAME)' > /dev/null; then
        CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[$CITY_NAME].id')
        GRAPH=$(cat "$FILE" | sed "s/'/''/g") # Escape single quotes for PostgreSQL
        psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO network_graphs (city_id, graph) VALUES ($CITY_ID, '$GRAPH');
COMMIT;
EOF
      fi
    fi
  done
fi

log "✅ Data loading completed."
