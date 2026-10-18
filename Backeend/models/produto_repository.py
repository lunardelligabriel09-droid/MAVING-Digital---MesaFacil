from db.connection import get_cursor


def list_all(apenas_ativos=False, id_categoria=None, busca=None):
    query = (
        "SELECT p.*, c.nome AS nome_categoria FROM produto p "
        "JOIN categoria c ON c.id_categoria = p.id_categoria WHERE 1 = 1"
    )
    params = []

    if apenas_ativos:
        query += " AND p.ativo = 1"
    if id_categoria:
        query += " AND p.id_categoria = %s"
        params.append(id_categoria)
    if busca:
        query += " AND p.nome LIKE %s"
        params.append(f"%{busca}%")

    query += " ORDER BY c.nome, p.nome"

    with get_cursor() as cursor:
        cursor.execute(query, tuple(params))
        return cursor.fetchall()


def find_by_id(id_produto: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT p.*, c.nome AS nome_categoria FROM produto p "
            "JOIN categoria c ON c.id_categoria = p.id_categoria "
            "WHERE p.id_produto = %s",
            (id_produto,),
        )
        return cursor.fetchone()


def create(id_categoria: int, nome: str, descricao, preco: float, imagem):
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO produto (id_categoria, nome, descricao, preco, imagem, ativo) "
            "VALUES (%s, %s, %s, %s, %s, 1)",
            (id_categoria, nome, descricao, preco, imagem),
        )
        return cursor.lastrowid


def update(id_produto: int, id_categoria: int, nome: str, descricao, preco: float, imagem):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE produto SET id_categoria = %s, nome = %s, descricao = %s, "
            "preco = %s, imagem = %s WHERE id_produto = %s",
            (id_categoria, nome, descricao, preco, imagem, id_produto),
        )
        return cursor.rowcount


def set_ativo(id_produto: int, ativo: bool):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE produto SET ativo = %s WHERE id_produto = %s",
            (1 if ativo else 0, id_produto),
        )
        return cursor.rowcount
