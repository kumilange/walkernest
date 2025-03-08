import os
from fastapi import FastAPI, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import favorites, analyze, amenities, proxy, health

DOMAIN_NAME = os.getenv('DOMAIN_NAME')

origins = [
	"http://localhost", # local prod frontend URL
	"http://localhost:5173", # local dev frontend URL
	"http://localhost:3000", # local backend URL
    f"http://{DOMAIN_NAME}", # public domain name
	f"https://{DOMAIN_NAME}", # public domain name
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
app.include_router(amenities.router)
app.include_router(favorites.router)
app.include_router(analyze.router)
app.include_router(proxy.router)
