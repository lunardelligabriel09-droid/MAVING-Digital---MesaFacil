from flask import Blueprint, request

from services import auth_service
from utils.responses import error, success
from utils.validators import ValidationError, require_fields

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    try:
        require_fields(data, ["email", "senha"])
        resultado = auth_service.login(data["email"], data["senha"])
        return success(resultado)
    except ValidationError as exc:
        return error(exc.message, status=401, details=exc.details)
