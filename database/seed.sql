
-- MesaFácil - Dados iniciais --


USE mesafacil;


-- Status de pedido

INSERT INTO status_pedido (nome, descricao, ordem) VALUES
  ('RECEBIDO',    'Pedido recebido pela cozinha',        1),
  ('EM_PREPARO',  'Pedido em preparo',                   2),
  ('PRONTO',      'Pedido pronto para entrega',          3),
  ('ENTREGUE',    'Pedido entregue ao cliente',          4),
  ('CANCELADO',   'Pedido cancelado',                    5);


-- Categorias

INSERT INTO categoria (nome, descricao, ativo) VALUES
  ('Antipasti',   'Entradas tradicionais italianas',                 1),
  ('Massas',      'Massas artesanais da casa',                       1),
  ('Pizzas',      'Pizzas em forno a lenha',                         1),
  ('Carnes',      'Pratos principais com carnes',                   1),
  ('Sobremesas',  'Doces tradicionais italianos',                   1),
  ('Bebidas',     'Bebidas e vinhos selecionados',                  1);


-- Produtos

INSERT INTO produto (id_categoria, nome, descricao, preco, imagem, ativo) VALUES
  (1, 'Bruschetta Della Nonna', 'Pão italiano tostado com tomate, manjericão e azeite extra virgem', 28.90, NULL, 1),
  (1, 'Carpaccio Classico',      'Fatias finas de carne, alcaparras, rúcula e lascas de parmesão',     42.90, NULL, 1),
  (2, 'Fettuccine Alfredo',      'Massa fresca ao molho cremoso de queijo parmesão',                   54.90, NULL, 1),
  (2, 'Spaghetti alla Carbonara','Massa artesanal, pancetta, gema de ovo e pecorino',                  56.90, NULL, 1),
  (2, 'Ravioli di Ricotta',      'Ravióli recheado de ricota e espinafre ao molho de manteiga e sálvia',58.90, NULL, 1),
  (3, 'Pizza Margherita',        'Molho de tomate, mussarela de búfala e manjericão fresco',           49.90, NULL, 1),
  (3, 'Pizza Quattro Formaggi',  'Mussarela, gorgonzola, parmesão e provolone',                        57.90, NULL, 1),
  (4, 'Ossobuco alla Milanese',  'Ossobuco cozido lentamente, risoto de açafrão',                      89.90, NULL, 1),
  (4, 'Scaloppine al Limone',    'Escalopes de mignon ao molho de limão siciliano',                    74.90, NULL, 1),
  (5, 'Tiramisù della Casa',     'Sobremesa tradicional com café, mascarpone e cacau',                 26.90, NULL, 1),
  (5, 'Panna Cotta',             'Creme italiano com calda de frutas vermelhas',                       22.90, NULL, 1),
  (6, 'Água Mineral 500ml',      'Com ou sem gás',                                                      7.90, NULL, 1),
  (6, 'Refrigerante Lata',       'Diversos sabores',                                                    8.90, NULL, 1),
  (6, 'Taça de Vinho Tinto',     'Seleção da casa',                                                    32.90, NULL, 1),
  (6, 'Água com Gás 500ml',      'Gelada',                                                              7.90, NULL, 1);


-- Mesas de exemplo (identificador_qr provisorio, regenerado
-- por backend/seed.py com token seguro real)

INSERT INTO mesa (numero, identificador_qr, status) VALUES
  (1,  'seed-mesa-01', 'ativa'),
  (2,  'seed-mesa-02', 'ativa'),
  (3,  'seed-mesa-03', 'ativa'),
  (4,  'seed-mesa-04', 'ativa'),
  (5,  'seed-mesa-05', 'ativa'),
  (6,  'seed-mesa-06', 'ativa'),
  (7,  'seed-mesa-07', 'ativa'),
  (8,  'seed-mesa-08', 'ativa'),
  (9,  'seed-mesa-09', 'ativa'),
  (10, 'seed-mesa-10', 'ativa');
