import datetime

from flask import Flask, send_from_directory
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS

from config import Config, FRONTEND_DIR, UPLOADS_DIR
from routes.atendimento_routes import atendimento_bp
from routes.auth_routes import auth_bp
from routes.categoria_routes import categoria_bp
from routes.cliente_routes import cliente_bp
from routes.comanda_routes import comanda_bp
from routes.mesa_routes import mesa_bp
from routes.pedido_routes import pedido_bp
from routes.produto_routes import produto_bp
from routes.status_routes import status_bp
from routes.usuario_routes import usuario_bp
from utils.responses import error

class ISOJSONProvider(DefaultJSONProvider):
    """Serializa datas em ISO 8601 (o padrão HTTP do Flask quebra o Date() do JS)."""

    @staticmethod
    def default(obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        return DefaultJSONProvider.default(obj)


app = Flask(__name__, static_folder=None)
app.json = ISOJSONProvider(app)
CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(atendimento_bp)
app.register_blueprint(cliente_bp)
app.register_blueprint(mesa_bp)
app.register_blueprint(categoria_bp)
app.register_blueprint(produto_bp)
app.register_blueprint(comanda_bp)
app.register_blueprint(pedido_bp)
app.register_blueprint(status_bp)
app.register_blueprint(usuario_bp)



# Arquivos enviados (imagens de produtos)

@app.get("/uploads/produtos/<path:filename>")
def uploads(filename):
    return send_from_directory(UPLOADS_DIR, filename)



