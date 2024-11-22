from fastapi import HTTPException
import psycopg2.pool
from psycopg2 import DatabaseError

pool = psycopg2.pool.SimpleConnectionPool(
    dsn="postgresql://postgres:postgres@postgis:5432/gis", minconn=2, maxconn=4
)

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