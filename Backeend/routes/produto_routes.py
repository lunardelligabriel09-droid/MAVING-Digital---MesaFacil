import uuid

from flask import Blueprint, request

from config import UPLOADS_DIR
from models import categoria_repository, produto_repository
from utils.auth_middleware import login_required
from utils.responses import error, success
from utils.validators import (
    ValidationError,
    require_non_empty_string,
    require_non_negative_decimal,
    require_positive_int,
)

produto_bp = Blueprint("produto", __name__, url_prefix="/api/produtos")

EXTENSOES_PERMITIDAS = {"png", "jpg", "jpeg", "webp"}


@produto_bp.get("")
def listar():
    apenas_ativos = request.args.get("ativos") == "1"
    id_categoria = request.args.get("id_categoria", type=int)
    busca = request.args.get("busca")
    return success(produto_repository.list_all(apenas_ativos, id_categoria, busca))


@produto_bp.get("/<int:id_produto>")
def buscar(id_produto):
    produto = produto_repository.find_by_id(id_produto)
    if not produto:
        return error("Produto não encontrado.", status=404)
    return success(produto)


def _validar_categoria(id_categoria):
    categoria = categoria_repository.find_by_id(id_categoria)
    if not categoria:
        raise ValidationError("Categoria informada não existe.")
    return categoria


@produto_bp.post("")
@login_required(roles=["admin"])
def criar():
    data = request.get_json(silent=True) or {}
    try:
        id_categoria = require_positive_int(data.get("id_categoria"), "id_categoria")
        _validar_categoria(id_categoria)
        nome = require_non_empty_string(data.get("nome"), "nome", max_length=120)
        preco = require_non_negative_decimal(data.get("preco"), "preco")
        descricao = data.get("descricao")
        imagem = data.get("imagem")
        id_produto = produto_repository.create(id_categoria, nome, descricao, preco, imagem)
        return success(produto_repository.find_by_id(id_produto), status=201)
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@produto_bp.put("/<int:id_produto>")
@login_required(roles=["admin"])
def atualizar(id_produto):
    data = request.get_json(silent=True) or {}
    try:
        if not produto_repository.find_by_id(id_produto):
            return error("Produto não encontrado.", status=404)
        id_categoria = require_positive_int(data.get("id_categoria"), "id_categoria")
        _validar_categoria(id_categoria)
        nome = require_non_empty_string(data.get("nome"), "nome", max_length=120)
        preco = require_non_negative_decimal(data.get("preco"), "preco")
        descricao = data.get("descricao")
        imagem = data.get("imagem")
        produto_repository.update(id_produto, id_categoria, nome, descricao, preco, imagem)
        return success(produto_repository.find_by_id(id_produto))
    except ValidationError as exc:
        return error(exc.message, status=400, details=exc.details)


@produto_bp.put("/<int:id_produto>/status")
@login_required(roles=["admin"])
def alterar_status(id_produto):
    data = request.get_json(silent=True) or {}
    ativo = bool(data.get("ativo"))
    if not produto_repository.find_by_id(id_produto):
        return error("Produto não encontrado.", status=404)
    produto_repository.set_ativo(id_produto, ativo)
    return success(produto_repository.find_by_id(id_produto))


@produto_bp.delete("/<int:id_produto>")
@login_required(roles=["admin"])
def excluir(id_produto):
    if not produto_repository.find_by_id(id_produto):
        return error("Produto não encontrado.", status=404)
    produto_repository.set_ativo(id_produto, False)
    return success(message="Produto desativado com sucesso.")


@produto_bp.post("/imagem")
@login_required(roles=["admin"])
def upload_imagem():
    if "arquivo" not in request.files:
        return error("Nenhum arquivo enviado.", status=400)

    arquivo = request.files["arquivo"]
    if arquivo.filename == "":
        return error("Nenhum arquivo selecionado.", status=400)

    extensao = arquivo.filename.rsplit(".", 1)[-1].lower() if "." in arquivo.filename else ""
    if extensao not in EXTENSOES_PERMITIDAS:
        return error("Formato de imagem não suportado. Use PNG, JPG ou WEBP.", status=400)

    nome_arquivo = f"{uuid.uuid4().hex}.{extensao}"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    caminho = UPLOADS_DIR / nome_arquivo
    arquivo.save(caminho)

    return success({"imagem": f"/uploads/produtos/{nome_arquivo}"}, status=201)
