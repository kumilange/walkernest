import json
import time
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import ORJSONResponse
from psycopg2 import DatabaseError
from concurrent.futures import ThreadPoolExecutor
from app.db import get_connection
from app.crud import fetch_network_nodes, fetch_apartment_geom_and_centroid, fetch_network_graph
from app.utils.geometry import create_gdf_with_centroid
from app.utils.networkx import deserialize_graph, find_suitable_apartment_network_nodes, retrieve_suitable_apartments

router = APIRouter()

PREFIX_AMENITY = "max_meter_"

def transform_key(key: str, prefix: str) -> str:
    """Remove the prefix from the key."""
    return key[len(prefix):] if key.startswith(prefix) else key

@router.get("/analyze")
def analyze_apartments(
    city_id: int = Query(...), 
    kwargs: str = Query(...),  # Accept kwargs as a JSON string
    conn=Depends(get_connection),
):
    try:
        # Parse kwargs from JSON string to dictionary
        kwargs = json.loads(kwargs)
        amenity_keys = [key.replace(PREFIX_AMENITY, '') for key in kwargs.keys()]
        start_time = time.time()

        with conn.cursor() as cur:
            with ThreadPoolExecutor() as executor:
                future_apartment_geom_and_centroid = executor.submit(fetch_apartment_geom_and_centroid, cur, city_id)
                apartment_geom_centroid_rows = future_apartment_geom_and_centroid.result()
                future_graph = executor.submit(fetch_network_graph, cur, city_id)
                graph_row = future_graph.result()
                future_nodes = executor.submit(fetch_network_nodes, cur, city_id, amenity_keys)
                nodes_rows = future_nodes.result()
            
            ### Normalize result data from DB
            apartment_gdf = create_gdf_with_centroid(apartment_geom_centroid_rows)
            G = deserialize_graph(graph_row)
            nodes_dict = {row[0]: row[1] for row in nodes_rows}

            ### Prepare the kwargs
            # Remove the prefix from the keys and create the max_distances dictionary
            max_distances = {
                key[len(PREFIX_AMENITY):]: value
                for key, value in kwargs.items()
                if key.startswith(PREFIX_AMENITY)
            }
            # Format the kwargs {key: (nodes, max distance)}
            amenity_kwargs = {
                key: (nodes_dict.get(key), value)
                for key, value in max_distances.items()
                if key in nodes_dict
            }

            ### Find suitable apartments
            suitable_apartment_nnodes = find_suitable_apartment_network_nodes(
                G, 
                nodes_dict.get('apartment'), 
                **amenity_kwargs
            )
            suitable_apartment_gdf = retrieve_suitable_apartments(apartment_gdf, G, suitable_apartment_nnodes)

            ### Format response
            # Drop centroid column
            suitable_apartment_polygon = suitable_apartment_gdf.copy().drop(columns=['centroid'])
            # Set centroid to geometry and drop centroid column
            suitable_apartment_centroid = suitable_apartment_gdf.copy().assign(geometry=suitable_apartment_gdf['centroid']).drop(columns=['centroid'])

            print(f"Execution time for Analize Suitable Apartments: {time.time() - start_time} seconds")
            
            return ORJSONResponse(content={
                "polygon": json.loads(suitable_apartment_polygon.to_json()),
                "centroid": json.loads(suitable_apartment_centroid.to_json())
            })

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
    

