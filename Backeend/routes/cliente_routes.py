from flask import Blueprint, request

from models import cliente_repository
from utils.auth_middleware import login_required
from utils.responses import error, success
from utils.validators import ValidationError, require_fields, require_non_empty_string

cliente_bp = Blueprint("cliente", __name__, url_prefix="/api/clientes")


@cliente_bp.post("")
def criar():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["nome"])
        nome = require_non_empty_string(data["nome"], "nome", max_length=120)
        id_cliente = cliente_repository.create(nome)
        return success(cliente_repository.find_by_id(id_cliente), status=201)
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@cliente_bp.get("/<int:id_cliente>")
@login_required(roles=["admin", "caixa"])
def buscar(id_cliente):
    cliente = cliente_repository.find_by_id(id_cliente)
    if not cliente:
        return error("Cliente não encontrado.", status=404)
    return success(cliente)
