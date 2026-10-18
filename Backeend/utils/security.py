import secrets

from werkzeug.security import check_password_hash, generate_password_hash


def hash_password(plain_password: str) -> str:
    return generate_password_hash(plain_password, method="pbkdf2:sha256", salt_length=16)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, plain_password)


def generate_table_token() -> str:
    """Token opaco e imprevisível usado na URL do QR Code da mesa."""
    return secrets.token_urlsafe(24)
