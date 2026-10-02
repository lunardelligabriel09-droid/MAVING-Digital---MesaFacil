
const MesaFacilAPI = (() => {
  const TOKEN_KEY = "mesafacil_token";
  const USUARIO_KEY = "mesafacil_usuario";
  
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
