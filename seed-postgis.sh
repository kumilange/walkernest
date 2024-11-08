#!/bin/sh

# Function to log messages
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1"
}

# Check if environment variables are set
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
  echo "Database connection parameters are not fully set."
  exit 1
fi

# Connection string
CONNECTION_STRING="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Load city data from JSON file
CITY_DATA=$(cat /data/citylist.json)

# Initialize tables and create indexes
log "Initializing tables and creating indexes..."
psql $CONNECTION_STRING <<EOF
BEGIN;
DROP TABLE IF EXISTS cities;
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    geom GEOMETRY(Polygon, 4326)
);
CREATE INDEX idx_cities_geom ON cities USING GIST (geom);

DROP TABLE IF EXISTS geojsons;
CREATE TABLE IF NOT EXISTS geojsons (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    name VARCHAR(50) CHECK (name IN ('park', 'supermarket', 'apartment')) NOT NULL,
    geom GEOMETRY,
    properties JSONB
);
CREATE INDEX idx_geojsons_geom ON geojsons USING GIST (geom);

DROP TABLE IF EXISTS network_nodes;
CREATE TABLE IF NOT EXISTS network_nodes (
    id SERIAL PRIMARY KEY,
    city_id INTEGER NOT NULL,
    name VARCHAR(50) CHECK (name IN ('park', 'supermarket', 'apartment')) NOT NULL,
    nodes JSONB NOT NULL
);
COMMIT;
EOF

# Insert city data
log "Inserting city data..."
echo "$CITY_DATA" | jq -c 'to_entries[]' | while read -r city; do
  CITY_NAME=$(echo "$city" | jq -r '.key')
  CITY_ID=$(echo "$city" | jq -r '.value.id')
  GEOMETRY=$(echo "$city" | jq -r '.value.geometry')
  psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO cities (id, name, geom) VALUES ($CITY_ID, '$CITY_NAME', ST_GeomFromGeoJSON('$GEOMETRY'));
COMMIT;
EOF
done

# Insert geojson data
log "Inserting geojson data..."
GEOJSON_DIR='/data/geojson'
if [ -d "$GEOJSON_DIR" ] && [ "$(ls -A $GEOJSON_DIR)" ]; then
  for FILE in $GEOJSON_DIR/*.geojson; do
    if [ -f "$FILE" ]; then
      CITY_NAME=$(basename "$FILE" .geojson | cut -d'_' -f1)
      if echo "$CITY_DATA" | jq -e --arg CITY_NAME "$CITY_NAME" 'has($CITY_NAME)' > /dev/null; then
        CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[$CITY_NAME].id')
        if echo "$FILE" | grep -q 'apartment'; then
          NAME='apartment'
        elif echo "$FILE" | grep -q 'supermarket'; then
          NAME='supermarket'
        elif echo "$FILE" | grep -q 'park'; then
          NAME='park'
        else
          continue
        fi
        GEOJSON=$(cat "$FILE")
        echo "$GEOJSON" | jq -c '.features[]' | while read -r feature; do
          GEOM=$(echo "$feature" | jq -c '.geometry')
          PROPERTIES=$(echo "$feature" | jq -c '.properties')
          psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO geojsons (city_id, name, geom, properties) VALUES ($CITY_ID, '$NAME', ST_GeomFromGeoJSON('$GEOM'), '$PROPERTIES');
COMMIT;
EOF
        done
      fi
    fi
  done
fi

# Insert network nodes data
log "Inserting network nodes data..."
NETWORK_NODES_DIR='/data/network_nodes'
if [ -d "$NETWORK_NODES_DIR" ] && [ "$(ls -A $NETWORK_NODES_DIR)" ]; then
  for FILE in $NETWORK_NODES_DIR/*.json; do
    if [ -f "$FILE" ]; then
      CITY_NAME=$(basename "$FILE" .json | cut -d'_' -f1)
      if echo "$CITY_DATA" | jq -e --arg CITY_NAME "$CITY_NAME" 'has($CITY_NAME)' > /dev/null; then
        CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[$CITY_NAME].id')
        NAME=$(basename "$FILE" .json | cut -d'_' -f2)
        NODES=$(cat "$FILE")
        psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO network_nodes (city_id, name, nodes) VALUES ($CITY_ID, '$NAME', '$NODES');
COMMIT;
EOF
      fi
    fi
  done
fi

echo "Data loading completed."