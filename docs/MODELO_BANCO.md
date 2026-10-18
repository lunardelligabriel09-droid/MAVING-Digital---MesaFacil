# Modelo de Banco de Dados — MesaFácil

Banco relacional MySQL 8, normalizado até a 3ª Forma Normal (3FN). Todas as
chaves estrangeiras usam `ON` implícito de `RESTRICT` (padrão do InnoDB), o
que impede exclusões que quebrariam o histórico de pedidos — por isso mesas,
categorias e produtos são **desativados** (`ativo`/`status`), nunca excluídos
fisicamente quando já possuem movimento.

## Diagrama entidade-relacionamento (conceitual)

```
CLIENTE (1) ──< (N) COMANDA (N) >── (1) MESA
                     │
                     │ (1)
                     ∨ (N)
                  PEDIDO (N) >── (1) STATUS_PEDIDO
                     │
                     │ (1)
                     ∨ (N)
               ITEM_PEDIDO (N) >── (1) PRODUTO (N) >── (1) CATEGORIA

USUARIO (independente — autentica administração, caixa e cozinha)
```

## Entidades

### CLIENTE
Pessoa identificada apenas pelo nome ao escanear o QR Code. Não possui senha
nem login — a "autenticação" do cliente é a posse física do link do QR Code
da mesa.

| Campo | Tipo | Observação |
|---|---|---|
| id_cliente | INT PK AI | |
| nome | VARCHAR(120) | |
| data_cadastro | DATETIME | default `NOW()` |

### USUARIO
Contas internas do restaurante (não confundir com CLIENTE).

| Campo | Tipo | Observação |
|---|---|---|
| id_usuario | INT PK AI | |
| nome | VARCHAR(120) | |
| email | VARCHAR(150) | UNIQUE |
| senha_hash | VARCHAR(255) | PBKDF2-SHA256 (werkzeug) |
| tipo_usuario | ENUM('admin','caixa','cozinha') | perfil de acesso |
| ativo | TINYINT(1) | soft-disable |

### MESA
| Campo | Tipo | Observação |
|---|---|---|
| id_mesa | INT PK AI | |
| numero | INT | UNIQUE |
| identificador_qr | VARCHAR(64) | UNIQUE — token opaco (`secrets.token_urlsafe`), não é o `id_mesa` |
| status | ENUM('ativa','inativa') | |

O token nunca expõe o `id_mesa` real: a URL do QR Code é
`APP_BASE_URL/mesa/<identificador_qr>` e o backend resolve a mesa a partir
dele (`GET /api/atendimento/mesa/:token`).

### CATEGORIA / PRODUTO
Cardápio. `PRODUTO.preco` é o preço **atual**; ao gerar um pedido, o preço é
copiado para `ITEM_PEDIDO.preco_unitario` (ver seção abaixo).

### STATUS_PEDIDO
Tabela de domínio, evita strings soltas espalhadas pelo código:
`RECEBIDO(1) → EM_PREPARO(2) → PRONTO(3) → ENTREGUE(4)`, com `CANCELADO(5)`
alcançável a partir de qualquer estado anterior a ENTREGUE.

### COMANDA
Sessão de atendimento de um CLIENTE em uma MESA. Pode conter vários PEDIDOs
enquanto `status = 'aberta'`. Fechada apenas pelo caixa, e somente quando não
há pedidos pendentes (RECEBIDO/EM_PREPARO/PRONTO).

### PEDIDO
Cada "rodada" enviada pelo cliente (ex.: pedido inicial e, depois, a
sobremesa) gera um novo registro em PEDIDO, sempre vinculado à mesma
COMANDA enquanto ela estiver aberta.

### ITEM_PEDIDO
Um item dentro de um PEDIDO. Contém `preco_unitario` e `subtotal` **fixos no
momento da compra** — mudanças futuras no preço do produto não afetam
pedidos já realizados. Isso é obrigatório para preservar o valor histórico
cobrado do cliente.

## Relacionamentos e cardinalidade

| Relação | Cardinalidade |
|---|---|
| CLIENTE → COMANDA | 1:N |
| MESA → COMANDA | 1:N |
| COMANDA → PEDIDO | 1:N |
| STATUS_PEDIDO → PEDIDO | 1:N |
| PEDIDO → ITEM_PEDIDO | 1:N |
| PRODUTO → ITEM_PEDIDO | 1:N |
| CATEGORIA → PRODUTO | 1:N |

## Por que está em 3FN

- Nenhum atributo depende apenas de parte de uma chave composta (não há
  chaves compostas nas tabelas transacionais).
- Nenhum atributo não-chave depende de outro atributo não-chave: por
  exemplo, `nome_categoria` **não** é armazenado em PRODUTO — é obtido via
  `JOIN` com CATEGORIA quando necessário.
- A única duplicação proposital de dado é `ITEM_PEDIDO.preco_unitario`, que
  não é uma violação de normalização: é um **snapshot histórico**
  obrigatório (o valor em PRODUTO muda ao longo do tempo; o valor cobrado
  numa venda específica não pode mudar retroativamente).
