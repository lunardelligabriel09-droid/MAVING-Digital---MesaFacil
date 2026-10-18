from db.connection import get_cursor


def list_all(apenas_ativas=False):
    with get_cursor() as cursor:
        if apenas_ativas:
            cursor.execute("SELECT * FROM categoria WHERE ativo = 1 ORDER BY nome")
        else:
            cursor.execute("SELECT * FROM categoria ORDER BY nome")
        return cursor.fetchall()


def find_by_id(id_categoria: int):
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM categoria WHERE id_categoria = %s", (id_categoria,))
        return cursor.fetchone()


def create(nome: str, descricao: str | None):
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO categoria (nome, descricao, ativo) VALUES (%s, %s, 1)",
            (nome, descricao),
        )
        return cursor.lastrowid


def update(id_categoria: int, nome: str, descricao: str | None):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE categoria SET nome = %s, descricao = %s WHERE id_categoria = %s",
            (nome, descricao, id_categoria),
        )
        return cursor.rowcount


def set_ativo(id_categoria: int, ativo: bool):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE categoria SET ativo = %s WHERE id_categoria = %s",
            (1 if ativo else 0, id_categoria),
        )
        return cursor.rowcount


def has_produtos(id_categoria: int) -> bool:
    with get_cursor() as cursor:
        cursor.execute("SELECT 1 FROM produto WHERE id_categoria = %s LIMIT 1", (id_categoria,))
        return cursor.fetchone() is not None
