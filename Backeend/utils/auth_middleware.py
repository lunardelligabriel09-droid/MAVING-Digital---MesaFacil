import datetime
from functools import wraps

import jwt
from flask import g, request

from config import Config
from utils.responses import error


def generate_token(usuario: dict) -> str:
    payload = {
        "id_usuario": usuario["id_usuario"],
        "nome": usuario["nome"],
        "email": usuario["email"],
        "tipo_usuario": usuario["tipo_usuario"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=Config.JWT_EXPIRATION_MINUTES),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])


def login_required(roles: list[str] | None = None):
    """Decorator que exige um JWT válido e, opcionalmente, um dos perfis informados."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return error("Token de autenticação ausente.", status=401)

            token = auth_header.split(" ", 1)[1].strip()
            try:
                payload = decode_token(token)
            except jwt.ExpiredSignatureError:
                return error("Sessão expirada, faça login novamente.", status=401)
            except jwt.InvalidTokenError:
                return error("Token de autenticação inválido.", status=401)

            if roles and payload.get("tipo_usuario") not in roles:
                return error("Você não tem permissão para acessar este recurso.", status=403)

            g.usuario_atual = payload
            return fn(*args, **kwargs)

        return wrapper

    return decorator
