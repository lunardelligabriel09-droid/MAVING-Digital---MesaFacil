from flask import Blueprint, request

from services import pedido_service
from utils.auth_middleware import login_required
from utils.responses import error, success
from utils.validators import ValidationError, require_fields, require_positive_int

pedido_bp = Blueprint("pedido", __name__, url_prefix="/api/pedidos")


@pedido_bp.post("")
def criar():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["id_comanda", "itens"])
        id_comanda = require_positive_int(data["id_comanda"], "id_comanda")
        pedido = pedido_service.criar_pedido(id_comanda, data["itens"])
        return success(pedido, status=201, message="Pedido enviado à cozinha com sucesso.")
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@pedido_bp.get("/cozinha")
@login_required(roles=["cozinha", "admin"])
def listar_cozinha():
    return success(pedido_service.listar_para_cozinha())


@pedido_bp.get("/cliente/<int:id_cliente>")
def listar_por_cliente(id_cliente):
    return success(pedido_service.listar_por_cliente(id_cliente))


@pedido_bp.get("/<int:id_pedido>")
def buscar(id_pedido):
    try:
        return success(pedido_service.buscar_pedido(id_pedido))
    except ValidationError as exc:
        return error(exc.message, status=404)


@pedido_bp.put("/<int:id_pedido>/status")
@login_required(roles=["cozinha", "admin"])
def atualizar_status(id_pedido):
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["status"])
        pedido = pedido_service.atualizar_status(id_pedido, data["status"])
        return success(pedido)
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)
