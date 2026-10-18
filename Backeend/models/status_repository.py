from db.connection import get_cursor


def list_all():
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM status_pedido ORDER BY ordem")
        return cursor.fetchall()


def find_by_nome(nome: str):
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM status_pedido WHERE nome = %s", (nome,))
        return cursor.fetchone()
