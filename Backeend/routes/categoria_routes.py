from flask import Blueprint, request

from models import categoria_repository
from utils.auth_middleware import login_required
from utils.responses import error, success
from utils.validators import ValidationError, require_non_empty_string

categoria_bp = Blueprint("categoria", __name__, url_prefix="/api/categorias")


@categoria_bp.get("")
def listar():
    apenas_ativas = request.args.get("ativas") == "1"
    return success(categoria_repository.list_all(apenas_ativas))


@categoria_bp.get("/<int:id_categoria>")
def buscar(id_categoria):
    categoria = categoria_repository.find_by_id(id_categoria)
    if not categoria:
        return error("Categoria não encontrada.", status=404)
    return success(categoria)


@categoria_bp.post("")
@login_required(roles=["admin"])
def criar():
    data = request.get_json(silent=True) or {}
    try:
        nome = require_non_empty_string(data.get("nome"), "nome", max_length=80)
        descricao = data.get("descricao")
        id_categoria = categoria_repository.create(nome, descricao)
        return success(categoria_repository.find_by_id(id_categoria), status=201)
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@categoria_bp.put("/<int:id_categoria>")
@login_required(roles=["admin"])
def atualizar(id_categoria):
    data = request.get_json(silent=True) or {}
    try:
        if not categoria_repository.find_by_id(id_categoria):
            return error("Categoria não encontrada.", status=404)
        nome = require_non_empty_string(data.get("nome"), "nome", max_length=80)
        descricao = data.get("descricao")
        categoria_repository.update(id_categoria, nome, descricao)
        return success(categoria_repository.find_by_id(id_categoria))
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@categoria_bp.put("/<int:id_categoria>/status")
@login_required(roles=["admin"])
def alterar_status(id_categoria):
    data = request.get_json(silent=True) or {}
    ativo = bool(data.get("ativo"))
    if not categoria_repository.find_by_id(id_categoria):
        return error("Categoria não encontrada.", status=404)
    categoria_repository.set_ativo(id_categoria, ativo)
    return success(categoria_repository.find_by_id(id_categoria))


@categoria_bp.delete("/<int:id_categoria>")
@login_required(roles=["admin"])
def excluir(id_categoria):
    if not categoria_repository.find_by_id(id_categoria):
        return error("Categoria não encontrada.", status=404)
    if categoria_repository.has_produtos(id_categoria):
        categoria_repository.set_ativo(id_categoria, False)
        return success(message="Categoria possui produtos vinculados; foi desativada em vez de excluída.")
    categoria_repository.set_ativo(id_categoria, False)
    return success(message="Categoria desativada com sucesso.")
