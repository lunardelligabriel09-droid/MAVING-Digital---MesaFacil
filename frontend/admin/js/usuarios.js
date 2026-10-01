(() => {
  AdminShell.inicializar();
  const el = (id) => document.getElementById(id);
  let usuarios = [];

  const ROTULO_PERFIL = { admin: "Administrador", caixa: "Caixa", cozinha: "Cozinha" };

  async function carregar() {
    try {
      const resultado = await MesaFacilAPI.get("/api/usuarios");
      usuarios = resultado.dados;
      renderizar();
    } catch (err) {
      el("alerta-usuarios").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  function renderizar() {
    const corpo = el("corpo-tabela-usuarios");
    if (usuarios.length === 0) {
      corpo.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    corpo.innerHTML = "";
    usuarios.forEach((usuario) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${usuario.nome}</td>
        <td>${usuario.email}</td>
        <td>${ROTULO_PERFIL[usuario.tipo_usuario] || usuario.tipo_usuario}</td>
        <td><span class="selo ${usuario.ativo ? "selo-status-ativo" : "selo-status-inativo"}">${usuario.ativo ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes-linha">
          <button class="btn btn-secundaria btn-pequeno" data-acao="editar">Editar</button>
          <button class="btn btn-pequeno ${usuario.ativo ? "btn-perigo" : "btn-primaria"}" data-acao="status">${usuario.ativo ? "Desativar" : "Ativar"}</button>
        </td>
      `;
      tr.querySelector('[data-acao="editar"]').addEventListener("click", () => abrirModal(usuario));
      tr.querySelector('[data-acao="status"]').addEventListener("click", () => alternarStatus(usuario));
      corpo.appendChild(tr);
    });
  }

  function abrirModal(usuario) {
    el("alerta-modal-usuario").innerHTML = "";
    el("titulo-modal-usuario").textContent = usuario ? "Editar usuário" : "Novo usuário";
    el("usuario-id").value = usuario ? usuario.id_usuario : "";
    el("usuario-nome").value = usuario ? usuario.nome : "";
    el("usuario-email").value = usuario ? usuario.email : "";
    el("usuario-perfil").value = usuario ? usuario.tipo_usuario : "admin";
    el("usuario-senha").value = "";
    el("usuario-senha").required = !usuario;
    el("ajuda-senha-usuario").textContent = usuario
      ? "Preencha apenas se quiser alterar a senha."
      : "Obrigatório para novos usuários.";
    el("modal-usuario").classList.remove("oculto");
  }

  function fecharModal() {
    el("modal-usuario").classList.add("oculto");
  }

  el("btn-novo-usuario").addEventListener("click", () => abrirModal(null));
  el("btn-fechar-modal-usuario").addEventListener("click", fecharModal);
  el("btn-cancelar-usuario").addEventListener("click", fecharModal);

  el("form-usuario").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const alerta = el("alerta-modal-usuario");
    alerta.innerHTML = "";
    const id = el("usuario-id").value;

    const payload = {
      nome: el("usuario-nome").value.trim(),
      email: el("usuario-email").value.trim(),
      tipo_usuario: el("usuario-perfil").value,
    };
    const senha = el("usuario-senha").value;
    if (senha) payload.senha = senha;

    try {
      if (id) {
        await MesaFacilAPI.put(`/api/usuarios/${id}`, payload);
      } else {
        await MesaFacilAPI.post("/api/usuarios", payload);
      }
      fecharModal();
      carregar();
    } catch (err) {
      alerta.innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  });

  async function alternarStatus(usuario) {
    try {
      await MesaFacilAPI.put(`/api/usuarios/${usuario.id_usuario}/status`, { ativo: !usuario.ativo });
      carregar();
    } catch (err) {
      el("alerta-usuarios").innerHTML = `<div class="alerta alerta-erro">${err.message}</div>`;
    }
  }

  carregar();
})();
