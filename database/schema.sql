
-- MesaFacil - Schema do banco de dados 

CREATE DATABASE IF NOT EXISTS mesafacil
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mesafacil;


-- CLIENTE --

CREATE TABLE cliente (
  id_cliente     INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(120)  NOT NULL,
  data_cadastro  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;



-- USUARIO --

CREATE TABLE usuario (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(120)  NOT NULL,
  email          VARCHAR(150)  NOT NULL,
  senha_hash     VARCHAR(255)  NOT NULL,
  tipo_usuario   ENUM('admin','caixa','cozinha') NOT NULL,
  ativo          TINYINT(1)    NOT NULL DEFAULT 1,
  UNIQUE KEY uq_usuario_email (email)
) ENGINE=InnoDB;



-- MESA --

CREATE TABLE mesa (
  id_mesa            INT AUTO_INCREMENT PRIMARY KEY,
  numero             INT           NOT NULL,
  identificador_qr   VARCHAR(64)   NOT NULL,
  status             ENUM('ativa','inativa') NOT NULL DEFAULT 'ativa',
  UNIQUE KEY uq_mesa_numero (numero),
  UNIQUE KEY uq_mesa_qr (identificador_qr)
) ENGINE=InnoDB;


-- CATEGORIA --

CREATE TABLE categoria (
  id_categoria   INT AUTO_INCREMENT PRIMARY KEY,
  nome           VARCHAR(80)   NOT NULL,
  descricao      VARCHAR(255)  NULL,
  ativo          TINYINT(1)    NOT NULL DEFAULT 1
) ENGINE=InnoDB;


-- PRODUTO --

CREATE TABLE produto (
  id_produto     INT AUTO_INCREMENT PRIMARY KEY,
  id_categoria   INT            NOT NULL,
  nome           VARCHAR(120)   NOT NULL,
  descricao      VARCHAR(500)   NULL,
  preco          DECIMAL(10,2)  NOT NULL,
  imagem         VARCHAR(255)   NULL,
  ativo          TINYINT(1)     NOT NULL DEFAULT 1,
  CONSTRAINT fk_produto_categoria FOREIGN KEY (id_categoria)
    REFERENCES categoria (id_categoria),
  CONSTRAINT chk_produto_preco CHECK (preco >= 0),
  INDEX idx_produto_categoria (id_categoria)
) ENGINE=InnoDB;


-- STATUS_PEDIDO --

CREATE TABLE status_pedido (
  id_status   INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(30)   NOT NULL,
  descricao   VARCHAR(120)  NULL,
  ordem       INT           NOT NULL,
  UNIQUE KEY uq_status_nome (nome)
) ENGINE=InnoDB;


-- COMANDA --

CREATE TABLE comanda (
  id_comanda       INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente       INT       NOT NULL,
  id_mesa          INT       NOT NULL,
  data_abertura    DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_fechamento  DATETIME  NULL,
  status           ENUM('aberta','fechada') NOT NULL DEFAULT 'aberta',
  CONSTRAINT fk_comanda_cliente FOREIGN KEY (id_cliente)
    REFERENCES cliente (id_cliente),
  CONSTRAINT fk_comanda_mesa FOREIGN KEY (id_mesa)
    REFERENCES mesa (id_mesa),
  INDEX idx_comanda_mesa_status (id_mesa, status)
) ENGINE=InnoDB;


-- PEDIDO --

CREATE TABLE pedido (
  id_pedido   INT AUTO_INCREMENT PRIMARY KEY,
  id_comanda  INT       NOT NULL,
  id_status   INT       NOT NULL,
  data_hora   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_comanda FOREIGN KEY (id_comanda)
    REFERENCES comanda (id_comanda),
  CONSTRAINT fk_pedido_status FOREIGN KEY (id_status)
    REFERENCES status_pedido (id_status),
  INDEX idx_pedido_status (id_status),
  INDEX idx_pedido_comanda (id_comanda)
) ENGINE=InnoDB;


-- ITEM_PEDIDO --

CREATE TABLE item_pedido (
  id_item_pedido  INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido       INT            NOT NULL,
  id_produto      INT            NOT NULL,
  quantidade      INT            NOT NULL,
  preco_unitario  DECIMAL(10,2)  NOT NULL,
  observacao      VARCHAR(255)   NULL,
  subtotal        DECIMAL(10,2)  NOT NULL,
  CONSTRAINT fk_item_pedido_pedido FOREIGN KEY (id_pedido)
    REFERENCES pedido (id_pedido),
  CONSTRAINT fk_item_pedido_produto FOREIGN KEY (id_produto)
    REFERENCES produto (id_produto),
  CONSTRAINT chk_item_quantidade CHECK (quantidade > 0),
  CONSTRAINT chk_item_preco CHECK (preco_unitario >= 0),
  INDEX idx_item_pedido (id_pedido)
) ENGINE=InnoDB;
