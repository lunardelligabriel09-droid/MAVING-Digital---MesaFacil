(() => {
  AdminShell.inicializar();
  const el = (id) => document.getElementById(id);
  let mesas = [];
  let mesaSelecionada = null;
  let urlObjetoAtual = null;

  async function carregar() {
    try {
      const resultado = await MesaFacilAPI.get("/api/mesas");
      mesas = resultado.dados;
      renderizar();
    } catch (err) {
      el("alerta-mesas").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  function renderizar() {
    const corpo = el("corpo-tabela-mesas");
    if (mesas.length === 0) {
      corpo.innerHTML = '<tr><td colspan="3" class="vazio">Nenhuma mesa cadastrada.</td></tr>';
      return;
    }

    corpo.innerHTML = "";
    mesas.forEach((mesa) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>Mesa ${String(mesa.numero).padStart(2, "0")}</td>
        <td><span class="selo ${mesa.status === "ativa" ? "selo-status-ativo" : "selo-status-inativo"}">${mesa.status === "ativa" ? "Ativa" : "Inativa"}</span></td>
        <td class="acoes-linha">
          <button class="btn btn-secundaria btn-pequeno" data-acao="qrcode">Ver QR Code</button>
          <button class="btn btn-pequeno ${mesa.status === "ativa" ? "btn-perigo" : "btn-primaria"}" data-acao="status">${mesa.status === "ativa" ? "Desativar" : "Ativar"}</button>
        </td>
      `;
      tr.querySelector('[data-acao="qrcode"]').addEventListener("click", () => abrirQrCode(mesa));
      tr.querySelector('[data-acao="status"]').addEventListener("click", () => alternarStatus(mesa));
      corpo.appendChild(tr);
    });
  }

  el("btn-nova-mesa").addEventListener("click", () => {
    el("alerta-modal-mesa").innerHTML = "";
    el("mesa-numero").value = "";
    el("modal-mesa").classList.remove("oculto");
  });
  el("btn-fechar-modal-mesa").addEventListener("click", () => el("modal-mesa").classList.add("oculto"));
  el("btn-cancelar-mesa").addEventListener("click", () => el("modal-mesa").classList.add("oculto"));

  el("form-mesa").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const alerta = el("alerta-modal-mesa");
    alerta.innerHTML = "";
    try {
      await MesaFacilAPI.post("/api/mesas", { numero: Number(el("mesa-numero").value) });
      el("modal-mesa").classList.add("oculto");
      carregar();
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  });

  async function alternarStatus(mesa) {
    try {
      await MesaFacilAPI.put(`/api/mesas/${mesa.id_mesa}/status`, { status: mesa.status === "ativa" ? "inativa" : "ativa" });
      carregar();
    } catch (err) {
      el("alerta-mesas").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  async function carregarImagemQrCode(mesa) {
    const resposta = await fetch(`/api/mesas/${mesa.id_mesa}/qrcode`, {
      headers: { Authorization: `Bearer ${MesaFacilAPI.getToken()}` },
    });
    if (!resposta.ok) throw new Error("Não foi possível carregar o QR Code.");
    const blob = await resposta.blob();
    if (urlObjetoAtual) URL.revokeObjectURL(urlObjetoAtual);
    urlObjetoAtual = URL.createObjectURL(blob);
    el("imagem-qrcode").src = urlObjetoAtual;
  }

  async function abrirQrCode(mesa) {
    mesaSelecionada = mesa;
    el("titulo-modal-qrcode").textContent = `QR Code — Mesa ${String(mesa.numero).padStart(2, "0")}`;
    el("url-qrcode").textContent = `${window.location.origin}/mesa/${mesa.identificador_qr}`;
    el("modal-qrcode").classList.remove("oculto");
    try {
      await carregarImagemQrCode(mesa);
    } catch (err) {
      el("alerta-mesas").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  el("btn-fechar-modal-qrcode").addEventListener("click", () => el("modal-qrcode").classList.add("oculto"));
  el("btn-imprimir-qrcode").addEventListener("click", () => window.print());

  el("btn-regenerar-qrcode").addEventListener("click", async () => {
    if (!mesaSelecionada) return;
    if (!confirm("Gerar um novo QR Code invalidará o código impresso atual desta mesa. Continuar?")) return;
    try {
      const resultado = await MesaFacilAPI.post(`/api/mesas/${mesaSelecionada.id_mesa}/regenerar-qrcode`);
      mesaSelecionada = resultado.dados;
      mesas = mesas.map((m) => (m.id_mesa === mesaSelecionada.id_mesa ? mesaSelecionada : m));
      el("url-qrcode").textContent = `${window.location.origin}/mesa/${mesaSelecionada.identificador_qr}`;
      await carregarImagemQrCode(mesaSelecionada);
    } catch (err) {
      el("alerta-modal-mesa").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  });

  carregar();
})();
