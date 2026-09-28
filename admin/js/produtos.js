(() => {
  AdminShell.inicializar();
  const el = (id) => document.getElementById(id);
  let produtos = [];
  let categorias = [];
  const formatarMoeda = (valor) => `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;

  

  function preencherSelectCategorias() {
    const select = el("produto-categoria");
    select.innerHTML = categorias.map((c) => `<option value="${c.id_categoria}">${c.nome}</option>`).join("");
  }

  function renderizar() {
    const termo = el("input-busca-produtos").value.trim().toLowerCase();
    const corpo = el("corpo-tabela-produtos");
    const lista = produtos.filter((p) => p.nome.toLowerCase().includes(termo));

    if (lista.length === 0) {
      corpo.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum produto encontrado.</td></tr>';
      return;
    }

    corpo.innerHTML = "";
    lista.forEach((produto) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${produto.imagem ? `<img class="miniatura" src="${produto.imagem}" alt="">` : `<div class="miniatura"></div>`}</td>
        <td>${produto.nome}</td>
        <td>${produto.nome_categoria}</td>
        <td>${formatarMoeda(produto.preco)}</td>
        <td><span class="selo ${produto.ativo ? "selo-status-ativo" : "selo-status-inativo"}">${produto.ativo ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes-linha">
          <button class="btn btn-secundaria btn-pequeno" data-acao="editar">Editar</button>
          <button class="btn btn-pequeno ${produto.ativo ? "btn-perigo" : "btn-primaria"}" data-acao="status">${produto.ativo ? "Desativar" : "Ativar"}</button>
        </td>
      `;
      tr.querySelector('[data-acao="editar"]').addEventListener("click", () => abrirModal(produto));
      tr.querySelector('[data-acao="status"]').addEventListener("click", () => alternarStatus(produto));
      corpo.appendChild(tr);
    });
  }

  el("input-busca-produtos").addEventListener("input", renderizar);

  let imagemAtual = null;

  function abrirModal(produto) {
    el("alerta-modal-produto").innerHTML = "";
    el("titulo-modal-produto").textContent = produto ? "Editar produto" : "Novo produto";
    el("produto-id").value = produto ? produto.id_produto : "";
    el("produto-nome").value = produto ? produto.nome : "";
    el("produto-categoria").value = produto ? produto.id_categoria : categorias[0]?.id_categoria || "";
    el("produto-preco").value = produto ? produto.preco : "";
    el("produto-descricao").value = produto ? produto.descricao || "" : "";
    el("produto-arquivo-imagem").value = "";
    imagemAtual = produto ? produto.imagem : null;

    const preview = el("produto-preview-imagem");
    if (imagemAtual) {
      preview.src = imagemAtual;
      preview.classList.remove("oculto");
    } else {
      preview.classList.add("oculto");
    }

    el("modal-produto").classList.remove("oculto");
  }

  function fecharModal() {
    el("modal-produto").classList.add("oculto");
  }

  el("btn-novo-produto").addEventListener("click", () => abrirModal(null));
  el("btn-fechar-modal-produto").addEventListener("click", fecharModal);
  el("btn-cancelar-produto").addEventListener("click", fecharModal);

  el("produto-arquivo-imagem").addEventListener("change", () => {
    const arquivo = el("produto-arquivo-imagem").files[0];
    if (!arquivo) return;
    const preview = el("produto-preview-imagem");
    preview.src = URL.createObjectURL(arquivo);
    preview.classList.remove("oculto");
  });

  el("form-produto").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const alerta = el("alerta-modal-produto");
    alerta.innerHTML = "";
    const id = el("produto-id").value;

    try {
      let imagem = imagemAtual;
      const arquivo = el("produto-arquivo-imagem").files[0];
      if (arquivo) {
        const formData = new FormData();
        formData.append("arquivo", arquivo);
        const respostaUpload = await MesaFacilAPI.postForm("/api/produtos/imagem", formData);
        imagem = respostaUpload.dados.imagem;
      }

      const payload = {
        nome: el("produto-nome").value.trim(),
        id_categoria: Number(el("produto-categoria").value),
        preco: Number(el("produto-preco").value),
        descricao: el("produto-descricao").value.trim() || null,
        imagem,
      };

      if (id) {
        await MesaFacilAPI.put(`/api/produtos/${id}`, payload);
      } else {
        await MesaFacilAPI.post("/api/produtos", payload);
      }
      fecharModal();
      carregar();
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  });

  async function alternarStatus(produto) {
    try {
      await MesaFacilAPI.put(`/api/produtos/${produto.id_produto}/status`, { ativo: !produto.ativo });
      carregar();
    } catch (err) {
      el("alerta-produtos").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  carregar();
})();
