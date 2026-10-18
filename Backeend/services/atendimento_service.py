from models import cliente_repository, comanda_repository, mesa_repository
from utils.validators import ValidationError, require_non_empty_string


def resolver_mesa_por_token(token: str) -> dict:
    mesa = mesa_repository.find_by_token(token)
    if not mesa:
        raise ValidationError("QR Code inválido. Procure um atendente.", details={"codigo": "MESA_NAO_ENCONTRADA"})
    if mesa["status"] != "ativa":
        raise ValidationError("Esta mesa está indisponível no momento.", details={"codigo": "MESA_INATIVA"})
    return mesa


def iniciar_atendimento(token: str, nome_cliente: str) -> dict:
    """Identifica a mesa pelo QR Code, cria/recupera o cliente e a comanda aberta."""
    nome_cliente = require_non_empty_string(nome_cliente, "nome", max_length=120)
    mesa = resolver_mesa_por_token(token)

    cliente = cliente_repository.find_by_nome_exato(nome_cliente)
    if not cliente:
        id_cliente = cliente_repository.create(nome_cliente)
        cliente = cliente_repository.find_by_id(id_cliente)

    comanda = comanda_repository.find_aberta_por_cliente_mesa(cliente["id_cliente"], mesa["id_mesa"])
    if not comanda:
        id_comanda = comanda_repository.create(cliente["id_cliente"], mesa["id_mesa"])
        comanda = comanda_repository.find_by_id(id_comanda)
    else:
        comanda = comanda_repository.find_by_id(comanda["id_comanda"])

    return {"mesa": mesa, "cliente": cliente, "comanda": comanda}


def retomar_comanda(id_comanda: int, token: str) -> dict:
    """Revalida uma sessão de cliente já existente (ex.: após recarregar a página)."""
    mesa = resolver_mesa_por_token(token)
    comanda = comanda_repository.find_by_id(id_comanda)
    if not comanda or comanda["id_mesa"] != mesa["id_mesa"] or comanda["status"] != "aberta":
        raise ValidationError("Sessão expirada. Escaneie o QR Code novamente.", details={"codigo": "SESSAO_INVALIDA"})
    cliente = cliente_repository.find_by_id(comanda["id_cliente"])
    return {"mesa": mesa, "cliente": cliente, "comanda": comanda}
