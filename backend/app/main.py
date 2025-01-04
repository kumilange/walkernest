import os
from fastapi import FastAPI, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import geojson, favorites, analyze, health

DB_HOST = os.getenv('DB_HOST', 'postgis')
DB_PORT = os.getenv('DB_PORT', '5432')
NODE_ENV = os.getenv('NODE_ENV', 'production')

frontend_url = f"http://{DB_HOST}" if NODE_ENV == "production" else "http://localhost:5173"

origins = [
	"http://localhost", # local prod frontend URL
	"http://localhost:5173", # local dev frontend URL
	"http://localhost:3000", # local backend URL
    f"http://{DB_HOST}", # aws frontend URL
    f"http://{DB_HOST}:3000",  # aws backend URL 
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