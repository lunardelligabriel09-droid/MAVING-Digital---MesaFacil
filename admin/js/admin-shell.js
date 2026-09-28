
const AdminShell = (() => {
  function protegerRota() {
    const usuario = MesaFacilAPI.getUsuario();
    if (!usuario || !MesaFacilAPI.getToken() || usuario.tipo_usuario !== "admin") {
      window.location.href = "/admin/login";
      throw new Error("redirecionando");
    }
    return usuario;
  }

  function inicializar() {
    const usuario = protegerRota();
    const nomeEl = document.getElementById("nome-usuario-admin");
    if (nomeEl) nomeEl.textContent = usuario.nome;

    document.querySelectorAll(".menu-admin a").forEach((link) => {
      if (link.getAttribute("href") === window.location.pathname) {
        link.classList.add("ativo");
      }
    });

    const btnSair = document.getElementById("btn-sair-admin");
    if (btnSair) {
      btnSair.addEventListener("click", () => {
        MesaFacilAPI.limparSessao();
        window.location.href = "/admin/login";
      });
    }

    const btnMenu = document.getElementById("btn-abrir-menu");
    const barraLateral = document.querySelector(".barra-lateral");
    if (btnMenu && barraLateral) {
      btnMenu.addEventListener("click", () => barraLateral.classList.toggle("aberta"));
    }

    return usuario;
  }

      return usuario;
  }


  return { inicializar };
})();
