from flask import jsonify


def success(data=None, status=200, message=None):
    body = {"sucesso": True}
    if message is not None:
        body["mensagem"] = message
    if data is not None:
        body["dados"] = data
    return jsonify(body), status


def error(message, status=400, details=None):
    body = {"sucesso": False, "mensagem": message}
    if details is not None:
        body["detalhes"] = details
    return jsonify(body), status
