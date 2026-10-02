
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