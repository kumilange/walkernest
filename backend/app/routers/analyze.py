import json
import time
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import ORJSONResponse
from psycopg2 import DatabaseError
from concurrent.futures import ThreadPoolExecutor
from app.db import get_connection
from app.crud import fetch_nodes, fetch_geom_and_centroid, fetch_network_graph
from app.utils.geometry import create_gdf_with_centroid, set_centroid
from app.utils.networkx import deserialize_graph, find_suitable_apartment_network_nodes, retrieve_suitable_apartments

router = APIRouter()

PREFIX_AMENITY = "max_meter_"
def transform_key(key: str, prefix: str) -> str:
    """
    Remove the prefix from the key.
    """
    if key.startswith(prefix):
        return key[len(prefix):]
    return key

@router.get("/analyze")
def analyze_suitable_apartments(
    city_id: int = Query(...), 
    kwargs: str = Query(...),  # Accept kwargs as a JSON string
    conn=Depends(get_connection),
):
    """
    Return the nodes JSONB list from the network_nodes table based on city_id and name.
    """
    try:
        # Parse kwargs from JSON string to dictionary
        kwargs = json.loads(kwargs)
        amenity_keys = [key.replace(PREFIX_AMENITY, '') for key in kwargs.keys()]

        start_time = time.time()
        with conn.cursor() as cur:
            # Use ThreadPoolExecutor to parallelize database queries
            with ThreadPoolExecutor() as executor:
                future_geom_and_centroid = executor.submit(fetch_geom_and_centroid, cur, city_id)
                geom_centroid_rows = future_geom_and_centroid.result()
                future_graphs = executor.submit(fetch_network_graph, cur, city_id)
                graphs_row = future_graphs.result()
                future_nodes = executor.submit(fetch_nodes, cur, city_id, amenity_keys)
                nodes_rows = future_nodes.result()
            
            # Store the results in a dictionary {name: nodes}
            nodes_dict = {row[0]: row[1] for row in nodes_rows}

            try:
                G = deserialize_graph(graphs_row)
            except Exception as e:
                print(f"Error deserializing graph: {e}")
                raise HTTPException(status_code=500, detail=f"Error deserializing graph: {e}")

            try:
                # Create max distance dictionary {max_meter_xxx: value}
                max_distances = {key: value for key, value in kwargs.items() if key.startswith(PREFIX_AMENITY)}
                # Prepare the kwargs {key: (nodes, max distance)}
                amenity_kwargs = {
                    transform_key(key, PREFIX_AMENITY): (nodes_dict.get(transform_key(key, PREFIX_AMENITY)), value)
                    for key, value in max_distances.items()
                    if nodes_dict.get(transform_key(key, PREFIX_AMENITY))
                }

                # Find suitable apartment network nodes
                suitable_apartment_nnodes = find_suitable_apartment_network_nodes(
                    G, 
                    nodes_dict.get('apartment'), 
                    **amenity_kwargs
                )
            except Exception as e:
                print(f"Error in find_suitable_apartment_network_nodes: {e}")
                raise HTTPException(status_code=500, detail=f"Error in find_suitable_apartment_network_nodes: {e}")

            try:
                apartment_gdf = create_gdf_with_centroid(geom_centroid_rows)
            except Exception as e:
                print(f"Error creating GeoDataFrame: {e}")
                raise HTTPException(status_code=500, detail=f"Error creating GeoDataFrame: {e}")
            
            try:
                # Retrieve suitable apartment areas from network nodes
                suitable_apartment_gdf_with_geoms = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)
            except Exception as e:
                print(f"Error retrieving suitable apartments: {e}")
                raise HTTPException(status_code=500, detail=f"Error retrieving suitable apartments: {e}")

            suitable_apartment_polygon = (suitable_apartment_gdf_with_geoms.copy()).drop(columns=['centroid'])
            suitable_apartment_centroid = set_centroid(suitable_apartment_gdf_with_geoms.copy())

            end_time = time.time()
            print(f"Execution time for Analize Suitable Apartments: {end_time - start_time} seconds")
            
            return ORJSONResponse(content={
                "polygon": json.loads(suitable_apartment_polygon.to_json()),
                "centroid": json.loads(suitable_apartment_centroid.to_json())
            })

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
