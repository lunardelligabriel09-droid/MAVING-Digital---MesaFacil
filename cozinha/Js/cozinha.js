
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
  }

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

    function minutosDesde(dataHora) {
    const data = new Date(dataHora.replace(" ", "T"));
    return (Date.now() - data.getTime()) / 60000;
  }

    function renderizarPedidos(pedidos) {
    const container = el("quadro-pedidos");

    if (pedidos.length === 0) {
      container.innerHTML = '<div class="vazio">Nenhum pedido em andamento no momento.</div>';
      return;
    }

        container.innerHTML = "";
    pedidos.forEach((pedido) => {
      const antigo = minutosDesde(pedido.data_hora) >= MINUTOS_PARA_ALERTA;
      const div = document.createElement("div");
      div.className = `cartao-pedido status-${pedido.nome_status.toLowerCase()} ${antigo ? "pedido-antigo" : ""}`;
            const itensHtml = pedido.itens
        .map((item) => `<li>${item.quantidade}x ${item.nome_produto}</li>`)
        .join("");

      const observacoes = pedido.itens
        .filter((item) => item.observacao)
        .map((item) => `${item.nome_produto}: ${item.observacao}`)
        .join(" · ");
      const proximo = PROXIMO_STATUS[pedido.nome_status];

      div.innerHTML = `
        <div class="cartao-pedido-topo">
          <h2>Pedido #${pedido.id_pedido}</h2>
          <span class="cartao-pedido-horario">${formatarHorario(pedido.data_hora)}</span>
        </div>
        <div class="cartao-pedido-mesa">Mesa ${String(pedido.numero_mesa).padStart(2, "0")}</div>
        <div class="cartao-pedido-cliente">Cliente: ${pedido.nome_cliente}</div>
        <ul class="cartao-pedido-itens">${itensHtml}</ul>
                <ul class="cartao-pedido-itens">${itensHtml}</ul>
        ${observacoes ? `<div class="cartao-pedido-obs">Observação: ${observacoes}</div>` : ""}
        <div class="cartao-pedido-acoes">
          <button class="botao-status status-atual" disabled>${ROTULO_STATUS[pedido.nome_status]}</button>
          ${
            proximo
              ? `<button class="botao-status avancar" data-id="${pedido.id_pedido}" data-status="${proximo}">${ROTULO_ACAO[proximo]}</button>`
              : ""
          }
          ${
            pedido.nome_status !== "ENTREGUE" && pedido.nome_status !== "CANCELADO"
              ? `<button class="botao-status cancelar" data-id="${pedido.id_pedido}" data-status="CANCELADO">Cancelar</button>`
              : ""
          }
        </div>
      `;

            div.querySelectorAll("[data-status]").forEach((botao) => {
        botao.addEventListener("click", () => alterarStatus(botao.dataset.id, botao.dataset.status));
      });

      container.appendChild(div);
    });
  }

  async function alterarStatus(idPedido, novoStatus) {
    try {
      await MesaFacilAPI.put(`/api/pedidos/${idPedido}/status`, { status: novoStatus });
      carregarPedidos();
    } catch (err) {
      alert(err.message);
    }
  }

  if (usuarioValido()) {
    mostrarPainel();
  } else {
    mostrarLogin();
  }
})();