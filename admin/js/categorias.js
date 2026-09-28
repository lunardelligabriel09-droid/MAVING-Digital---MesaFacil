(() => {
  AdminShell.inicializar();
  const el = (id) => document.getElementById(id);
  let categorias = [];

  async function carregar() {
    try {
      const resultado = await MesaFacilAPI.get("/api/categorias");
      categorias = resultado.dados;
      renderizar();
    } catch (err) {
      el("alerta-categorias").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  function renderizar() {
    const termo = el("input-busca-categorias").value.trim().toLowerCase();
    const corpo = el("corpo-tabela-categorias");
    const lista = categorias.filter((c) => c.nome.toLowerCase().includes(termo));

    if (lista.length === 0) {
      corpo.innerHTML = '<tr><td colspan="4" class="vazio">Nenhuma categoria encontrada.</td></tr>';
      return;
    }

    corpo.innerHTML = "";
    lista.forEach((categoria) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${categoria.nome}</td>
        <td>${categoria.descricao || "—"}</td>
        <td><span class="selo ${categoria.ativo ? "selo-status-ativo" : "selo-status-inativo"}">${categoria.ativo ? "Ativa" : "Inativa"}</span></td>
        <td class="acoes-linha">
          <button class="btn btn-secundaria btn-pequeno" data-acao="editar">Editar</button>
          <button class="btn btn-pequeno ${categoria.ativo ? "btn-perigo" : "btn-primaria"}" data-acao="status">${categoria.ativo ? "Desativar" : "Ativar"}</button>
        </td>
      `;
      tr.querySelector('[data-acao="editar"]').addEventListener("click", () => abrirModal(categoria));
      tr.querySelector('[data-acao="status"]').addEventListener("click", () => alternarStatus(categoria));
      corpo.appendChild(tr);
    });
  }

  el("input-busca-categorias").addEventListener("input", renderizar);

  function abrirModal(categoria) {
    el("alerta-modal-categoria").innerHTML = "";
    el("titulo-modal-categoria").textContent = categoria ? "Editar categoria" : "Nova categoria";
    el("categoria-id").value = categoria ? categoria.id_categoria : "";
    el("categoria-nome").value = categoria ? categoria.nome : "";
    el("categoria-descricao").value = categoria ? categoria.descricao || "" : "";
    el("modal-categoria").classList.remove("oculto");
  }

  function fecharModal() {
    el("modal-categoria").classList.add("oculto");
  }

  el("btn-nova-categoria").addEventListener("click", () => abrirModal(null));
  el("btn-fechar-modal-categoria").addEventListener("click", fecharModal);
  el("btn-cancelar-categoria").addEventListener("click", fecharModal);

  el("form-categoria").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const id = el("categoria-id").value;
    const payload = {
      nome: el("categoria-nome").value.trim(),
      descricao: el("categoria-descricao").value.trim() || null,
    };

    try {
      if (id) {
        await MesaFacilAPI.put(`/api/categorias/${id}`, payload);
      } else {
        await MesaFacilAPI.post("/api/categorias", payload);
      }
      fecharModal();
      carregar();
    } catch (err) {
      el("alerta-modal-categoria").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  });

  async function alternarStatus(categoria) {
    try {
      await MesaFacilAPI.put(`/api/categorias/${categoria.id_categoria}/status`, { ativo: !categoria.ativo });
      carregar();
    } catch (err) {
      el("alerta-categorias").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  carregar();
})();

 