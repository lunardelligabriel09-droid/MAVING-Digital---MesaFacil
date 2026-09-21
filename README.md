# MesaFácil

Sistema integrado de gerenciamento de pedidos para a **Sabor & Mesa**, restaurante italiano tradicional de Curitiba. Projeto Integrador de
Desenvolvimento de Sistemas.

O cliente faz o pedido pelo próprio celular, escaneando o QR Code da mesa.
O pedido cai automaticamente na cozinha e no caixa. O sistema **não**
processa pagamentos — apenas controla pedidos, comandas e valores.


## 2. Tecnologias

- **Frontend**: HTML5, CSS3 (Flexbox/Grid, mobile-first, `@media print`), JavaScript ES6+ puro (sem frameworks).
- **Backend**: Python 3.12 + Flask (API REST).
- **Banco**: MySQL 8 (queries parametrizadas via `mysql-connector-python`).
- **Autenticação**: JWT (`PyJWT`) + hash de senha PBKDF2 (`werkzeug.security`).
- **QR Code**: geração server-side com a biblioteca `qrcode` (Python).

## 3. Estrutura de pastas

```
/database         schema.sql, seed.sql
/backend           app.py, config.py, seed.py
  /db               conexão MySQL (pool)
  /models           repositórios (SQL parametrizado)
  /services         regras de negócio
  /routes           blueprints da API REST
  /utils            auth (JWT), validação, respostas padronizadas, senha
  /uploads/produtos imagens enviadas pelo admin
/frontend
  /cliente          app mobile-first (QR → cardápio → carrinho → acompanhamento)
  /cozinha          painel de pedidos (cards, tablet/notebook)
  /caixa            comandas + impressão (notebook/desktop)
  /admin            login + CRUD de produtos/categorias/mesas/usuários
  /shared           css base, cliente de API (fetch), logo
/docs               API.md, MODELO_BANCO.md
.env.example
```

## 4. Pré-requisitos

- Python 3.12+
- MySQL Server 8+ em execução localmente
- Navegador atual (Chrome, Edge, Firefox)

## 5. Configuração do MySQL

Crie o banco e as tabelas com os scripts fornecidos. **Importante:** rode-os
apontando o cliente `mysql` para o arquivo diretamente (redirecionamento
`<`), não copiando/colando o conteúdo em outro terminal — isso evita
problemas de codificação com os acentos (UTF-8):

```powershell
mysql -u root -p --default-character-set=utf8mb4 < database/schema.sql
mysql -u root -p --default-character-set=utf8mb4 < database/seed.sql
```

Isso cria o banco `mesafacil`, as tabelas, os status de pedido, categorias,
produtos de exemplo e 10 mesas de exemplo (os tokens de QR Code reais são
gerados no passo do `seed.py`, abaixo).

### Ambiente sem serviço do Windows para o MySQL

Nesta máquina o MySQL Server foi instalado apenas com os binários (via
`winget`, sem privilégios para registrar um serviço do Windows). Os dados
ficam em `C:\Users\lunar\mysql-mesafacil-data` e o servidor precisa ser
iniciado manualmente a cada reinício do computador:

```powershell
powershell -ExecutionPolicy Bypass -File database\start-mysql.ps1
```

Isso sobe o `mysqld` em segundo plano na porta 3306. Para desligar
corretamente, use `database\stop-mysql.ps1` (pede a senha do root) em vez
de encerrar o processo à força.

Se o MySQL for instalado como serviço do Windows em outra máquina (via
MySQL Installer, com privilégios de administrador), este passo não é
necessário — o serviço já sobe sozinho.

## 6. Configuração do `.env`

```powershell
copy .env.example backend\.env
```

Edite `backend/.env` com o usuário/senha do seu MySQL local e, se quiser,
troque `JWT_SECRET` por uma string aleatória própria.

