from models import usuario_repository
from utils.auth_middleware import generate_token
from utils.security import verify_password
from utils.validators import ValidationError


def login(email: str, senha: str) -> dict:
    usuario = usuario_repository.find_by_email(email)
    if not usuario or not verify_password(senha, usuario["senha_hash"]):
        raise ValidationError("E-mail ou senha inválidos.")

    if not usuario["ativo"]:
        raise ValidationError("Este usuário está desativado. Contate o administrador.")

    token = generate_token(usuario)
    return {
        "token": token,
        "usuario": {
            "id_usuario": usuario["id_usuario"],
            "nome": usuario["nome"],
            "email": usuario["email"],
            "tipo_usuario": usuario["tipo_usuario"],
        },
    }
