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

# Frontend estático (HTML/CSS/JS puro) servido pelo mesmo processo
# para permitir execução local com um único comando.

@app.get("/app/<path:filepath>")
def frontend_assets(filepath):
    return send_from_directory(FRONTEND_DIR, filepath)


@app.get("/")
def home():
    return send_from_directory(FRONTEND_DIR / "admin", "login.html")


@app.get("/mesa/<token>")
def pagina_cliente(token):
    return send_from_directory(FRONTEND_DIR / "cliente", "index.html")


@app.get("/cozinha")
def pagina_cozinha():
    return send_from_directory(FRONTEND_DIR / "cozinha", "index.html")


@app.get("/caixa")
def pagina_caixa():
    return send_from_directory(FRONTEND_DIR / "caixa", "index.html")


@app.get("/caixa/comanda")
def pagina_caixa_comanda():
    return send_from_directory(FRONTEND_DIR / "caixa", "comanda.html")


@app.get("/admin/login")
def pagina_admin_login():
    return send_from_directory(FRONTEND_DIR / "admin", "login.html")


@app.get("/admin")
@app.get("/admin/dashboard")
def pagina_admin_dashboard():
    return send_from_directory(FRONTEND_DIR / "admin", "dashboard.html")


@app.get("/admin/produtos")
def pagina_admin_produtos():
    return send_from_directory(FRONTEND_DIR / "admin", "produtos.html")


@app.get("/admin/categorias")
def pagina_admin_categorias():
    return send_from_directory(FRONTEND_DIR / "admin", "categorias.html")


@app.get("/admin/mesas")
def pagina_admin_mesas():
    return send_from_directory(FRONTEND_DIR / "admin", "mesas.html")


@app.get("/admin/usuarios")
def pagina_admin_usuarios():
    return send_from_directory(FRONTEND_DIR / "admin", "usuarios.html")



# Tratamento padrão de erros

@app.errorhandler(404)
def not_found(_exc):
    return error("Recurso não encontrado.", status=404)


@app.errorhandler(405)
def method_not_allowed(_exc):
    return error("Método não permitido para este endpoint.", status=405)


@app.errorhandler(500)
def internal_error(_exc):
    return error("Erro interno do servidor.", status=500)


if __name__ == "__main__":
    app.run(host=Config.FLASK_HOST, port=Config.FLASK_PORT, debug=Config.FLASK_DEBUG)




