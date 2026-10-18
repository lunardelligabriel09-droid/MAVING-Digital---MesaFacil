from models import comanda_repository, pedido_repository
from utils.validators import ValidationError


def listar(status=None) -> list:
    if status and status not in ("aberta", "fechada"):
        raise ValidationError("Status de comanda inválido. Use 'aberta' ou 'fechada'.")
    return comanda_repository.list_all(status)


def buscar_detalhe(id_comanda: int) -> dict:
    comanda = comanda_repository.find_by_id(id_comanda)
    if not comanda:
        raise ValidationError("Comanda não encontrada.")

    pedidos = pedido_repository.list_por_comanda(id_comanda)
    total = 0.0
    for pedido in pedidos:
        itens = pedido_repository.find_itens(pedido["id_pedido"])
        pedido["itens"] = itens
        subtotal_pedido = sum(float(item["subtotal"]) for item in itens)
        pedido["total"] = round(subtotal_pedido, 2)
        if pedido["nome_status"] != "CANCELADO":
            total += subtotal_pedido

    comanda["pedidos"] = pedidos
    comanda["valor_total"] = round(total, 2)
    return comanda


def fechar(id_comanda: int) -> dict:
    comanda = comanda_repository.find_by_id(id_comanda)
    if not comanda:
        raise ValidationError("Comanda não encontrada.")
    if comanda["status"] == "fechada":
        raise ValidationError("Esta comanda já está fechada.")

    pendentes = comanda_repository.count_pedidos_pendentes(id_comanda)
    if pendentes > 0:
        raise ValidationError(
            "Existem pedidos não finalizados nesta comanda (aguardando preparo ou entrega).",
            details={"pedidos_pendentes": pendentes},
        )

    comanda_repository.fechar(id_comanda)
    return buscar_detalhe(id_comanda)
