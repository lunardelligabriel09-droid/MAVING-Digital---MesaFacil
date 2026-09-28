(() => {
  AdminShell.inicializar();

  async function carregarIndicadores() {
    try {
      const [mesas, produtos, comandas, pedidosCozinha] = await Promise.all([
        MesaFacilAPI.get("/api/mesas"),
        MesaFacilAPI.get("/api/produtos"),
        MesaFacilAPI.get("/api/comandas?status=aberta"),
        MesaFacilAPI.get("/api/pedidos/cozinha"),
      ]);

      document.getElementById("ind-mesas").textContent = mesas.dados.filter((m) => m.status === "ativa").length;
      document.getElementById("ind-produtos").textContent = produtos.dados.filter((p) => p.ativo).length;
      document.getElementById("ind-comandas").textContent = comandas.dados.length;
      document.getElementById("ind-pedidos").textContent = pedidosCozinha.dados.length;
    } catch (err) {
      console.error(err);
    }
  }

  carregarIndicadores();
})();
