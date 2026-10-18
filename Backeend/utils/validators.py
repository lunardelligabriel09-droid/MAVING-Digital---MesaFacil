class ValidationError(Exception):
    def __init__(self, message, details=None):
        super().__init__(message)
        self.message = message
        self.details = details


def require_fields(data: dict, fields: list[str]):
    if not isinstance(data, dict):
        raise ValidationError("Corpo da requisição inválido, esperado um objeto JSON.")
    faltando = [campo for campo in fields if data.get(campo) in (None, "")]
    if faltando:
        raise ValidationError(
            "Campos obrigatórios ausentes.",
            details={"campos": faltando},
        )


def require_non_empty_string(value, field_name: str, max_length: int | None = None):
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"O campo '{field_name}' deve ser um texto não vazio.")
    if max_length and len(value.strip()) > max_length:
        raise ValidationError(f"O campo '{field_name}' excede o tamanho máximo de {max_length} caracteres.")
    return value.strip()


def require_positive_int(value, field_name: str):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"O campo '{field_name}' deve ser um número inteiro.")
    if parsed <= 0:
        raise ValidationError(f"O campo '{field_name}' deve ser maior que zero.")
    return parsed


def require_non_negative_decimal(value, field_name: str):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise ValidationError(f"O campo '{field_name}' deve ser numérico.")
    if parsed < 0:
        raise ValidationError(f"O campo '{field_name}' não pode ser negativo.")
    return round(parsed, 2)


def require_email(value, field_name: str = "email"):
    text = require_non_empty_string(value, field_name, max_length=150)
    if "@" not in text or "." not in text.split("@")[-1]:
        raise ValidationError(f"O campo '{field_name}' deve ser um e-mail válido.")
    return text.lower()
