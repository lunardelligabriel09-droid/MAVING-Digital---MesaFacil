"""Popula o banco com usuários de teste e regenera os tokens de QR Code das mesas.

Uso:
    cd backend
    python seed.py
"""

from config import Config
from db.connection import get_cursor
from services.qrcode_service import montar_url_mesa
from utils.security import generate_table_token, hash_password

USUARIOS_TESTE = [
    ("Administrador do Sistema", "admin@mesafacil.com.br", Config.SEED_ADMIN_PASSWORD, "admin"),
    ("Operador de Caixa", "caixa@mesafacil.com.br", Config.SEED_CAIXA_PASSWORD, "caixa"),
    ("Cozinha Principal", "cozinha@mesafacil.com.br", Config.SEED_COZINHA_PASSWORD, "cozinha"),
]


def seed_usuarios():
    print("\n== Usuários de teste ==")
    with get_cursor() as cursor:
        for nome, email, senha, tipo in USUARIOS_TESTE:
            cursor.execute("SELECT id_usuario FROM usuario WHERE email = %s", (email,))
            if cursor.fetchone():
                print(f"  - {email} já existe, pulando.")
                continue
            cursor.execute(
                "INSERT INTO usuario (nome, email, senha_hash, tipo_usuario, ativo) "
                "VALUES (%s, %s, %s, %s, 1)",
                (nome, email, hash_password(senha), tipo),
            )
            print(f"  - criado: {email} / senha: {senha} / perfil: {tipo}")


def seed_tokens_mesa():
    print("\n== Tokens de QR Code das mesas ==")
    with get_cursor() as cursor:
        cursor.execute("SELECT id_mesa, numero, identificador_qr FROM mesa ORDER BY numero")
        mesas = cursor.fetchall()

    with get_cursor() as cursor:
        for mesa in mesas:
            if not mesa["identificador_qr"].startswith("seed-mesa-"):
                print(f"  - Mesa {mesa['numero']}: token já definido, pulando.")
                continue
            token = generate_table_token()
            cursor.execute(
                "UPDATE mesa SET identificador_qr = %s WHERE id_mesa = %s",
                (token, mesa["id_mesa"]),
            )
            print(f"  - Mesa {mesa['numero']}: {montar_url_mesa(token)}")


if __name__ == "__main__":
    seed_usuarios()
    seed_tokens_mesa()
    print("\nSeed concluído com sucesso.")
