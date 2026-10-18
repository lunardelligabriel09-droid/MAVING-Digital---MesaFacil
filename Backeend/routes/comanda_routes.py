from flask import Blueprint, request

from services import comanda_service
from utils.auth_middleware import login_required
from utils.responses import error, success
from utils.validators import ValidationError

comanda_bp = Blueprint("comanda", __name__, url_prefix="/api/comandas")


@comanda_bp.get("")
@login_required(roles=["admin", "caixa"])
def listar():
    status = request.args.get("status")
    try:
        return success(comanda_service.listar(status))
    except ValidationError as exc:
        return error(exc.message, status=400)


@comanda_bp.get("/<int:id_comanda>")
@login_required(roles=["admin", "caixa"])
def buscar(id_comanda):
    try:
        return success(comanda_service.buscar_detalhe(id_comanda))
    except ValidationError as exc:
        return error(exc.message, status=404)


@comanda_bp.put("/<int:id_comanda>/fechar")
@login_required(roles=["admin", "caixa"])
def fechar(id_comanda):
    try:
        return success(comanda_service.fechar(id_comanda), message="Comanda fechada com sucesso.")
    except ValidationError as exc:
        return error(exc.message, status=409, details=exc.details)
