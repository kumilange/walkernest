import json
from fastapi import APIRouter, Depends, Query, HTTPException
from psycopg2 import DatabaseError
from app.db import get_connection
from app.crud import fetch_amenities

router = APIRouter()

@router.get("/amenities")
def get_amenities(city_id: int = Query(...), name: str = Query(...), is_centroid: bool = Query(False), conn=Depends(get_connection)):
    """Return GeoJSON FeatureCollection from the amenities table based on city_id and name."""
    try:
        with conn.cursor() as cur:
            res = fetch_amenities(cur, city_id, name, is_centroid)

            features = []
            geojson = {}
            for row in res:
                geojson = {
                    'type': "Feature",
                    'geometry': json.loads(row[0]),
                    'properties': row[1]
                }
                features.append(geojson)
                
            return {
                "type": "FeatureCollection",
                "features": features,
            }

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
 