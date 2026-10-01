
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

      el("form-login").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const alerta = el("alerta-login");
    alerta.innerHTML = "";
    const email = el("input-email").value.trim();
    const senha = el("input-senha").value;

     try {
      const resultado = await MesaFacilAPI.post("/api/auth/login", { email, senha }, { autenticado: false });
      if (!["cozinha", "admin"].includes(resultado.dados.usuario.tipo_usuario)) {
        alerta.innerHTML = '<div class="alerta alerta-erro">Esta conta não tem acesso à cozinha.</div>';
        return;
      }
      MesaFacilAPI.setSessao(resultado.dados.token, resultado.dados.usuario);
      mostrarPainel();
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  });

    el("btn-sair").addEventListener("click", () => {
    MesaFacilAPI.limparSessao();
    mostrarLogin();
  });

  async function carregarPedidos() {
    try {
      const resultado = await MesaFacilAPI.get("/api/pedidos/cozinha");
      renderizarPedidos(resultado.dados);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        mostrarLogin();
        return;
      }
      el("quadro-pedidos").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  function formatarHorario(dataHora) {
    const data = new Date(dataHora.replace(" ", "T"));
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
