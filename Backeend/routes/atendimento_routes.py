from flask import Blueprint, request

from services import atendimento_service
from utils.responses import error, success
from utils.validators import ValidationError, require_fields, require_positive_int

atendimento_bp = Blueprint("atendimento", __name__, url_prefix="/api/atendimento")


@atendimento_bp.get("/mesa/<token>")
def resolver_mesa(token):
    try:
        mesa = atendimento_service.resolver_mesa_por_token(token)
        return success({
            "id_mesa": mesa["id_mesa"],
            "numero": mesa["numero"],
        })
    except ValidationError as exc:
        return error(exc.message, status=404, details=exc.details)


@atendimento_bp.post("/iniciar")
def iniciar():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["token", "nome"])
        resultado = atendimento_service.iniciar_atendimento(data["token"], data["nome"])
        return success({
            "mesa": {"id_mesa": resultado["mesa"]["id_mesa"], "numero": resultado["mesa"]["numero"]},
            "cliente": resultado["cliente"],
            "comanda": resultado["comanda"],
        })
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@atendimento_bp.post("/retomar")
def retomar():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["token", "id_comanda"])
        id_comanda = require_positive_int(data["id_comanda"], "id_comanda")
        resultado = atendimento_service.retomar_comanda(id_comanda, data["token"])
        return success({
            "mesa": {"id_mesa": resultado["mesa"]["id_mesa"], "numero": resultado["mesa"]["numero"]},
            "cliente": resultado["cliente"],
            "comanda": resultado["comanda"],
        })
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)
