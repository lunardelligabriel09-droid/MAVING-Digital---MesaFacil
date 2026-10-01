
(() => {
  const INTERVALO_POLLING_MS = 5000;
  const MINUTOS_PARA_ALERTA = 15;

  const PROXIMO_STATUS = {
    RECEBIDO: "EM_PREPARO",
    EM_PREPARO: "PRONTO",
    PRONTO: "ENTREGUE",
  };

  const ROTULO_STATUS = {
    RECEBIDO: "Recebido",
    EM_PREPARO: "Em preparo",
    PRONTO: "Pronto",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  };

  const ROTULO_ACAO = {
    EM_PREPARO: "Iniciar preparo",
    PRONTO: "Marcar como pronto",
    ENTREGUE: "Marcar como entregue",
  };


