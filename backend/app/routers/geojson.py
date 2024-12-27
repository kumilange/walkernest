import json
from fastapi import APIRouter, Depends, Query, HTTPException
from psycopg2 import DatabaseError
from app.db import get_connection
from app.crud import fetch_geojson

router = APIRouter()

@router.get("/geojsons")
def get_geojsons(city_id: int = Query(...), name: str = Query(...), is_centroid: bool = Query(False), conn=Depends(get_connection)):
    """
    Return GeoJSON FeatureCollection from the geojsons table based on city_id and name.
    """
    try:
        with conn.cursor() as cur:
            res = fetch_geojson(cur, city_id, name, is_centroid)

            # Merge properties
            features = []
            geojson = {}
            for row in res:
                geojson = {
                    'type': "Feature",
                    'geometry': json.loads(row[0]),
                    'properties': row[1]
                }
                features.append(geojson)
                
            # Return GeoJSON FeatureCollection
            return {
                "type": "FeatureCollection",
                "features": features,
            }

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
 