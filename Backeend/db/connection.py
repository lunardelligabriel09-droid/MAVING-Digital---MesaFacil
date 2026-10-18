from contextlib import contextmanager

from mysql.connector import pooling

from config import Config

_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="mesafacil_pool",
            pool_size=8,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            charset="utf8mb4",
            autocommit=False,
        )
    return _pool


@contextmanager
def get_connection():
    
    connection = _get_pool().get_connection()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


@contextmanager
def get_cursor(dictionary=True):
    with get_connection() as connection:
        cursor = connection.cursor(dictionary=dictionary)
        try:
            yield cursor
        finally:
            cursor.close()
