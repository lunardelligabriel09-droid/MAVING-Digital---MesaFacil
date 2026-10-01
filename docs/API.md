# API REST — MesaFácil

Base URL local: `http://localhost:5000`

Todas as respostas são JSON no formato:

```json
{ "sucesso": true, "dados": { }, "mensagem": "opcional" }
{ "sucesso": false, "mensagem": "erro legível", "detalhes": { } }
```

Rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>` obtido
em `POST /api/auth/login`. Perfis: `admin`, `caixa`, `cozinha`.

---

## Autenticação

### POST /api/auth/login
Público. Body: `{ "email": "...", "senha": "..." }`
Retorna `{ token, usuario: { id_usuario, nome, email, tipo_usuario } }`.

---

## Atendimento do cliente (QR Code)

### GET /api/atendimento/mesa/:token
Público. Resolve o token do QR Code em uma mesa ativa. Usado para exibir
"Mesa 05" antes de pedir o nome. 404 se o token não existir ou a mesa
estiver inativa.

### POST /api/atendimento/iniciar
Público. Body: `{ "token": "...", "nome": "..." }`. Cria/recupera o
CLIENTE pelo nome, cria/recupera a COMANDA aberta daquela mesa+cliente.
Retorna `{ mesa, cliente, comanda }`.

### POST /api/atendimento/retomar
Público. Body: `{ "token": "...", "id_comanda": 10 }`. Revalida uma sessão
salva no navegador (ex.: após recarregar a página) sem pedir o nome de novo.

---

## Clientes

### POST /api/clientes
Público. Body: `{ "nome": "..." }`.

### GET /api/clientes/:id
Perfis: `admin`, `caixa`.

---

## Mesas

### GET /api/mesas
Perfis: `admin`, `caixa`.

### GET /api/mesas/:id
Perfis: `admin`, `caixa`.

### POST /api/mesas
Perfil: `admin`. Body: `{ "numero": 11 }`. Gera automaticamente um token
seguro de QR Code.

### PUT /api/mesas/:id
Perfil: `admin`. Body: `{ "numero": 11, "status": "ativa" }` (status opcional).

### PUT /api/mesas/:id/status
Perfil: `admin`. Body: `{ "status": "ativa" | "inativa" }`.

### POST /api/mesas/:id/regenerar-qrcode
Perfil: `admin`. Invalida o QR Code impresso atual e gera um novo token.

### GET /api/mesas/:id/qrcode
Perfil: `admin`. Retorna a imagem PNG do QR Code (aponta para
`APP_BASE_URL/mesa/<token>`).

### DELETE /api/mesas/:id
Perfil: `admin`. Se a mesa já possui comandas, é apenas desativada em vez
de excluída (preserva histórico).

---

## Categorias

### GET /api/categorias `?ativas=1`
Público (usado pelo cardápio do cliente).

### GET /api/categorias/:id
Público.

### POST /api/categorias · PUT /api/categorias/:id
Perfil: `admin`.

### PUT /api/categorias/:id/status
Perfil: `admin`. Body: `{ "ativo": true|false }`.

### DELETE /api/categorias/:id
Perfil: `admin`. Soft-disable (nunca exclui fisicamente).

---

## Produtos

### GET /api/produtos `?ativos=1&id_categoria=2&busca=pizza`
Público.

### GET /api/produtos/:id
Público.

### POST /api/produtos · PUT /api/produtos/:id
Perfil: `admin`. Body: `{ id_categoria, nome, preco, descricao, imagem }`.

### PUT /api/produtos/:id/status
Perfil: `admin`. Body: `{ "ativo": true|false }`.

### DELETE /api/produtos/:id
Perfil: `admin`. Soft-disable.

### POST /api/produtos/imagem
Perfil: `admin`. `multipart/form-data` com campo `arquivo` (PNG/JPG/WEBP).
Retorna `{ imagem: "/uploads/produtos/xxxx.png" }` para ser salvo no produto.

---

## Comandas

### GET /api/comandas `?status=aberta|fechada`
Perfis: `admin`, `caixa`.

### GET /api/comandas/:id
Perfis: `admin`, `caixa`. Retorna a comanda com todos os pedidos, itens e
`valor_total` (soma dos pedidos não cancelados).

### PUT /api/comandas/:id/fechar
Perfis: `admin`, `caixa`. Recusa (`409`) se houver pedidos ainda não
entregues/cancelados.

---

## Pedidos

### POST /api/pedidos
Público (feito pelo cliente). Body:
```json
{ "id_comanda": 10, "itens": [ { "id_produto": 3, "quantidade": 2, "observacao": "sem cebola" } ] }
```
Cria o pedido com status inicial `RECEBIDO`. Preço é copiado do produto no
momento da criação.

### GET /api/pedidos/cozinha
Perfis: `cozinha`, `admin`. Lista pedidos com status
RECEBIDO/EM_PREPARO/PRONTO, ordenados do mais antigo para o mais novo.

### GET /api/pedidos/cliente/:id_cliente
Público. Usado pelo cliente para acompanhar o próprio pedido (polling).

### GET /api/pedidos/:id
Público.

### PUT /api/pedidos/:id/status
Perfis: `cozinha`, `admin`. Body: `{ "status": "EM_PREPARO" }`. Só aceita
transições válidas: RECEBIDO→EM_PREPARO→PRONTO→ENTREGUE, com CANCELADO
disponível a qualquer momento antes de ENTREGUE.

---

## Status de pedido

### GET /api/status-pedido
Público. Lista o domínio de status (`RECEBIDO`, `EM_PREPARO`, `PRONTO`,
`ENTREGUE`, `CANCELADO`) na ordem do fluxo.

---

## Usuários (administração)

### GET /api/usuarios · GET /api/usuarios/:id
Perfil: `admin`.

### POST /api/usuarios
Perfil: `admin`. Body: `{ nome, email, senha, tipo_usuario }`.

### PUT /api/usuarios/:id
Perfil: `admin`. Body: `{ nome, email, tipo_usuario, senha? }` (senha
opcional, só altera se enviada).

### PUT /api/usuarios/:id/status
Perfil: `admin`. Body: `{ "ativo": true|false }`.

---

## Códigos HTTP usados

| Código | Significado |
|---|---|
| 200 | sucesso |
| 201 | recurso criado |
| 400 | validação falhou (campo ausente/ inválido) |
| 401 | não autenticado / credenciais inválidas / token expirado |
| 403 | autenticado, mas sem permissão para o perfil exigido |
| 404 | recurso não encontrado |
| 405 | método HTTP não suportado na rota |
| 409 | conflito de regra de negócio (ex.: fechar comanda com pedidos pendentes) |
| 500 | erro interno |
