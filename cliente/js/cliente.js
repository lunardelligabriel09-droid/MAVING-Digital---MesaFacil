
(() => {
  const token = window.location.pathname.split("/mesa/")[1];
  const CHAVE_SESSAO = `mesafacil_sessao_${token}`;
  const INTERVALO_POLLING_MS = 6000;

  let sessao = null; // { mesa, cliente, comanda }
  let categorias = [];
  let produtos = [];
  let categoriaAtiva = "todas";
  let carrinho = []; // { id_produto, nome_produto, preco_unitario, quantidade, observacao }
  let pollingId = null;

  const STATUS_LABEL = {
    RECEBIDO: "Pedido recebido",
    EM_PREPARO: "Em preparo",
    PRONTO: "Pronto",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  };

  const STATUS_MENSAGEM = {
    RECEBIDO: "Seu pedido foi recebido pela cozinha.",
    EM_PREPARO: "Seu pedido está sendo preparado.",
    PRONTO: "Seu pedido está pronto!",
    ENTREGUE: "Pedido entregue. Bom apetite!",
    CANCELADO: "Este pedido foi cancelado.",
  };

  const el = (id) => document.getElementById(id);
  const formatarMoeda = (valor) => `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;

  function mostrarTela(idTela) {
    ["tela-carregando", "tela-erro", "tela-identificacao", "app-cliente"].forEach((id) => {
      el(id).classList.toggle("oculto", id !== idTela);
    });
  }

  // -----------------------------------------------------------------
  // identificação da mesa
  // -----------------------------------------------------------------
  async function iniciar() {
    if (!token) {
      exibirErro("QR Code inválido. Escaneie novamente o código na sua mesa.");
      return;
    }

    const sessaoSalva = sessionStorage.getItem(CHAVE_SESSAO);
    if (sessaoSalva) {
      try {
        const dados = JSON.parse(sessaoSalva);
        const resultado = await MesaFacilAPI.post(
          "/api/atendimento/retomar",
          { token, id_comanda: dados.comanda.id_comanda },
          { autenticado: false }
        );
        sessao = resultado.dados;
        salvarSessao();
        iniciarApp();
        return;
      } catch (err) {
        sessionStorage.removeItem(CHAVE_SESSAO);
      }
    }

    try {
      const resultado = await MesaFacilAPI.get(`/api/atendimento/mesa/${token}`, { autenticado: false });
      el("selo-mesa-identificacao").textContent = `Mesa ${String(resultado.dados.numero).padStart(2, "0")}`;
      mostrarTela("tela-identificacao");
    } catch (err) {
      exibirErro(err.message);
    }
  }

  function exibirErro(mensagem) {
    el("texto-erro").textContent = mensagem;
    mostrarTela("tela-erro");
  }

  function salvarSessao() {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  }

  el("form-identificacao").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const nome = el("input-nome").value.trim();
    const alerta = el("alerta-identificacao");
    alerta.innerHTML = "";

    if (!nome) return;

    const botao = evento.target.querySelector("button");
    botao.disabled = true;
    botao.textContent = "Entrando…";

    try {
      const resultado = await MesaFacilAPI.post("/api/atendimento/iniciar", { token, nome }, { autenticado: false });
      sessao = resultado.dados;
      salvarSessao();
      iniciarApp();
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
      botao.disabled = false;
      botao.textContent = "Ver cardápio";
    }
  });

  // -----------------------------------------------------------------
  // Parte principal
  // -----------------------------------------------------------------
  function iniciarApp() {
    el("texto-mesa").textContent = `Mesa ${String(sessao.mesa.numero).padStart(2, "0")}`;
    el("texto-cliente").textContent = sessao.cliente.nome;
    mostrarTela("app-cliente");
    carregarCardapio();
    ativarNavegacao();
  }

  function ativarNavegacao() {
    document.querySelectorAll(".nav-item").forEach((botao) => {
      botao.addEventListener("click", () => trocarAba(botao.dataset.aba));
    });
  }

  function trocarAba(aba) {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("ativo", b.dataset.aba === aba));
    document.querySelectorAll(".aba").forEach((secao) => secao.classList.add("oculto"));
    el(`aba-${aba}`).classList.remove("oculto");

    if (aba === "pedidos") {
      carregarPedidosCliente();
      iniciarPolling();
    } else {
      pararPolling();
    }
  }

  // -----------------------------------------------------------------
  // Cardápio
  // -----------------------------------------------------------------
  async function carregarCardapio() {
    try {
      const [resCategorias, resProdutos] = await Promise.all([
        MesaFacilAPI.get("/api/categorias?ativas=1", { autenticado: false }),
        MesaFacilAPI.get("/api/produtos?ativos=1", { autenticado: false }),
      ]);
      categorias = resCategorias.dados;
      produtos = resProdutos.dados;
      renderizarCategorias();
      renderizarProdutos();
    } catch (err) {
      el("lista-produtos").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  function renderizarCategorias() {
    const nav = el("lista-categorias");
    nav.innerHTML = "";
    const btnTodas = document.createElement("button");
    btnTodas.textContent = "Todas";
    btnTodas.className = categoriaAtiva === "todas" ? "ativa" : "";
    btnTodas.addEventListener("click", () => {
      categoriaAtiva = "todas";
      renderizarCategorias();
      renderizarProdutos();
    });
    nav.appendChild(btnTodas);

    categorias.forEach((categoria) => {
      const btn = document.createElement("button");
      btn.textContent = categoria.nome;
      btn.className = categoriaAtiva === categoria.id_categoria ? "ativa" : "";
      btn.addEventListener("click", () => {
        categoriaAtiva = categoria.id_categoria;
        renderizarCategorias();
        renderizarProdutos();
      });
      nav.appendChild(btn);
    });
  }

  function renderizarProdutos() {
    const termoBusca = el("input-busca").value.trim().toLowerCase();
    const container = el("lista-produtos");
    container.innerHTML = "";

    const categoriasParaExibir = categoriaAtiva === "todas" ? categorias : categorias.filter((c) => c.id_categoria === categoriaAtiva);

    let algumProduto = false;

    categoriasParaExibir.forEach((categoria) => {
      const produtosDaCategoria = produtos.filter(
        (p) => p.id_categoria === categoria.id_categoria && (!termoBusca || p.nome.toLowerCase().includes(termoBusca))
      );
      if (produtosDaCategoria.length === 0) return;
      algumProduto = true;

      const grupo = document.createElement("div");
      grupo.className = "grupo-categoria";
      grupo.innerHTML = `<h3>${categoria.nome}</h3>`;

      produtosDaCategoria.forEach((produto) => {
        grupo.appendChild(criarCartaoProduto(produto));
      });

      container.appendChild(grupo);
    });

    if (!algumProduto) {
      container.innerHTML = '<div class="vazio">Nenhum produto encontrado.</div>';
    }
  }

  function criarCartaoProduto(produto) {
    const div = document.createElement("div");
    div.className = "item-produto";
    div.innerHTML = `
      ${
        produto.imagem
          ? `<img class="item-produto-imagem" src="${produto.imagem}" alt="${produto.nome}" />`
          : `<div class="item-produto-imagem-vazia">🍽</div>`
      }
      <div class="item-produto-info">
        <h4>${produto.nome}</h4>
        <p>${produto.descricao || ""}</p>
        <span class="item-produto-preco">${formatarMoeda(produto.preco)}</span>
      </div>
    `;
    div.addEventListener("click", () => abrirModalProduto(produto));
    return div;
  }

  
  function abrirModalProduto(produto) {
    let quantidade = 1;
    const corpo = el("modal-produto-corpo");
    corpo.innerHTML = `
      ${
        produto.imagem
          ? `<img class="modal-produto-imagem" src="${produto.imagem}" alt="${produto.nome}" />`
          : ""
      }
      <h3>${produto.nome}</h3>
      <p>${produto.descricao || ""}</p>
      <div class="modal-produto-preco">${formatarMoeda(produto.preco)}</div>
      <div class="seletor-quantidade">
        <button type="button" id="btn-menos">−</button>
        <span id="texto-quantidade">1</span>
        <button type="button" id="btn-mais">+</button>
      </div>
      <div class="campo">
        <label for="input-observacao">Observações (opcional)</label>
        <textarea id="input-observacao" maxlength="255" placeholder="Ex.: sem cebola, ponto da carne, etc."></textarea>
      </div>
      <button class="btn btn-primaria btn-bloco" id="btn-adicionar-carrinho">Adicionar ao pedido</button>
    `;

    corpo.querySelector("#btn-menos").addEventListener("click", () => {
      if (quantidade > 1) quantidade -= 1;
      corpo.querySelector("#texto-quantidade").textContent = quantidade;
    });
    corpo.querySelector("#btn-mais").addEventListener("click", () => {
      quantidade += 1;
      corpo.querySelector("#texto-quantidade").textContent = quantidade;
    });
    corpo.querySelector("#btn-adicionar-carrinho").addEventListener("click", () => {
      const observacao = corpo.querySelector("#input-observacao").value.trim();
      adicionarAoCarrinho(produto, quantidade, observacao);
      fecharModal();
    });

    el("modal-produto").classList.remove("oculto");
  }

  function fecharModal() {
    el("modal-produto").classList.add("oculto");
  }

  el("btn-fechar-modal").addEventListener("click", fecharModal);
  el("modal-produto").addEventListener("click", (evento) => {
    if (evento.target.id === "modal-produto") fecharModal();
  });

  el("input-busca").addEventListener("input", renderizarProdutos);

  // -----------------------------------------------------------------
  // Carrinho
  // -----------------------------------------------------------------
  function adicionarAoCarrinho(produto, quantidade, observacao) {
    carrinho.push({
      id_produto: produto.id_produto,
      nome_produto: produto.nome,
      preco_unitario: Number(produto.preco),
      quantidade,
      observacao: observacao || null,
    });
    renderizarCarrinho();
  }

  function renderizarCarrinho() {
    const container = el("itens-carrinho");
    const vazio = el("carrinho-vazio");
    const contador = el("contador-carrinho");
    const botaoEnviar = el("btn-enviar-pedido");

    container.innerHTML = "";

    if (carrinho.length === 0) {
      vazio.classList.remove("oculto");
      botaoEnviar.disabled = true;
      contador.classList.add("oculto");
      el("texto-total-carrinho").textContent = formatarMoeda(0);
      return;
    }

    vazio.classList.add("oculto");
    botaoEnviar.disabled = false;
    contador.classList.remove("oculto");
    contador.textContent = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

    let total = 0;
    carrinho.forEach((item, indice) => {
      const subtotal = item.preco_unitario * item.quantidade;
      total += subtotal;

      const div = document.createElement("div");
      div.className = "item-carrinho";
      div.innerHTML = `
        <div class="item-carrinho-info">
          <strong>${item.quantidade}x ${item.nome_produto}</strong>
          ${item.observacao ? `<div class="item-carrinho-obs">"${item.observacao}"</div>` : ""}
          <div class="item-carrinho-controles">
            <button type="button" data-acao="menos">−</button>
            <span>${item.quantidade}</span>
            <button type="button" data-acao="mais">+</button>
            <button type="button" data-acao="remover">Remover</button>
          </div>
        </div>
        <div class="item-carrinho-preco">${formatarMoeda(subtotal)}</div>
      `;

      div.querySelector('[data-acao="menos"]').addEventListener("click", () => {
        if (item.quantidade > 1) {
          item.quantidade -= 1;
        } else {
          carrinho.splice(indice, 1);
        }
        renderizarCarrinho();
      });
      div.querySelector('[data-acao="mais"]').addEventListener("click", () => {
        item.quantidade += 1;
        renderizarCarrinho();
      });
      div.querySelector('[data-acao="remover"]').addEventListener("click", () => {
        carrinho.splice(indice, 1);
        renderizarCarrinho();
      });

      container.appendChild(div);
    });

    el("texto-total-carrinho").textContent = formatarMoeda(total);
  }

  async (cariinho) => {
    div.queySelection
  }

  el("btn-enviar-pedido").addEventListener("click", async () => {
    const botao = el("btn-enviar-pedido");
    const alerta = el("alerta-carrinho");
    alerta.innerHTML = "";
    botao.disabled = true;
    botao.textContent = "Enviando…";

    try {
      const itens = carrinho.map((item) => ({
        id_produto: item.id_produto,
        quantidade: item.quantidade,
        observacao: item.observacao,
      }));
      await MesaFacilAPI.post("/api/pedidos", { id_comanda: sessao.comanda.id_comanda, itens }, { autenticado: false });
      carrinho = [];
      renderizarCarrinho();
      alerta.innerHTML = '<div class="alerta alerta-sucesso">Pedido enviado com sucesso! Acompanhe o status na aba "Meus Pedidos".</div>';
      trocarAba("pedidos");
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    } finally {
      botao.disabled = false;
      botao.textContent = "Enviar pedido";
    }
  });
 // -----------------------------------------------------------------
  // Observações
  // -----------------------------------------------------------------
  async function carregarPedidosCliente() {
    try {
      const resultado = await MesaFacilAPI.get(`/api/pedidos/cliente/${sessao.cliente.id_cliente}`, { autenticado: false });
      const pedidosDaComanda = resultado.dados.filter((p) => p.id_comanda === sessao.comanda.id_comanda);
      renderizarPedidosCliente(pedidosDaComanda);
    } catch (err) {
      el("lista-pedidos-cliente").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  function renderizarPedidosCliente(pedidos) {
    const container = el("lista-pedidos-cliente");
    if (pedidos.length === 0) {
      container.innerHTML = '<div class="vazio">Você ainda não fez nenhum pedido nesta visita.</div>';
      return;
    }

    container.innerHTML = "";
    pedidos.forEach((pedido) => {
      const div = document.createElement("div");
      div.className = "cartao-pedido-cliente";
      const itensHtml = pedido.itens.map((item) => `<li>${item.quantidade}x ${item.nome_produto}</li>`).join("");
      const statusClasse = `selo-${pedido.nome_status.toLowerCase()}`;
      div.innerHTML = `
        <div class="cartao-pedido-cliente-topo">
          <strong>Pedido #${pedido.id_pedido}</strong>
          <span class="selo ${statusClasse}">${STATUS_LABEL[pedido.nome_status] || pedido.nome_status}</span>
        </div>
        <ul>${itensHtml}</ul>
        <div class="mensagem-status">${STATUS_MENSAGEM[pedido.nome_status] || ""}</div>
      `;
      container.appendChild(div);
    });
  }

  function iniciarPolling() {
    pararPolling();
    pollingId = setInterval(carregarPedidosCliente, INTERVALO_POLLING_MS);
  }

  function pararPolling() {
    if (pollingId) {
      clearInterval(pollingId);
      pollingId = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pararPolling();
    } else if (!el("aba-pedidos").classList.contains("oculto")) {
      iniciarPolling();
    }
  });

  iniciar();
})()
