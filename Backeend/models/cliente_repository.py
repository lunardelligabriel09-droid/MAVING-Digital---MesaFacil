from db.connection import get_cursor


def find_by_id(id_cliente: int):
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM cliente WHERE id_cliente = %s", (id_cliente,))
        return cursor.fetchone()


def find_by_nome_exato(nome: str):
   
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM cliente WHERE LOWER(nome) = LOWER(%s) "
            "ORDER BY data_cadastro DESC LIMIT 1",
            (nome,),
        )
        return cursor.fetchone()


def create(nome: str):
    with get_cursor() as cursor:
        cursor.execute("INSERT INTO cliente (nome) VALUES (%s)", (nome,))
        return cursor.lastrowid
