import os
from fastapi import HTTPException
import psycopg2.pool
from psycopg2 import DatabaseError

# Read environment variables
DB_USERNAME = os.getenv('DB_USERNAME', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'postgis')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'gis')
dsn = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
pool = psycopg2.pool.SimpleConnectionPool(minconn=2, maxconn=4, dsn=dsn)

# Dependency to get a database connection
def get_connection():
    try:
        conn = pool.getconn()
        try:
            yield conn
        finally:
            pool.putconn(conn)
    except DatabaseError:
        raise HTTPException(status_code=503, detail="Database connection pool exhausted")