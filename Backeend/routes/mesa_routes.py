from flask import Blueprint, Response, request

from models import mesa_repository
from services import qrcode_service
from utils.auth_middleware import login_required
from utils.responses import error, success
from utils.security import generate_table_token
from utils.validators import ValidationError, require_positive_int

mesa_bp = Blueprint("mesa", __name__, url_prefix="/api/mesas")


@mesa_bp.get("")
@login_required(roles=["admin", "caixa"])
def listar():
    return success(mesa_repository.list_all())


@mesa_bp.get("/<int:id_mesa>")
@login_required(roles=["admin", "caixa"])
def buscar(id_mesa):
    mesa = mesa_repository.find_by_id(id_mesa)
    if not mesa:
        return error("Mesa não encontrada.", status=404)
    return success(mesa)


@mesa_bp.post("")
@login_required(roles=["admin"])
def criar():
    data = request.get_json(silent=True) or {}
    try:
        numero = require_positive_int(data.get("numero"), "numero")
        if mesa_repository.find_by_numero(numero):
            raise ValidationError(f"Já existe uma mesa com o número {numero}.")
        token = generate_table_token()
        id_mesa = mesa_repository.create(numero, token)
        return success(mesa_repository.find_by_id(id_mesa), status=201)
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@mesa_bp.put("/<int:id_mesa>")
@login_required(roles=["admin"])
def atualizar(id_mesa):
    data = request.get_json(silent=True) or {}
    try:
        if not mesa_repository.find_by_id(id_mesa):
            return error("Mesa não encontrada.", status=404)
        numero = require_positive_int(data.get("numero"), "numero")
        existente = mesa_repository.find_by_numero(numero)
        if existente and existente["id_mesa"] != id_mesa:
            raise ValidationError(f"Já existe uma mesa com o número {numero}.")
        mesa_repository.update(id_mesa, numero)
        if "status" in data and data["status"] in ("ativa", "inativa"):
            mesa_repository.set_status(id_mesa, data["status"])
        return success(mesa_repository.find_by_id(id_mesa))
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@mesa_bp.put("/<int:id_mesa>/status")
@login_required(roles=["admin"])
def alterar_status(id_mesa):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("ativa", "inativa"):
        return error("Status inválido. Use 'ativa' ou 'inativa'.", status=400)
    if not mesa_repository.find_by_id(id_mesa):
        return error("Mesa não encontrada.", status=404)
    mesa_repository.set_status(id_mesa, status)
    return success(mesa_repository.find_by_id(id_mesa))


@mesa_bp.post("/<int:id_mesa>/regenerar-qrcode")
@login_required(roles=["admin"])
def regenerar_qrcode(id_mesa):
    if not mesa_repository.find_by_id(id_mesa):
        return error("Mesa não encontrada.", status=404)
    token = generate_table_token()
    mesa_repository.regenerate_token(id_mesa, token)
    return success(mesa_repository.find_by_id(id_mesa))


@mesa_bp.get("/<int:id_mesa>/qrcode")
@login_required(roles=["admin"])
def obter_qrcode(id_mesa):
    mesa = mesa_repository.find_by_id(id_mesa)
    if not mesa:
        return error("Mesa não encontrada.", status=404)
    png_bytes = qrcode_service.gerar_png(mesa["identificador_qr"])
    return Response(png_bytes, mimetype="image/png")


@mesa_bp.delete("/<int:id_mesa>")
@login_required(roles=["admin"])
def excluir(id_mesa):
    if not mesa_repository.find_by_id(id_mesa):
        return error("Mesa não encontrada.", status=404)
    if mesa_repository.has_comandas(id_mesa):
        mesa_repository.set_status(id_mesa, "inativa")
        return success(message="Mesa possui histórico de comandas; foi desativada em vez de excluída.")
    mesa_repository.delete(id_mesa)
    return success(message="Mesa excluída com sucesso.")
