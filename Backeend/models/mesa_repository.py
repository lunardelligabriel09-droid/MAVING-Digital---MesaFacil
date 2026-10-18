from db.connection import get_cursor


def list_all(apenas_ativas=False):
    with get_cursor() as cursor:
        if apenas_ativas:
            cursor.execute("SELECT * FROM mesa WHERE status = 'ativa' ORDER BY numero")
        else:
            cursor.execute("SELECT * FROM mesa ORDER BY numero")
        return cursor.fetchall()


def find_by_id(id_mesa: int):
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM mesa WHERE id_mesa = %s", (id_mesa,))
        return cursor.fetchone()


def find_by_numero(numero: int):
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM mesa WHERE numero = %s", (numero,))
        return cursor.fetchone()


def find_by_token(token: str):
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM mesa WHERE identificador_qr = %s", (token,))
        return cursor.fetchone()


def create(numero: int, token: str):
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO mesa (numero, identificador_qr, status) VALUES (%s, %s, 'ativa')",
            (numero, token),
        )
        return cursor.lastrowid


def update(id_mesa: int, numero: int):
    with get_cursor() as cursor:
        cursor.execute("UPDATE mesa SET numero = %s WHERE id_mesa = %s", (numero, id_mesa))
        return cursor.rowcount


def set_status(id_mesa: int, status: str):
    with get_cursor() as cursor:
        cursor.execute("UPDATE mesa SET status = %s WHERE id_mesa = %s", (status, id_mesa))
        return cursor.rowcount


def regenerate_token(id_mesa: int, token: str):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE mesa SET identificador_qr = %s WHERE id_mesa = %s", (token, id_mesa)
        )
        return cursor.rowcount


def has_comandas(id_mesa: int) -> bool:
    with get_cursor() as cursor:
        cursor.execute("SELECT 1 FROM comanda WHERE id_mesa = %s LIMIT 1", (id_mesa,))
        return cursor.fetchone() is not None


def delete(id_mesa: int):
    with get_cursor() as cursor:
        cursor.execute("DELETE FROM mesa WHERE id_mesa = %s", (id_mesa,))
        return cursor.rowcount