## 7. Instalação e execução do backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python seed.py      # cria usuários de teste e tokens de QR Code das mesas
python app.py        # sobe o servidor em http://localhost:5000
```

O próprio Flask serve o frontend estático (HTML/CSS/JS) e a API no mesmo
processo — não é necessário nenhum outro servidor para rodar localmente.
Em produção, o ideal seria servir o `/frontend` por um servidor web
dedicado (Nginx/Apache) e a API separadamente, mas isso não muda nenhuma
linha de código do frontend, que já é 100% estático.

## 8. Usuários de teste (criados por `seed.py`)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@mesafacil.com.br | admin123 |
| Caixa | caixa@mesafacil.com.br | caixa123 |
| Cozinha | cozinha@mesafacil.com.br | cozinha123 |

(as senhas podem ser trocadas via `SEED_ADMIN_PASSWORD` etc. no `.env` antes
de rodar `seed.py`)

## 9. Telas / URLs

| Área | URL |
|---|---|
| Cliente (via QR Code) | `http://localhost:5000/mesa/<token>` |
| Cozinha | `http://localhost:5000/cozinha` |
| Caixa | `http://localhost:5000/caixa` |
| Administração | `http://localhost:5000/admin/login` |

O `<token>` de cada mesa é impresso no console ao rodar `python seed.py`, e
também pode ser visto/gerado a qualquer momento em **Admin → Mesas & QR
Code**, que exibe a imagem do QR Code pronta para impressão.

## 10. Gerando e usando os QR Codes das mesas

1. Faça login como administrador em `/admin/login`.
2. Acesse **Mesas & QR Code**.
3. Clique em **Ver QR Code** na mesa desejada — a imagem é gerada
   server-side (`GET /api/mesas/:id/qrcode`) e pode ser impressa
   diretamente pelo botão **Imprimir**.
4. Para trocar o QR Code impresso de uma mesa (ex.: token comprometido),
   use **Gerar novo código** — o token antigo deixa de funcionar.

## 11. Endpoints da API

Documentação completa em [`docs/API.md`](docs/API.md).

## 12. Modelo de dados

Diagrama, entidades, relacionamentos e justificativa da 3FN em
[`docs/MODELO_BANCO.md`](docs/MODELO_BANCO.md).

## 13. Segurança implementada

- Senhas com hash PBKDF2-SHA256 (nunca armazenadas em texto puro).
- Autenticação via JWT com expiração configurável.
- Autorização por perfil (`admin`/`caixa`/`cozinha`) em cada rota protegida.
- Todas as queries usam parâmetros (`%s`), sem concatenação de SQL.
- Validação no backend independente da validação do frontend.
- Nenhuma credencial ou segredo fica no código-fonte (tudo via `.env`,
  fora do controle de versão).
- Token do QR Code é opaco (`secrets.token_urlsafe`), não expõe o
  `id_mesa` real do banco.

## 14. Responsividade

Testada nos breakpoints 320/375/390/430/768/1024/1280/1440px:
- **Cliente**: mobile-first, navegação inferior por abas, cardápio em
  lista de largura única em telas pequenas.
- **Cozinha**: grade de cards que se adapta de 1 a N colunas.
- **Caixa/Admin**: tabelas com rolagem horizontal própria em telas
  estreitas; barra lateral administrativa vira menu retrátil abaixo de
  900px.

## 15. Limitações conhecidas (escopo acadêmico)

- A identificação do cliente é feita apenas pelo nome informado (sem
  login/senha do cliente) — em caso de dois clientes com o mesmo nome na
  mesma mesa e mesmo período, o sistema reaproveita a comanda aberta mais
  recente com aquele nome. Isso é aceitável no escopo do projeto, já que o
  pagamento é sempre conferido manualmente pelo caixa antes do fechamento.
- Atualização de status usa *polling* (verificação periódica) em vez de
  WebSocket, por ser mais simples e suficientemente responsivo para o
  caso de uso de um restaurante