from db.connection import get_cursor


def find_aberta_por_cliente_mesa(id_cliente: int, id_mesa: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM comanda WHERE id_cliente = %s AND id_mesa = %s AND status = 'aberta' "
            "ORDER BY data_abertura DESC LIMIT 1",
            (id_cliente, id_mesa),
        )
        return cursor.fetchone()


def create(id_cliente: int, id_mesa: int):
    with get_cursor() as cursor:
        cursor.execute(
            "INSERT INTO comanda (id_cliente, id_mesa, status) VALUES (%s, %s, 'aberta')",
            (id_cliente, id_mesa),
        )
        return cursor.lastrowid


def find_by_id(id_comanda: int):
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT co.*, cl.nome AS nome_cliente, m.numero AS numero_mesa "
            "FROM comanda co "
            "JOIN cliente cl ON cl.id_cliente = co.id_cliente "
            "JOIN mesa m ON m.id_mesa = co.id_mesa "
            "WHERE co.id_comanda = %s",
            (id_comanda,),
        )
        return cursor.fetchone()


def list_all(status=None):
    query = (
        "SELECT co.*, cl.nome AS nome_cliente, m.numero AS numero_mesa, "
        "(SELECT COUNT(*) FROM pedido pe WHERE pe.id_comanda = co.id_comanda) AS qtd_pedidos, "
        "COALESCE((SELECT SUM(ip.subtotal) FROM pedido pe "
        "  JOIN item_pedido ip ON ip.id_pedido = pe.id_pedido "
        "  WHERE pe.id_comanda = co.id_comanda AND pe.id_status <> "
        "  (SELECT id_status FROM status_pedido WHERE nome = 'CANCELADO')), 0) AS valor_total "
        "FROM comanda co "
        "JOIN cliente cl ON cl.id_cliente = co.id_cliente "
        "JOIN mesa m ON m.id_mesa = co.id_mesa "
    )
    params = []
    if status:
        query += " WHERE co.status = %s"
        params.append(status)
    query += " ORDER BY co.data_abertura DESC"

    with get_cursor() as cursor:
        cursor.execute(query, tuple(params))
        return cursor.fetchall()


def fechar(id_comanda: int):
    with get_cursor() as cursor:
        cursor.execute(
            "UPDATE comanda SET status = 'fechada', data_fechamento = NOW() WHERE id_comanda = %s",
            (id_comanda,),
        )
        return cursor.rowcount


def count_pedidos_pendentes(id_comanda: int) -> int:
    with get_cursor() as cursor:
        cursor.execute(
            "SELECT COUNT(*) AS total FROM pedido pe "
            "JOIN status_pedido sp ON sp.id_status = pe.id_status "
            "WHERE pe.id_comanda = %s AND sp.nome IN ('RECEBIDO', 'EM_PREPARO', 'PRONTO')",
            (id_comanda,),
        )
        row = cursor.fetchone()
        return row["total"] if row else 0
