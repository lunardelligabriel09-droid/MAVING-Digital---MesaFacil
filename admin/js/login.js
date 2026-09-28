(() => {
  const usuario = MesaFacilAPI.getUsuario();
  if (usuario && MesaFacilAPI.getToken() && usuario.tipo_usuario === "admin") {
    window.location.href = "/admin/dashboard";
    return;
  }

  document.getElementById("form-login").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const alerta = document.getElementById("alerta-login");
    alerta.innerHTML = "";
    const email = document.getElementById("input-email").value.trim();
    const senha = document.getElementById("input-senha").value;

    try {
      const resultado = await MesaFacilAPI.post("/api/auth/login", { email, senha }, { autenticado: false });
      if (resultado.dados.usuario.tipo_usuario !== "admin") {
        alerta.innerHTML = '<div class="alerta alerta-erro">Esta conta não tem acesso à área administrativa.</div>';
        return;
      }
      MesaFacilAPI.setSessao(resultado.dados.token, resultado.dados.usuario);
      window.location.href = "/admin/dashboard";
    } catch (err) {
     
  });
})();
