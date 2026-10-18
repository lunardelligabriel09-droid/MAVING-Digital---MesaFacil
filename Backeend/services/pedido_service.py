from models import comanda_repository, pedido_repository, produto_repository, status_repository
from utils.validators import ValidationError, require_non_empty_string, require_positive_int

TRANSICOES_VALIDAS = {
    "RECEBIDO": {"EM_PREPARO", "CANCELADO"},
    "EM_PREPARO": {"PRONTO", "CANCELADO"},
    "PRONTO": {"ENTREGUE", "CANCELADO"},
    "ENTREGUE": set(),
    "CANCELADO": set(),
}


def _montar_pedido_completo(id_pedido: int) -> dict:
    pedido = pedido_repository.find_by_id(id_pedido)
    itens = pedido_repository.find_itens(id_pedido)
    pedido["itens"] = itens
    pedido["total"] = round(sum(float(item["subtotal"]) for item in itens), 2)
    return pedido


def criar_pedido(id_comanda: int, itens: list) -> dict:
    comanda = comanda_repository.find_by_id(id_comanda)
    if not comanda:
        raise ValidationError("Comanda não encontrada.")
    if comanda["status"] != "aberta":
        raise ValidationError("Esta comanda já foi fechada e não aceita novos pedidos.")

    if not isinstance(itens, list) or len(itens) == 0:
        raise ValidationError("O pedido deve conter ao menos um item.")

    itens_validados = []
    for item in itens:
        id_produto = require_positive_int(item.get("id_produto"), "id_produto")
        quantidade = require_positive_int(item.get("quantidade"), "quantidade")
        observacao = item.get("observacao")
        if observacao is not None:
            observacao = str(observacao).strip()[:255] or None

        produto = produto_repository.find_by_id(id_produto)
        if not produto:
            raise ValidationError(f"Produto {id_produto} não encontrado.")
        if not produto["ativo"]:
            raise ValidationError(f"O produto '{produto['nome']}' não está disponível no momento.")

        preco_unitario = float(produto["preco"])
        subtotal = round(preco_unitario * quantidade, 2)
        itens_validados.append(
            {
                "id_produto": id_produto,
                "quantidade": quantidade,
                "preco_unitario": preco_unitario,
                "observacao": observacao,
                "subtotal": subtotal,
            }
        )

    status_recebido = status_repository.find_by_nome("RECEBIDO")
    id_pedido = pedido_repository.create(id_comanda, status_recebido["id_status"])

    for item in itens_validados:
        pedido_repository.create_item(
            id_pedido,
            item["id_produto"],
            item["quantidade"],
            item["preco_unitario"],
            item["observacao"],
            item["subtotal"],
        )

    return _montar_pedido_completo(id_pedido)


def buscar_pedido(id_pedido: int) -> dict:
    pedido = pedido_repository.find_by_id(id_pedido)
    if not pedido:
        raise ValidationError("Pedido não encontrado.")
    return _montar_pedido_completo(id_pedido)


def listar_para_cozinha() -> list:
    pedidos = pedido_repository.list_cozinha()
    resultado = []
    for pedido in pedidos:
        itens = pedido_repository.find_itens(pedido["id_pedido"])
        pedido["itens"] = itens
        resultado.append(pedido)
    return resultado


def listar_por_cliente(id_cliente: int) -> list:
    pedidos = pedido_repository.list_por_cliente(id_cliente)
    resultado = []
    for pedido in pedidos:
        itens = pedido_repository.find_itens(pedido["id_pedido"])
        pedido["itens"] = itens
        pedido["total"] = round(sum(float(item["subtotal"]) for item in itens), 2)
        resultado.append(pedido)
    return resultado


def atualizar_status(id_pedido: int, novo_status_nome: str) -> dict:
    novo_status_nome = require_non_empty_string(novo_status_nome, "status").upper()

    pedido = pedido_repository.find_by_id(id_pedido)
    if not pedido:
        raise ValidationError("Pedido não encontrado.")

    novo_status = status_repository.find_by_nome(novo_status_nome)
    if not novo_status:
        raise ValidationError("Status informado é inválido.")

    status_atual = pedido["nome_status"]
    permitidos = TRANSICOES_VALIDAS.get(status_atual, set())
    if novo_status_nome not in permitidos:
        raise ValidationError(
            f"Não é possível mudar o status de '{status_atual}' para '{novo_status_nome}'."
        )

    pedido_repository.update_status(id_pedido, novo_status["id_status"])
    return _montar_pedido_completo(id_pedido)
