from fastapi import FastAPI, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import geojson, favorites, analyze, health

origins = [
    "http://localhost:5173",  # Your frontend URL
    "http://localhost:3000",  # Your backend URL 
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(geojson.router)
app.include_router(favorites.router)
app.include_router(analyze.router)