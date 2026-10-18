from flask import Blueprint, request

from models import usuario_repository
from utils.auth_middleware import login_required
from utils.responses import error, success
from utils.security import hash_password
from utils.validators import ValidationError, require_email, require_fields, require_non_empty_string

usuario_bp = Blueprint("usuario", __name__, url_prefix="/api/usuarios")

PERFIS_VALIDOS = ("admin", "caixa", "cozinha")


@usuario_bp.get("")
@login_required(roles=["admin"])
def listar():
    return success(usuario_repository.list_all())


@usuario_bp.get("/<int:id_usuario>")
@login_required(roles=["admin"])
def buscar(id_usuario):
    usuario = usuario_repository.find_by_id(id_usuario)
    if not usuario:
        return error("Usuário não encontrado.", status=404)
    return success(usuario)


@usuario_bp.post("")
@login_required(roles=["admin"])
def criar():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["nome", "email", "senha", "tipo_usuario"])
        nome = require_non_empty_string(data["nome"], "nome", max_length=120)
        email = require_email(data["email"])
        senha = require_non_empty_string(data["senha"], "senha")
        if len(senha) < 6:
            raise ValidationError("A senha deve ter ao menos 6 caracteres.")
        tipo_usuario = data["tipo_usuario"]
        if tipo_usuario not in PERFIS_VALIDOS:
            raise ValidationError("Perfil inválido. Use admin, caixa ou cozinha.")
        if usuario_repository.find_by_email(email):
            raise ValidationError("Já existe um usuário cadastrado com este e-mail.")

        id_usuario = usuario_repository.create(nome, email, hash_password(senha), tipo_usuario)
        return success(usuario_repository.find_by_id(id_usuario), status=201)
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@usuario_bp.put("/<int:id_usuario>")
@login_required(roles=["admin"])
def atualizar(id_usuario):
    data = request.get_json(silent=True) or {}
    try:
        if not usuario_repository.find_by_id(id_usuario):
            return error("Usuário não encontrado.", status=404)
        nome = require_non_empty_string(data.get("nome"), "nome", max_length=120)
        email = require_email(data.get("email"))
        tipo_usuario = data.get("tipo_usuario")
        if tipo_usuario not in PERFIS_VALIDOS:
            raise ValidationError("Perfil inválido. Use admin, caixa ou cozinha.")

        existente = usuario_repository.find_by_email(email)
        if existente and existente["id_usuario"] != id_usuario:
            raise ValidationError("Já existe um usuário cadastrado com este e-mail.")

        usuario_repository.update(id_usuario, nome, email, tipo_usuario)

        if data.get("senha"):
            if len(data["senha"]) < 6:
                raise ValidationError("A senha deve ter ao menos 6 caracteres.")
            usuario_repository.update_senha(id_usuario, hash_password(data["senha"]))

        return success(usuario_repository.find_by_id(id_usuario))
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@usuario_bp.put("/<int:id_usuario>/status")
@login_required(roles=["admin"])
def alterar_status(id_usuario):
    data = request.get_json(silent=True) or {}
    ativo = bool(data.get("ativo"))
    if not usuario_repository.find_by_id(id_usuario):
        return error("Usuário não encontrado.", status=404)
    usuario_repository.set_ativo(id_usuario, ativo)
    return success(usuario_repository.find_by_id(id_usuario))
