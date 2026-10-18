from flask import Blueprint

from models import status_repository
from utils.responses import success

status_bp = Blueprint("status", __name__, url_prefix="/api/status-pedido")


@status_bp.get("")
def listar():
    return success(status_repository.list_all())
