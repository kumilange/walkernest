import json
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import JSONResponse
from psycopg2 import DatabaseError
from app.db import get_connection
from app.crud import fetch_favorites

router = APIRouter()

@router.get("/favorites")
def get_favorites(ids: list = Query(...), conn=Depends(get_connection)):
    """
    Return List of feature from the geojsons table based on property IDs.
    """
    try:
        with conn.cursor() as cur:
            res = fetch_favorites(cur, ids)
            
            features = []
            geojson = {}
            for row in res:
                geojson = {
                    'type': "Feature",
                    'geometry': json.loads(row[0]),
                    'properties': row[1],
                }
                features.append(geojson)

            return JSONResponse(content=features)

    except DatabaseError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")