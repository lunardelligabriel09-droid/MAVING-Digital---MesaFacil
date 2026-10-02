
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