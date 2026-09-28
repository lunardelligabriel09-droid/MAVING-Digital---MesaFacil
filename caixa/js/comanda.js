
(() => {
  const el = (id) => document.getElementById(id);
  const idComanda = new URLSearchParams(window.location.search).get("id");
  const formatarMoeda = (valor) => `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;

  const ROTULO_STATUS_PEDIDO = {
    RECEBIDO: "Recebido",
    EM_PREPARO: "Em preparo",
    PRONTO: "Pronto",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  };

  function usuarioValido() {
    const usuario = MesaFacilAPI.getUsuario();
    return usuario && MesaFacilAPI.getToken() && (usuario.tipo_usuario === "caixa" || usuario.tipo_usuario === "admin");
  }

  if (!usuarioValido()) {
    el("painel-comanda").classList.add("oculto");
    el("tela-login").classList.remove("oculto");
    return;
  }

  el("tela-login").classList.add("oculto");
  el("painel-comanda").classList.remove("oculto");

  let comandaAtual = null;

  async function carregar() {
    try {
      const resultado = await MesaFacilAPI.get(`/api/comandas/${idComanda}`);
      comandaAtual = resultado.dados;
      renderizar(comandaAtual);
    } catch (err) {
      el("alerta-comanda").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  function renderizar(comanda) {
    el("titulo-comanda").textContent = `Comanda #${comanda.id_comanda}`;
    el("info-cliente").textContent = comanda.nome_cliente;
    el("info-mesa").textContent = `Mesa ${String(comanda.numero_mesa).padStart(2, "0")}`;
    el("info-abertura").textContent = new Date(comanda.data_abertura.replace(" ", "T")).toLocaleString("pt-BR");
    el("info-status").textContent = comanda.status === "aberta" ? "Aberta" : "Fechada";
    el("info-total").textContent = formatarMoeda(comanda.valor_total);

    const container = el("lista-pedidos-comanda");
    container.innerHTML = "";

    comanda.pedidos.forEach((pedido) => {
      const div = document.createElement("div");
      div.className = "pedido-comanda";
      const linhasItens = pedido.itens
        .map(
          (item) => `
        <tr>
          <td>${item.quantidade}x ${item.nome_produto}${item.observacao ? `<div class="obs-item-pedido">"${item.observacao}"</div>` : ""}</td>
          <td class="col-valor">${formatarMoeda(item.subtotal)}</td>
        </tr>`
        )
        .join("");

      div.innerHTML = `
        <div class="pedido-comanda-topo">
          <strong>Pedido #${pedido.id_pedido}</strong>
          <span class="selo selo-${pedido.nome_status.toLowerCase()}">${ROTULO_STATUS_PEDIDO[pedido.nome_status]}</span>
        </div>
        <table class="tabela-itens-pedido">
          <tbody>${linhasItens}</tbody>
        </table>
      `;
      container.appendChild(div);
    });

    if (comanda.status === "fechada") {
      el("btn-fechar-comanda").disabled = true;
      el("btn-fechar-comanda").textContent = "Comanda já fechada";
    }

    montarResumoImpressao(comanda);
  }

  function montarResumoImpressao(comanda) {
    const linhas = [];
    comanda.pedidos.forEach((pedido) => {
      pedido.itens.forEach((item) => {
        linhas.push(`
          <tr>
            <td>${item.quantidade}x ${item.nome_produto}</td>
            <td class="col-valor">${formatarMoeda(item.subtotal)}</td>
          </tr>
          ${item.observacao ? `<tr><td colspan="2" class="observacao">Obs.: ${item.observacao}</td></tr>` : ""}
        `);
      });
    });
    el("resumo-impressao").innerHTML = `
      <h1>Trattoria Famiglia Rossi</h1>
      <div class="subtitulo">MesaFácil — Resumo da Comanda</div>
      <div class="linha"></div>
      <div>Comanda: #${comanda.id_comanda}</div>
      <div>Cliente: ${comanda.nome_cliente}</div>
      <div>Mesa: ${String(comanda.numero_mesa).padStart(2, "0")}</div>
      <div>Data/Hora: ${new Date().toLocaleString("pt-BR")}</div>
      <div class="linha"></div>
      <table>${linhas.join("")}</table>
      <div class="linha"></div>
      <div class="total"><span>TOTAL</span><span>${formatarMoeda(comanda.valor_total)}</span></div>
    `;
  }

  el("btn-imprimir").addEventListener("click", () => window.print());

  el("btn-fechar-comanda").addEventListener("click", async () => {
    if (!confirm("Confirmar o fechamento desta comanda? Esta ação não pode ser desfeita.")) return;
    try {
      await MesaFacilAPI.put(`/api/comandas/${idComanda}/fechar`);
      await carregar();
      el("alerta-comanda").innerHTML = '<div class="alerta alerta-sucesso">Comanda fechada com sucesso.</div>';
    } catch (err) {
      el("alerta-comanda").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  });

  carregar();
})();

