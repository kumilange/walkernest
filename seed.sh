#!/bin/sh

# Check if environment variables are set
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
  echo "Database connection parameters are not fully set."
  exit 1
fi

# Connection string
CONNECTION_STRING="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Load city data from JSON file
CITY_DATA=$(cat ./citylist.json)

# Initialize tables and create indexes
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
    name VARCHAR(50) CHECK (name IN ('park', 'supermarket', 'apartment')) NOT NULL,
    nodes JSONB NOT NULL
);
COMMIT;
EOF

# Insert city data
echo "$CITY_DATA" | jq -c '.[]' | while read -r city; do
  CITY_ID=$(echo "$city" | jq -r '.id')
  CITY_NAME=$(echo "$city" | jq -r '.name')
  BBOX=$(echo "$city" | jq -r '.bbox')
  GEOM="POLYGON(($BBOX))"
  psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO cities (id, name, geom) VALUES ($CITY_ID, '$CITY_NAME', ST_GeomFromText('$GEOM', 4326));
COMMIT;
EOF
done

# Insert geojson data
GEOJSON_DIR='./geojson'
for FILE in $GEOJSON_DIR/*.geojson; do
  CITY_NAME=$(basename "$FILE" .geojson | cut -d'_' -f1)
  CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[] | select(.name == $CITY_NAME) | .id')
  NAME=$(basename "$FILE" .geojson | cut -d'_' -f2)
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
done

# Insert network graphs data
NETWORK_GRAPHS_DIR='./network_graphs'
for FILE in $NETWORK_GRAPHS_DIR/*.json; do
  CITY_NAME=$(basename "$FILE" .json | cut -d'_' -f1)
  CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[] | select(.name == $CITY_NAME) | .id')
  GRAPH=$(cat "$FILE")
  psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO network_graphs (city_id, graph) VALUES ($CITY_ID, '$GRAPH');
COMMIT;
EOF
done

# Insert network nodes data
NETWORK_NODES_DIR='./network_nodes'
for FILE in $NETWORK_NODES_DIR/*.json; do
  CITY_NAME=$(basename "$FILE" .json | cut -d'_' -f1)
  CITY_ID=$(echo "$CITY_DATA" | jq -r --arg CITY_NAME "$CITY_NAME" '.[] | select(.name == $CITY_NAME) | .id')
  NAME=$(basename "$FILE" .json | cut -d'_' -f2)
  NODES=$(cat "$FILE")
  psql $CONNECTION_STRING <<EOF
BEGIN;
INSERT INTO network_nodes (city_id, name, nodes) VALUES ($CITY_ID, '$NAME', '$NODES');
COMMIT;
EOF
done

echo "Data loading completed."