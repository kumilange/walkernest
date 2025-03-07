from fastapi import APIRouter
import requests

router = APIRouter()

@router.get("/proxy/osrm")
def get_osrm_route(coordinates: str):
    """Fetches the route from the OSRM API based on the provided coordinates."""
    osrm_url = f"http://router.project-osrm.org/route/v1/driving/{coordinates}?overview=full&geometries=geojson&steps=true"
    response = requests.get(osrm_url)
    return response.json()
