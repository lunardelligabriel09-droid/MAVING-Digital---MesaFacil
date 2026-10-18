from db.connection import get_cursor


def find_by_email(email: str):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id_usuario, nome, email, senha_hash, tipo_usuario, ativo "
            "FROM usuario WHERE email = %s",
            (email,),
        )
        return cursor.fetchone()


def find_by_id(id_usuario: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id_usuario, nome, email, tipo_usuario, ativo FROM usuario WHERE id_usuario = %s",
            (id_usuario,),
        )
        return cursor.fetchone()


def list_all():
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT id_usuario, nome, email, tipo_usuario, ativo FROM usuario ORDER BY nome"
        )
        return cursor.fetchall()


def create(nome: str, email: str, senha_hash: str, tipo_usuario: str):
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO usuario (nome, email, senha_hash, tipo_usuario, ativo) "
            "VALUES (%s, %s, %s, %s, 1)",
            (nome, email, senha_hash, tipo_usuario),
        )
        return cursor.lastrowid


def update(id_usuario: int, nome: str, email: str, tipo_usuario: str):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE usuario SET nome = %s, email = %s, tipo_usuario = %s WHERE id_usuario = %s",
            (nome, email, tipo_usuario, id_usuario),
        )
        return cursor.rowcount


def update_senha(id_usuario: int, senha_hash: str):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE usuario SET senha_hash = %s WHERE id_usuario = %s",
            (senha_hash, id_usuario),
        )
        return cursor.rowcount


def set_ativo(id_usuario: int, ativo: bool):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE usuario SET ativo = %s WHERE id_usuario = %s",
            (1 if ativo else 0, id_usuario),
        )
        return cursor.rowcount
