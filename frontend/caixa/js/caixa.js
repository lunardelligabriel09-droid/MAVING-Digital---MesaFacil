
(() => {
  const el = (id) => document.getElementById(id);
  let statusFiltro = "aberta";

  const ROTULO_STATUS = { aberta: "Aberta", fechada: "Fechada" };
  const formatarMoeda = (valor) => `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;

  function usuarioValido() {
    const usuario = MesaFacilAPI.getUsuario();
    return usuario && MesaFacilAPI.getToken() && (usuario.tipo_usuario === "caixa" || usuario.tipo_usuario === "admin");
  }

  function mostrarPainel() {
    el("tela-login").classList.add("oculto");
    el("painel-caixa").classList.remove("oculto");
    el("texto-usuario-caixa").textContent = MesaFacilAPI.getUsuario().nome;
    carregarComandas();
  }

  function mostrarLogin() {
    el("painel-caixa").classList.add("oculto");
    el("tela-login").classList.remove("oculto");
  }

  el("form-login").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const alerta = el("alerta-login");
    alerta.innerHTML = "";
    const email = el("input-email").value.trim();
    const senha = el("input-senha").value;

    try {
      const resultado = await MesaFacilAPI.post("/api/auth/login", { email, senha }, { autenticado: false });
      if (!["caixa", "admin"].includes(resultado.dados.usuario.tipo_usuario)) {
        alerta.innerHTML = '<div class="alerta alerta-erro">Esta conta não tem acesso ao caixa.</div>';
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

  document.querySelectorAll(".btn-filtro").forEach((botao) => {
    botao.addEventListener("click", () => {
      document.querySelectorAll(".btn-filtro").forEach((b) => b.classList.remove("ativo"));
      botao.classList.add("ativo");
      statusFiltro = botao.dataset.status;
      carregarComandas();
    });
  });

  async function carregarComandas() {
    const corpo = el("corpo-tabela-comandas");
    corpo.innerHTML = '<tr><td colspan="8" class="carregando">Carregando comandas…</td></tr>';
    try {
      const query = statusFiltro ? `?status=${statusFiltro}` : "";
      const resultado = await MesaFacilAPI.get(`/api/comandas${query}`);
      renderizarComandas(resultado.dados);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        mostrarLogin();
        return;
      }
      corpo.innerHTML = `<tr><td colspan="8"><div class="alerta alerta-erro">${err.message}</div></td></tr>`;
    }
  }

  function renderizarComandas(comandas) {
    const corpo = el("corpo-tabela-comandas");
    if (comandas.length === 0) {
      corpo.innerHTML = '<tr><td colspan="8" class="vazio">Nenhuma comanda encontrada.</td></tr>';
      return;
    }

    corpo.innerHTML = "";
    comandas.forEach((comanda) => {
      const tr = document.createElement("tr");
      const abertura = new Date(comanda.data_abertura.replace(" ", "T")).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      tr.innerHTML = `
        <td>#${comanda.id_comanda}</td>
        <td>${comanda.nome_cliente}</td>
        <td>Mesa ${String(comanda.numero_mesa).padStart(2, "0")}</td>
        <td>${abertura}</td>
        <td>${comanda.qtd_pedidos}</td>
        <td class="col-valor">${formatarMoeda(comanda.valor_total)}</td>
        <td><span class="selo ${comanda.status === "aberta" ? "selo-em_preparo" : "selo-entregue"}">${ROTULO_STATUS[comanda.status]}</span></td>
        <td><a class="btn btn-secundaria btn-pequeno" href="/caixa/comanda?id=${comanda.id_comanda}">Ver detalhes</a></td>
      `;
      corpo.appendChild(tr);
    });
  }

  if (usuarioValido()) {
    mostrarPainel();
  } else {
    mostrarLogin();
  }
})();
