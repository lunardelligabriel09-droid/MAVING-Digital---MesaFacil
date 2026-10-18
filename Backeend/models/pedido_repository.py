from db.connection import get_cursor


def create(id_comanda: int, id_status: int):
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO pedido (id_comanda, id_status) VALUES (%s, %s)",
            (id_comanda, id_status),
        )
        return cursor.lastrowid


def create_item(id_pedido: int, id_produto: int, quantidade: int, preco_unitario: float,
                 observacao, subtotal: float):
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario, "
            "observacao, subtotal) VALUES (%s, %s, %s, %s, %s, %s)",
            (id_pedido, id_produto, quantidade, preco_unitario, observacao, subtotal),
        )
        return cursor.lastrowid


def find_by_id(id_pedido: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT pe.*, sp.nome AS nome_status, sp.ordem AS ordem_status, "
            "co.id_mesa, co.id_cliente, m.numero AS numero_mesa, cl.nome AS nome_cliente "
            "FROM pedido pe "
            "JOIN status_pedido sp ON sp.id_status = pe.id_status "
            "JOIN comanda co ON co.id_comanda = pe.id_comanda "
            "JOIN mesa m ON m.id_mesa = co.id_mesa "
            "JOIN cliente cl ON cl.id_cliente = co.id_cliente "
            "WHERE pe.id_pedido = %s",
            (id_pedido,),
        )
        return cursor.fetchone()


def find_itens(id_pedido: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT ip.*, p.nome AS nome_produto "
            "FROM item_pedido ip "
            "JOIN produto p ON p.id_produto = ip.id_produto "
            "WHERE ip.id_pedido = %s",
            (id_pedido,),
        )
        return cursor.fetchall()


def list_por_comanda(id_comanda: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT pe.*, sp.nome AS nome_status, sp.ordem AS ordem_status "
            "FROM pedido pe "
            "JOIN status_pedido sp ON sp.id_status = pe.id_status "
            "WHERE pe.id_comanda = %s ORDER BY pe.data_hora",
            (id_comanda,),
        )
        return cursor.fetchall()


def list_cozinha():
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT pe.*, sp.nome AS nome_status, sp.ordem AS ordem_status, "
            "co.id_mesa, m.numero AS numero_mesa, cl.nome AS nome_cliente "
            "FROM pedido pe "
            "JOIN status_pedido sp ON sp.id_status = pe.id_status "
            "JOIN comanda co ON co.id_comanda = pe.id_comanda "
            "JOIN mesa m ON m.id_mesa = co.id_mesa "
            "JOIN cliente cl ON cl.id_cliente = co.id_cliente "
            "WHERE sp.nome IN ('RECEBIDO', 'EM_PREPARO', 'PRONTO') "
            "ORDER BY pe.data_hora ASC",
        )
        return cursor.fetchall()


def list_por_cliente(id_cliente: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT pe.*, sp.nome AS nome_status, sp.ordem AS ordem_status, "
            "co.id_mesa, m.numero AS numero_mesa, co.id_comanda "
            "FROM pedido pe "
            "JOIN status_pedido sp ON sp.id_status = pe.id_status "
            "JOIN comanda co ON co.id_comanda = pe.id_comanda "
            "JOIN mesa m ON m.id_mesa = co.id_mesa "
            "WHERE co.id_cliente = %s "
            "ORDER BY pe.data_hora DESC",
            (id_cliente,),
        )
        return cursor.fetchall()


def update_status(id_pedido: int, id_status: int):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE pedido SET id_status = %s WHERE id_pedido = %s",
            (id_status, id_pedido),
        )
        return cursor.rowcount
