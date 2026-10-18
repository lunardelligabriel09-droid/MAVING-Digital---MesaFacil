import io

import qrcode

from config import Config


def montar_url_mesa(token: str) -> str:
    return f"{Config.APP_BASE_URL.rstrip('/')}/mesa/{token}"


def gerar_png(token: str) -> bytes:
    url = montar_url_mesa(token)
    img = qrcode.make(url, box_size=10, border=2)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer.getvalue()
