
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

const el = (id) => document.getElementById(id);
  let pollingId = null;

  function usuarioValido() {
    const usuario = MesaFacilAPI.getUsuario();
    return usuario && MesaFacilAPI.getToken() && (usuario.tipo_usuario === "cozinha" || usuario.tipo_usuario === "admin");
  }

  function mostrarPainel() {
    el("tela-login").classList.add("oculto");
    el("painel-cozinha").classList.remove("oculto");
    el("texto-usuario-cozinha").textContent = MesaFacilAPI.getUsuario().nome;
    carregarPedidos();
    pollingId = setInterval(carregarPedidos, INTERVALO_POLLING_MS);
  }

  function mostrarLogin() {
    el("painel-cozinha").classList.add("oculto");
    el("tela-login").classList.remove("oculto");
    if (pollingId) clearInterval(pollingId);
  }:; 


