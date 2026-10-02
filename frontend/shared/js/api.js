
const MesaFacilAPI = (() => {
  const TOKEN_KEY = "mesafacil_token";
  const USUARIO_KEY = "mesafacil_usuario";
  
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

   function getUsuario() {
    const raw = localStorage.getItem(USUARIO_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  
  function setSessao(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  }

   function limparSessao() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }

  
  async function request(method, path, { body, autenticado = true, isFormData = false } = {}) {
    const headers = {};
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

     if (autenticado) {
      const token = getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

        const options = { method, headers };
    if (body !== undefined) {
      options.body = isFormData ? body : JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(path, options);
    } catch (err) {
      throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão.", 0);
    }

        if (response.status === 401 && autenticado) {
      limparSessao();
    }

    let payload = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await response.json().catch(() => null);
    }

        if (!response.ok) {
      const mensagem = payload?.mensagem || `Erro inesperado (HTTP ${response.status}).`;
      throw new ApiError(mensagem, response.status, payload?.detalhes);
    }

    return payload;
  }

  



  class ApiError extends Error {
    constructor(message, status, details) {
      super(message);
      this.status = status;
      this.details = details;
    }
  }

  return {
    get: (path, opts) => request("GET", path, opts),
    post: (path, body, opts) => request("POST", path, { ...opts, body }),
    put: (path, body, opts) => request("PUT", path, { ...opts, body }),
    del: (path, opts) => request("DELETE", path, opts),
    postForm: (path, formData, opts) => request("POST", path, { ...opts, body: formData, isFormData: true }),
    getToken,
    getUsuario,
    setSessao,
    limparSessao,
    ApiError,
  };
})();